from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import Question, Answer, KnowledgeBase
from .serializers import QuestionSerializer, AnswerSerializer, KnowledgeBaseSerializer
from .ai_service import AIService
from django.contrib.auth import get_user_model
import PyPDF2
from rest_framework.views import APIView
from django.core.files.storage import default_storage
import logging
import os
import tempfile
from pathlib import Path
from groq import Groq
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from sentence_transformers import SentenceTransformer
import uuid
import re

User = get_user_model()
ai_service = AIService()
logger = logging.getLogger(__name__)

# Configure Groq
client = Groq(api_key=os.getenv('GROQ_API_KEY', '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'))

# Configure Qdrant
qdrant_client = QdrantClient(
    url=os.getenv('QDRANT_URL', 'https://7775af46-4796-47d4-ab44-00c855e262f0.europe-west3-0.gcp.cloud.qdrant.io:6333'),
    api_key=os.getenv('QDRANT_API_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.a_inwL3e0AkODn1eTDyN5crtGKHQGZ0ddIh1wHvHCLY')
)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_qa_pairs(text):
    """Generate Q&A pairs from text using Groq."""
    try:
        prompt = f"""
        Generate comprehensive question-answer pairs based on the following content. 
        Make sure to cover all important concepts, details, and nuances from the text.
        Generate at least 5-7 detailed Q&A pairs that thoroughly cover the content.

        Guidelines:
        1. Questions should be specific and detailed
        2. Answers should be comprehensive and well-explained
        3. Include both basic and advanced concepts
        4. Cover all major topics and subtopics
        5. Include examples where relevant
        6. Make sure answers are self-contained and complete

        Content to analyze:
        \"\"\"{text}\"\"\"

        Format the output as:
        1. **Question:** [Detailed question about a specific aspect]
           **Answer:** [Comprehensive answer with explanations, examples, and relevant details]

        2. **Question:** [Next detailed question]
           **Answer:** [Next comprehensive answer]
        """

        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=1,               # creativity level (0.0-1.0)
            max_tokens=2000,            # max tokens in response
            top_p=1,                    # nucleus sampling
            stream=True,                # stream response chunk-by-chunk
            stop=None
        )
        
        # Collect the streamed response
        full_response = ""
        for chunk in completion:
            if chunk.choices[0].delta.content:
                full_response += chunk.choices[0].delta.content

        qa_output = full_response
        logger.info("Generated Q&A pairs from text")

        # Parse Q&A pairs
        faq_data = []
        qa_pairs = re.findall(r"\*\*Question:\*\*\s*(.*?)\n\s*\*\*Answer:\*\*\s*(.*?)(?=\n\d+\.|\Z)", qa_output, re.DOTALL)

        for q, a in qa_pairs:
            faq_data.append({
                "question": q.strip(),
                "answer": a.strip()
            })

        if not faq_data:
            logger.warning("No Q&A pairs found in Groq's response")
            return []

        logger.info(f"Generated {len(faq_data)} Q&A pairs")
        return faq_data
    except Exception as e:
        logger.error(f"Error generating Q&A pairs: {str(e)}")
        return []

def upload_to_qdrant(faq_data):
    """Upload Q&A pairs to Qdrant."""
    try:
        collection_name = "student_faqs"
        if not qdrant_client.collection_exists(collection_name):
            qdrant_client.recreate_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )

        # Create and upload Qdrant points
        points = []
        for item in faq_data:
            embedding = embedding_model.encode(item["question"]).tolist()
            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload=item
                )
            )

        qdrant_client.upsert(collection_name=collection_name, points=points)
        logger.info(f"Successfully uploaded {len(points)} Q&A pairs to Qdrant")
        return True
    except Exception as e:
        logger.error(f"Error uploading to Qdrant: {str(e)}")
        return False

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:  # Faculty can see all questions
            return Question.objects.all()
        return Question.objects.filter(student=user)  # Students can only see their questions
    
    def perform_create(self, serializer):
        question = serializer.save(student=self.request.user)
        
        # Try to find an answer in the knowledge base
        best_answer = ai_service.find_best_answer(question.text)
        
        if best_answer:
            answer_text, confidence = best_answer
            # Create an answer from the knowledge base
            Answer.objects.create(
                question=question,
                faculty=User.objects.filter(is_staff=True).first(),  # Assign to first faculty member
                text=answer_text,
                is_verified=True
            )
            question.status = 'answered'
            question.save()
        else:
            # No confident answer found, question remains pending
            question.status = 'pending'
            question.save()

