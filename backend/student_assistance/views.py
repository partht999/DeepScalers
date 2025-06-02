from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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

User = get_user_model()
ai_service = AIService()
logger = logging.getLogger(__name__)

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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        temp_dir = None
        try:
            if 'pdf_file' not in request.FILES:
                return Response(
                    {'error': 'No PDF file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            pdf_file = request.FILES['pdf_file']
            
            # Create a temporary directory
            temp_dir = tempfile.mkdtemp()
            temp_file_path = os.path.join(temp_dir, pdf_file.name)
            
            # Save the uploaded file
            with open(temp_file_path, 'wb+') as destination:
                for chunk in pdf_file.chunks():
                    destination.write(chunk)

            # Extract text from PDF
            extracted_text = []
            try:
                with open(temp_file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    
                    # Check if PDF is encrypted
                    if pdf_reader.is_encrypted:
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
                return Response(
                    {'error': 'No text could be extracted from the PDF'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response({
                'text': '\n\n'.join(extracted_text),
                'pages': len(extracted_text),
                'total_pages': len(pdf_reader.pages)
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
                except Exception as cleanup_error:
                    logger.error(f"Error cleaning up temporary files: {str(cleanup_error)}")
