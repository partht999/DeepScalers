from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_qdrant_connection():
    # Initialize Qdrant client
    qdrant_client = QdrantClient(
        url="https://7775af46-4796-47d4-ab44-00c855e262f0.europe-west3-0.gcp.cloud.qdrant.io",
        api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.a_inwL3e0AkODn1eTDyN5crtGKHQGZ0ddIh1wHvHCLY",
        timeout=10.0
    )

    # Initialize the sentence transformer model
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # Test question
    test_question = "How can I apply for the scholarship?"

    # Convert question to embedding
    question_embedding = model.encode(test_question)

    print("\n1. Testing Qdrant Connection...")
    try:
        # Get all collections
        collections = qdrant_client.get_collections()
        print("Available collections:", collections)
        
        # Check if student_faqs collection exists
        collection_names = [collection.name for collection in collections.collections]
        if "student_faqs" not in collection_names:
            print("Error: student_faqs collection not found!")
            return
        
        print("\n2. Searching in student_faqs collection...")
        # Search in Qdrant
        search_result = qdrant_client.search(
            collection_name="student_faqs",
            query_vector=question_embedding,
            limit=1
        )

        if search_result:
            print("\nSearch Results:")
            print(f"Score: {search_result[0].score}")
            print(f"Payload: {json.dumps(search_result[0].payload, indent=2)}")
        else:
            print("No results found!")

    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_qdrant_connection() 