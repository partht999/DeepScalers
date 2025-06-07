from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from django.conf import settings
from django.core.cache import cache
from rest_framework.throttling import UserRateThrottle
import os
import logging
import traceback
from rest_framework.permissions import AllowAny
import json
import google.generativeai as genai
import asyncio
from asgiref.sync import async_to_sync
from functools import partial

# Configure logging
logger = logging.getLogger('faq_handler')

# Configure Gemini
genai.configure(api_key="AIzaSyC2wc4qKrB-oXKYHakv1PWvnk97uAC13V0")
model = genai.GenerativeModel(
    "gemini-1.5-flash",
    generation_config={
        "temperature": 0.3,  # Lower temperature for more focused responses
        "top_p": 0.8,
        "top_k": 20,
        "max_output_tokens": 1024,  # Reduced for faster generation
        "candidate_count": 1  # Only generate one response
    },
    safety_settings=[
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        }
    ]
)

class FAQHandlerView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [UserRateThrottle]
    rate = '100/hour'  # Rate limit: 100 requests per hour
    SIMILARITY_THRESHOLD = 0.5
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        logger.info("Initializing FAQHandlerView")
        try:
            # Load model only once and reuse
            if not hasattr(self, 'model'):
                logger.info("Loading SentenceTransformer model...")
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("SentenceTransformer model loaded successfully")
            
            # Initialize Qdrant client with optimized settings
            logger.info(f"Initializing Qdrant client with URL: {settings.QDRANT_URL}")
            self.qdrant_client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY,
                timeout=5.0,  # Reduced timeout
                prefer_grpc=True  # Use gRPC for faster communication
            )
            logger.info("Qdrant client initialized successfully")
            
            # Verify collection exists
            collections = self.qdrant_client.get_collections()
            collection_names = [c.name for c in collections.collections]
            logger.info(f"Available Qdrant collections: {collection_names}")
            
            if "student_faqs" not in collection_names:
                logger.warning("student_faqs collection not found in Qdrant")
            else:
                logger.info("student_faqs collection found in Qdrant")
                
        except Exception as e:
            logger.error(f"Error initializing FAQHandlerView: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise

    def get_gemini_response(self, question: str) -> str:
        try:
            logger.info(f"Getting Gemini response for question: {question}")
            response = model.generate_content(
                f"Please provide a concise answer to: {question}"
            )
            if not response or not response.text:
                logger.error("Empty response from Gemini API")
                return "I apologize, but I received an empty response from the AI model."
            
            answer = response.text
            logger.info(f"Received Gemini response: {answer}")
            return answer
        except Exception as e:
            logger.error(f"Error getting Gemini response: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return "I apologize, but I'm having trouble generating a response at the moment. Please try again."

    def get(self, request):
        return Response({"message": "FAQ endpoint is working"}, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            question = request.data.get('question')
            if not question:
                logger.warning("No question provided in request")
                return Response(
                    {"error": "Question is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check cache first
            cache_key = f"faq_response_{hash(question)}"
            cached_response = cache.get(cache_key)
            if cached_response:
                logger.info("Returning cached response")
                return Response(cached_response, status=status.HTTP_200_OK)
            
            logger.info(f"Processing question: {question}")
            
            # Encode the question
            logger.debug("Encoding question with SentenceTransformer")
            question_vector = self.model.encode(question)
            logger.debug(f"Question vector shape: {question_vector.shape}")
            
            # Search in Qdrant with optimized parameters
            logger.debug("Searching in Qdrant collection")
            search_result = self.qdrant_client.search(
                collection_name="student_faqs",
                query_vector=question_vector,
                limit=1,
                score_threshold=0.5,  # Add score threshold to filter results early
                with_payload=True,
                with_vectors=False  # Don't return vectors to reduce response size
            )
            logger.debug(f"Search results: {json.dumps([{'score': r.score, 'payload': r.payload} for r in search_result], indent=2)}")
            
            if not search_result:
                logger.info("No matching FAQ found, using Gemini")
                gemini_answer = self.get_gemini_response(question)
                response_data = {
                    "answer": f"Answer from AI: {gemini_answer}",
                    "confidence": 0.0,
                    "threshold": self.SIMILARITY_THRESHOLD,
                    "matched": False,
                    "source": "gemini"
                }
                # Cache the response
                cache.set(cache_key, response_data, timeout=3600)  # Cache for 1 hour
                return Response(response_data, status=status.HTTP_200_OK)
            
            # Get the best match
            best_match = search_result[0]
            confidence_score = best_match.score
            logger.info(f"Found matching FAQ with score: {confidence_score}")
            
            # Check if the similarity score is above threshold
            if confidence_score < self.SIMILARITY_THRESHOLD:
                logger.info(f"FAQ confidence score {confidence_score} below threshold {self.SIMILARITY_THRESHOLD}, using Gemini")
                gemini_answer = self.get_gemini_response(question)
                response_data = {
                    "answer": f"Answer from AI: {gemini_answer}",
                    "confidence": confidence_score,
                    "threshold": self.SIMILARITY_THRESHOLD,
                    "matched": False,
                    "source": "gemini"
                }
                # Cache the response
                cache.set(cache_key, response_data, timeout=3600)  # Cache for 1 hour
                return Response(response_data, status=status.HTTP_200_OK)
            
            # If we get here, we have a good FAQ match
            response_data = {
                "answer": f"Answer from FAQ: {best_match.payload.get('answer', '')}",
                "confidence": confidence_score,
                "threshold": self.SIMILARITY_THRESHOLD,
                "matched": True,
                "source": "faq"
            }
            # Cache the response
            cache.set(cache_key, response_data, timeout=3600)  # Cache for 1 hour
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error processing FAQ request: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": "An error occurred while processing your question"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            