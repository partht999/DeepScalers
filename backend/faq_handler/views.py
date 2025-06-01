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
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from qdrant_client.http import models
from dotenv import load_dotenv
from rest_framework.permissions import AllowAny

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Create your views here.

class FAQHandlerView(APIView):
    permission_classes = [AllowAny]
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
            
            # Collection name for student FAQs
            self.collection_name = "student_faqs"
            
            # Similarity threshold (lowered for testing)
            self.similarity_threshold = 0.5
            
            # Verify Qdrant connection
            try:
                collections = self.qdrant_client.get_collections()
                collection_names = [collection.name for collection in collections.collections]
                logger.info(f"Available collections: {collection_names}")
                
                if self.collection_name not in collection_names:
                    logger.error(f"Collection {self.collection_name} not found in Qdrant!")
                    raise Exception(f"Collection {self.collection_name} not found in Qdrant")
                logger.info(f"Verified Qdrant collection: {self.collection_name}")
                
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

            # Search in Qdrant
            logger.info("Searching in Qdrant...")
            search_result = self.qdrant_client.search(
                collection_name=self.collection_name,
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
                    "similarity_threshold": self.similarity_threshold
                })
            else:
                # No match found
                logger.info("No match found above threshold")
                return Response({
                    "message": "No match found. Forwarded to faculty.",
                    "question": question,
                    "similarity_score": search_result[0].score if search_result else None,
                    "similarity_threshold": self.similarity_threshold
                })

        except Exception as e:
            error_msg = f"Error processing question: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            return Response(
                {
                    "error": error_msg,
                    "traceback": traceback.format_exc()
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Initialize the sentence transformer model globally
model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize Qdrant client globally
qdrant_client = QdrantClient(
    url=os.getenv('QDRANT_URL', 'http://localhost:6333'),
    api_key=os.getenv('QDRANT_API_KEY'),
    timeout=10.0
)

@csrf_exempt
@require_http_methods(["POST"])
def ask_question(request):
    try:
        # Log the raw request body
        logger.info(f"Raw request body: {request.body}")
        
        # Parse the request body
        data = json.loads(request.body)
        question = data.get('question')
        
        logger.info(f"Received question: {question}")
        
        if not question:
            logger.error("No question provided in request")
            return JsonResponse({'error': 'No question provided'}, status=400)
        
        # Log Qdrant configuration
        logger.info(f"Qdrant URL: {os.getenv('QDRANT_URL')}")
        logger.info(f"Collection name: student_faqs")
        
        # Convert question to embedding
        logger.info("Converting question to embedding...")
        question_embedding = model.encode(question)
        logger.info("Question converted to embedding successfully")
        
        # Search in Qdrant
        search_result = qdrant_client.search(
            collection_name="student_faqs",
            query_vector=question_embedding,
            limit=1
        )
        
        logger.info(f"Search result: {search_result}")
        
        if search_result and len(search_result) > 0:
            # Get the most relevant answer
            answer = search_result[0].payload.get('answer')
            score = search_result[0].score
            
            logger.info(f"Found answer with score {score}: {answer}")
            
            return JsonResponse({
                'answer': answer,
                'score': score
            })
        else:
            logger.info("No matching answer found in Qdrant")
            return JsonResponse({'answer': None})
            
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)
