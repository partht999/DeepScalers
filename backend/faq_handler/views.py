from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from django.conf import settings
import os
import logging
import traceback
from rest_framework.permissions import AllowAny

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FAQHandlerView(APIView):
    permission_classes = [AllowAny]
    COLLECTION_NAME = "student_faqs"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            # Initialize the sentence transformer model
            logger.info("Initializing SentenceTransformer model...")
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("SentenceTransformer model initialized successfully")
            
            # Initialize Qdrant client with Django settings
            logger.info("Initializing Qdrant client...")
            qdrant_url = settings.QDRANT_URL
            qdrant_api_key = settings.QDRANT_API_KEY
            
            if not qdrant_url or qdrant_url.startswith('http://localhost'):
                raise ValueError("QDRANT_URL must be set to a valid cloud URL")
            
            self.qdrant_client = QdrantClient(
                url=qdrant_url,
                api_key=qdrant_api_key,
                timeout=10.0
            )
            logger.info("Qdrant client initialized successfully")
            
            # Similarity threshold (lowered for testing)
            self.similarity_threshold = 0.5
            
            # Verify Qdrant connection and collection
            try:
                collections = self.qdrant_client.get_collections()
                collection_names = [collection.name for collection in collections.collections]
                logger.info(f"Available collections: {collection_names}")
                
                if self.COLLECTION_NAME not in collection_names:
                    logger.error(f"Collection {self.COLLECTION_NAME} not found in Qdrant!")
                    raise Exception(f"Collection {self.COLLECTION_NAME} not found in Qdrant")
                logger.info(f"Verified Qdrant collection: {self.COLLECTION_NAME}")
                
            except Exception as e:
                logger.error(f"Error verifying Qdrant collection: {str(e)}")
                logger.error(traceback.format_exc())
                raise
            
        except Exception as e:
            logger.error(f"Error in FAQHandlerView initialization: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    def get(self, request):
        """Test endpoint to verify the view is accessible"""
        return Response({"message": "FAQ endpoint is working!"})

    def post(self, request):
        try:
            logger.info(f"Received request data: {request.data}")
            question = request.data.get('question')
            logger.info(f"Processing question: {question}")
            
            if not question:
                return Response(
                    {"error": "Question is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Convert question to embedding
            logger.info("Converting question to embedding...")
            question_embedding = self.model.encode(question)
            logger.info("Question converted to embedding successfully")

            # Search in Qdrant - only in student_faqs collection
            logger.info(f"Searching in Qdrant collection: {self.COLLECTION_NAME}")
            search_result = self.qdrant_client.search(
                collection_name=self.COLLECTION_NAME,
                query_vector=question_embedding,
                limit=1
            )
            logger.info(f"Search completed. Results: {search_result}")

            if search_result and search_result[0].score >= self.similarity_threshold:
                # Return the stored answer
                answer = search_result[0].payload.get('answer')
                score = search_result[0].score
                logger.info(f"Found answer with score {score}: {answer}")
                return Response({
                    "answer": answer,
                    "similarity_score": score,
                    "similarity_threshold": self.similarity_threshold,
                    "collection_used": self.COLLECTION_NAME
                })
            else:
                # No match found
                logger.info("No match found above threshold")
                return Response({
                    "message": "No match found. Forwarded to faculty.",
                    "question": question,
                    "similarity_score": search_result[0].score if search_result else None,
                    "similarity_threshold": self.similarity_threshold,
                    "collection_used": self.COLLECTION_NAME
                })

        except Exception as e:
            error_msg = f"Error processing question: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            return Response(
                {
                    "error": error_msg,
                    "traceback": traceback.format_exc(),
                    "collection_used": self.COLLECTION_NAME
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