class AnswerViewSet(viewsets.ModelViewSet):
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:  # Faculty can see all answers
            return Answer.objects.all()
        return Answer.objects.filter(question__student=user)  # Students can see answers to their questions
    
    def perform_create(self, serializer):
        answer = serializer.save(faculty=self.request.user)
        
        # Update the question status
        question = answer.question
        question.status = 'answered'
        question.save()
        
        # Add to knowledge base
        ai_service.add_to_knowledge_base(
            question=question.text,
            answer=answer.text,
            confidence_score=1.0 if answer.is_verified else 0.5
        )

class KnowledgeBaseViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeBaseSerializer
    permission_classes = [IsAuthenticated]
    queryset = KnowledgeBase.objects.all()
    
    def get_queryset(self):
        # Only faculty can access the knowledge base
        if not self.request.user.is_staff:
            return KnowledgeBase.objects.none()
        return super().get_queryset()
    
    @action(detail=False, methods=['post'])
    def search(self, request):
        """Search the knowledge base for similar questions."""
        question = request.data.get('question')
        if not question:
            return Response(
                {'error': 'Question is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        similar_questions = ai_service.search_similar_questions(question)
        return Response(similar_questions)

class PDFTextView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        temp_dir = None
        try:
            logger.info("Received PDF extraction request")
            
            if 'pdf_file' not in request.FILES:
                logger.error("No PDF file provided in request")
                return Response(
                    {'error': 'No PDF file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            pdf_file = request.FILES['pdf_file']
            logger.info(f"Received PDF file: {pdf_file.name}, size: {pdf_file.size} bytes")
            
            # Create a temporary directory
            temp_dir = tempfile.mkdtemp()
            temp_file_path = os.path.join(temp_dir, pdf_file.name)
            logger.info(f"Created temporary file at: {temp_file_path}")
            
            # Save the uploaded file
            with open(temp_file_path, 'wb+') as destination:
                for chunk in pdf_file.chunks():
                    destination.write(chunk)
            logger.info("Successfully saved PDF file")

            # Extract text from PDF
            extracted_text = []
            try:
                with open(temp_file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    logger.info(f"PDF loaded successfully, total pages: {len(pdf_reader.pages)}")
                    
                    # Check if PDF is encrypted
                    if pdf_reader.is_encrypted:
                        logger.error("PDF is encrypted")
                        return Response(
                            {'error': 'Encrypted PDF files are not supported'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Process each page
                    for page_num in range(len(pdf_reader.pages)):
                        try:
                            page = pdf_reader.pages[page_num]
                            text = page.extract_text()
                            if text:
                                extracted_text.append(text)
                                logger.info(f"Successfully extracted text from page {page_num + 1}")
                            else:
                                logger.warning(f"No text extracted from page {page_num + 1}")
                        except Exception as page_error:
                            logger.warning(f"Error processing page {page_num + 1}: {str(page_error)}")
                            continue

            except PyPDF2.PdfReadError as pdf_error:
                logger.error(f"PDF reading error: {str(pdf_error)}")
                return Response(
                    {'error': 'Invalid or corrupted PDF file'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not extracted_text:
                logger.error("No text could be extracted from the PDF")
                return Response(
                    {'error': 'No text could be extracted from the PDF'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Combine all extracted text
            full_text = '\n\n'.join(extracted_text)
            
            # Generate Q&A pairs
            faq_data = generate_qa_pairs(full_text)
            if not faq_data:
                logger.warning("No Q&A pairs were generated")
                return Response({
                    'text': full_text,
                    'pages': len(extracted_text),
                    'total_pages': len(pdf_reader.pages),
                    'qa_pairs': []
                })

            # Upload to Qdrant
            upload_success = upload_to_qdrant(faq_data)
            
            return Response({
                'text': full_text,
                'pages': len(extracted_text),
                'total_pages': len(pdf_reader.pages),
                'qa_pairs': faq_data,
                'uploaded_to_qdrant': upload_success
            })

        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            return Response(
                {'error': f'Error processing PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            # Clean up temporary files
            if temp_dir and os.path.exists(temp_dir):
                try:
                    for file in os.listdir(temp_dir):
                        os.remove(os.path.join(temp_dir, file))
                    os.rmdir(temp_dir)
                    logger.info("Successfully cleaned up temporary files")
                except Exception as cleanup_error:
                    logger.error(f"Error cleaning up temporary files: {str(cleanup_error)}")
