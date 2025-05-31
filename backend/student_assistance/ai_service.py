from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http import models
import numpy as np
from typing import List, Tuple, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        # Initialize the sentence transformer model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize Qdrant client with environment variables
        self.qdrant_client = QdrantClient(
            url=os.getenv('QDRANT_URL', 'http://localhost:6333'),
            api_key=os.getenv('QDRANT_API_KEY'),
            timeout=10.0
        )
        
        # Create collection if it doesn't exist
        self._ensure_collection_exists()
    
    def _ensure_collection_exists(self):
        """Ensure the Qdrant collection exists."""
        collections = self.qdrant_client.get_collections().collections
        collection_names = [collection.name for collection in collections]
        
        if 'student_assistance' not in collection_names:
            self.qdrant_client.create_collection(
                collection_name='student_assistance',
                vectors_config=models.VectorParams(
                    size=384,  # Size of the all-MiniLM-L6-v2 embeddings
                    distance=models.Distance.COSINE
                )
            )
    
    def get_embedding(self, text: str) -> List[float]:
        """Get the embedding for a given text."""
        return self.model.encode(text).tolist()
    
    def search_similar_questions(self, question: str, limit: int = 5) -> List[Tuple[dict, float]]:
        """Search for similar questions in the knowledge base."""
        question_embedding = self.get_embedding(question)
        
        search_result = self.qdrant_client.search(
            collection_name='student_assistance',
            query_vector=question_embedding,
            limit=limit
        )
        
        return [(hit.payload, hit.score) for hit in search_result]
    
    def add_to_knowledge_base(self, question: str, answer: str, confidence_score: float = 1.0):
        """Add a new question-answer pair to the knowledge base."""
        # Create a combined text for embedding
        combined_text = f"Question: {question}\nAnswer: {answer}"
        embedding = self.get_embedding(combined_text)
        
        # Add to Qdrant
        self.qdrant_client.upsert(
            collection_name='student_assistance',
            points=[
                models.PointStruct(
                    id=hash(combined_text) % (2**63 - 1),  # Generate a unique ID
                    vector=embedding,
                    payload={
                        'question': question,
                        'answer': answer,
                        'confidence_score': confidence_score
                    }
                )
            ]
        )
    
    def find_best_answer(self, question: str, confidence_threshold: float = 0.8) -> Optional[Tuple[str, float]]:
        """Find the best matching answer for a question."""
        similar_questions = self.search_similar_questions(question, limit=1)
        
        if not similar_questions:
            return None
        
        best_match, score = similar_questions[0]
        
        if score >= confidence_threshold:
            return best_match['answer'], score
        
        return None 