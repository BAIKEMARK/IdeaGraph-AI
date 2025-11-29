"""
Test script for Graph RAG functionality
Run this after starting the backend to verify RAG features
"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test backend health"""
    print("🔍 Testing backend health...")
    response = requests.get(f"{BASE_URL}/health")
    if response.ok:
        print("✅ Backend is running")
        print(json.dumps(response.json(), indent=2))
    else:
        print("❌ Backend not responding")
        return False
    return True

def test_distill():
    """Test idea distillation"""
    print("\n🔍 Testing idea distillation...")
    text = "Blockchain enables decentralized identity by giving users control over their data"
    
    response = requests.post(f"{BASE_URL}/distill", json={"text": text})
    if response.ok:
        data = response.json()
        print("✅ Distillation successful")
        print(f"   One-liner: {data['one_liner']}")
        print(f"   Tags: {data['tags']}")
        print(f"   Nodes: {len(data['graph_structure']['nodes'])}")
        print(f"   Edges: {len(data['graph_structure']['edges'])}")
        print(f"   Embedding dimension: {len(data['embedding_vector'])}")
        return data
    else:
        print(f"❌ Distillation failed: {response.text}")
        return None

def test_save_idea(idea_data):
    """Test saving idea to vector DB"""
    print("\n🔍 Testing vector DB save...")
    
    payload = {
        "idea_id": "test_idea_1",
        "embedding_vector": idea_data["embedding_vector"],
        "idea_data": {
            "idea_id": "test_idea_1",
            "content_raw": "Test idea",
            "distilled_data": idea_data
        }
    }
    
    response = requests.post(f"{BASE_URL}/save_idea", json=payload)
    if response.ok:
        print("✅ Idea saved to vector DB")
        return True
    else:
        print(f"❌ Save failed: {response.text}")
        return False

def test_search_similar(embedding):
    """Test similarity search"""
    print("\n🔍 Testing similarity search...")
    
    payload = {
        "query_embedding": embedding,
        "top_k": 3
    }
    
    response = requests.post(f"{BASE_URL}/search_similar", json=payload)
    if response.ok:
        results = response.json()["results"]
        print(f"✅ Found {len(results)} similar ideas")
        for i, result in enumerate(results, 1):
            print(f"   {i}. Similarity: {result['similarity']:.2f}")
        return True
    else:
        print(f"❌ Search failed: {response.text}")
        return False

def test_chat_with_rag(idea_data):
    """Test RAG-enhanced chat"""
    print("\n🔍 Testing RAG chat...")
    
    payload = {
        "history": [
            {"role": "user", "text": "What are the key concepts in this idea?"}
        ],
        "currentIdea": {
            "idea_id": "test_idea_1",
            "distilled_data": idea_data,
            "embedding_vector": idea_data["embedding_vector"]
        }
    }
    
    response = requests.post(f"{BASE_URL}/chat", json=payload)
    if response.ok:
        reply = response.json()["text"]
        print("✅ RAG chat successful")
        print(f"   AI Reply: {reply[:100]}...")
        return True
    else:
        print(f"❌ Chat failed: {response.text}")
        return False

def main():
    print("=" * 60)
    print("Graph RAG Functionality Test")
    print("=" * 60)
    
    # Test 1: Health check
    if not test_health():
        print("\n❌ Backend not running. Start it with: python backend/app.py")
        return
    
    # Test 2: Distill idea
    idea_data = test_distill()
    if not idea_data:
        print("\n❌ Distillation failed. Check API configuration.")
        return
    
    # Test 3: Save to vector DB
    if not test_save_idea(idea_data):
        return
    
    # Test 4: Search similar ideas
    test_search_similar(idea_data["embedding_vector"])
    
    # Test 5: RAG chat
    test_chat_with_rag(idea_data)
    
    print("\n" + "=" * 60)
    print("✅ All Graph RAG tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to backend. Make sure it's running on http://localhost:5000")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
