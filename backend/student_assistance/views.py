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
from django.conf import settings
from concurrent.futures import ThreadPoolExecutor, as_completed
User = get_user_model()
ai_service = AIService()
logger = logging.getLogger(__name__)

# Configure Groq
client = Groq(api_key=settings.GROQ_API_KEY)

# Configure Qdrant
qdrant_client = QdrantClient(
    url=os.getenv('QDRANT_URL', 'https://7775af46-4796-47d4-ab44-00c855e262f0.europe-west3-0.gcp.cloud.qdrant.io:6333'),
    api_key=os.getenv('QDRANT_API_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.a_inwL3e0AkODn1eTDyN5crtGKHQGZ0ddIh1wHvHCLY')
)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def process_text_chunk(text, chunk_number, total_chunks, api_key):
    """Process a single chunk of text with a specific API key"""
    try:
        # Add chunk context to the prompt
        chunk_context = f"This is chunk {chunk_number} of {total_chunks} from a larger document. "
        chunk_context += "Focus on generating Q&A pairs specific to this section while maintaining context. "
        chunk_context += "Ensure questions and answers are self-contained but reference the broader topic when relevant."

        prompt = f"""You are an expert at creating comprehensive and detailed Q&A pairs from educational content. {chunk_context}

Content to analyze:
{text}

Generate detailed Q&A pairs following these rules:
1. Questions should be specific and test deep understanding
2. Answers should be comprehensive and include examples
3. Cover all major concepts and details from the content
4. Include both theoretical and practical aspects
5. Maintain proper formatting with clear separation between Q&A pairs

Format each Q&A pair exactly like this:
## 1. Question: [Your question here]
## Answer: [Your detailed answer here]

## 2. Question: [Next question]
## Answer: [Next answer]

And so on..."""

        client = Groq(api_key=api_key)
        chunk = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            temperature=1,
            max_tokens=8000,
            top_p=1,
            stream=True
        )

        full_response = ""
        for chunk in chunk:
            if chunk.choices[0].delta.content:
                full_response += chunk.choices[0].delta.content

        logger.info(f"Full response: {full_response}")
        
        # Parse Q&A pairs
        faq_data = []
        
        # Try multiple patterns to match different formats
        patterns = [
            # Pattern 1: ## 1. Question: ... ## Answer: ... (without asterisks)
            r"##\s*\d+\.\s*Question:\s*(.*?)\n##\s*Answer:\s*(.*?)(?=\n##|\Z)",
            
            # Pattern 2: ## 1. **Question:** ... ## **Answer:** ... (with asterisks)
            r"##\s*\d+\.\s*\*\*Question:\*\*\s*(.*?)\n##\s*\*\*Answer:\*\*\s*(.*?)(?=\n##|\Z)",
            
            # Pattern 3: **1. Question:** ... **Answer:** ... (with asterisks)
            r"\*\*\d+\.\s*Question:\*\*\s*(.*?)\n\*\*Answer:\*\*\s*(.*?)(?=\n\*\*|\Z)",
            
            # Pattern 4: Original pattern
            r"\*\*Question:\*\*\s*(.*?)\n\s*\*\*Answer:\*\*\s*(.*?)(?=\n\d+\.|\Z)"
        ]
        
        for pattern in patterns:
            qa_pairs = re.findall(pattern, full_response, re.DOTALL)
            if qa_pairs:
                for q, a in qa_pairs:
                    if q.strip() and a.strip():  # Only add if both question and answer are non-empty
                        faq_data.append({
                            "question": q.strip(),
                            "answer": a.strip()
                        })
                break  # If we found pairs with this pattern, no need to try others

        if not faq_data:
            logger.warning(f"No Q&A pairs found in Groq's response for chunk {chunk_number if chunk_number else 'single'}")
            logger.warning(f"Response content: {full_response[:500]}...")
            return []

        logger.info(f"Generated {len(faq_data)} Q&A pairs for chunk {chunk_number if chunk_number else 'single'}")
        return faq_data

    except Exception as e:
        logger.error(f"Error processing chunk {chunk_number}: {str(e)}")
        return []

def generate_qa_pairs(text):
    """Generate Q&A pairs from text using Groq API"""
    try:
        # List of Groq API keys for rotation
        GROQ_API_KEYS = [
            "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",
            "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",
            "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",
            "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",
            "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",
            "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",
            "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",
            "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",
            "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"
        ]

        # Estimate tokens (rough estimate: 1 token ≈ 4 characters)
        estimated_tokens = len(text) // 4
        logger.info(f"Estimated tokens in text: {estimated_tokens}")

        # Determine optimal chunk size and number of chunks based on content size
        if estimated_tokens <= 15000:  # Small content
            # Process in one go with a single API key
            return process_text_chunk(text, 0, 1, GROQ_API_KEYS[0])
        elif estimated_tokens <= 50000:  # Medium content
            # Use 3-4 API keys
            num_chunks = 3
            chunk_size = estimated_tokens // num_chunks
            api_keys = GROQ_API_KEYS[:3]
        elif estimated_tokens <= 100000:  # Large content
            # Use 5-7 API keys
            num_chunks = 5
            chunk_size = estimated_tokens // num_chunks
            api_keys = GROQ_API_KEYS[:5]
        else:  # Very large content
            # Use all available API keys
            num_chunks = min(9, len(GROQ_API_KEYS))  # Use up to 9 chunks to leave one key for retries
            chunk_size = estimated_tokens // num_chunks
            api_keys = GROQ_API_KEYS

        logger.info(f"Processing content in {num_chunks} chunks using {len(api_keys)} API keys")
        
        # Split text into chunks while maintaining paragraph context
        chunks = []
        current_chunk = []
        current_size = 0
        
        # Split by paragraphs first
        paragraphs = text.split('\n\n')
        
        for para in paragraphs:
            para_tokens = len(para) // 4
            if current_size + para_tokens > chunk_size and current_chunk:
                # Current chunk is full, save it and start new one
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = [para]
                current_size = para_tokens
            else:
                current_chunk.append(para)
                current_size += para_tokens
        
        # Add the last chunk if it's not empty
        if current_chunk:
            chunks.append('\n\n'.join(current_chunk))

        # Process chunks in parallel using ThreadPoolExecutor
        all_qa_pairs = []
        with ThreadPoolExecutor(max_workers=len(api_keys)) as executor:
            # Create a list of futures for each chunk
            futures = []
            for i, chunk in enumerate(chunks):
                api_key = api_keys[i % len(api_keys)]
                future = executor.submit(process_text_chunk, chunk, i+1, len(chunks), api_key)
                futures.append(future)
            
            # Collect results as they complete
            for future in as_completed(futures):
                try:
                    qa_pairs = future.result()
                    if qa_pairs:
                        all_qa_pairs.extend(qa_pairs)
                except Exception as e:
                    logger.error(f"Error processing chunk: {str(e)}")

        if not all_qa_pairs:
            logger.warning("No Q&A pairs were generated from any chunk")
            return []

        logger.info(f"Successfully generated {len(all_qa_pairs)} Q&A pairs in total")
        return all_qa_pairs

    except Exception as e:
        logger.error(f"Error in generate_qa_pairs: {str(e)}")
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
