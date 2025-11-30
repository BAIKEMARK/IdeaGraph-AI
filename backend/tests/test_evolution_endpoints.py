"""
Test evolution command API endpoints
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint to ensure server is running"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    print("✅ Health check passed\n")

def test_merge_ideas_validation():
    """Test merge endpoint validation"""
    print("Testing merge_ideas validation...")
    
    # Test with no idea_ids
    response = requests.post(f"{BASE_URL}/api/merge_ideas", json={})
    print(f"No idea_ids - Status: {response.status_code}")
    assert response.status_code == 400
    
    # Test with only 1 idea
    response = requests.post(f"{BASE_URL}/api/merge_ideas", json={"idea_ids": ["id1"]})
    print(f"Only 1 idea - Status: {response.status_code}")
    assert response.status_code == 400
    
    # Test with non-existent ideas
    response = requests.post(f"{BASE_URL}/api/merge_ideas", json={"idea_ids": ["fake1", "fake2"]})
    print(f"Non-existent ideas - Status: {response.status_code}")
    assert response.status_code == 404
    
    print("✅ Merge validation tests passed\n")

def test_split_idea_validation():
    """Test split endpoint validation"""
    print("Testing split_idea validation...")
    
    # Test with no idea_id
    response = requests.post(f"{BASE_URL}/api/split_idea", json={})
    print(f"No idea_id - Status: {response.status_code}")
    assert response.status_code == 400
    
    # Test with non-existent idea
    response = requests.post(f"{BASE_URL}/api/split_idea", json={"idea_id": "fake_id"})
    print(f"Non-existent idea - Status: {response.status_code}")
    assert response.status_code == 404
    
    print("✅ Split validation tests passed\n")

def test_refine_idea_validation():
    """Test refine endpoint validation"""
    print("Testing refine_idea validation...")
    
    # Test with no idea_id
    response = requests.post(f"{BASE_URL}/api/refine_idea", json={})
    print(f"No idea_id - Status: {response.status_code}")
    assert response.status_code == 400
    
    # Test with no new_context
    response = requests.post(f"{BASE_URL}/api/refine_idea", json={"idea_id": "id1"})
    print(f"No new_context - Status: {response.status_code}")
    assert response.status_code == 400
    
    # Test with non-existent idea
    response = requests.post(f"{BASE_URL}/api/refine_idea", json={
        "idea_id": "fake_id",
        "new_context": "some context"
    })
    print(f"Non-existent idea - Status: {response.status_code}")
    assert response.status_code == 404
    
    print("✅ Refine validation tests passed\n")

def test_full_evolution_flow():
    """Test complete evolution flow with real ideas"""
    print("Testing full evolution flow...")
    
    # First, create some test ideas
    print("Creating test ideas...")
    
    idea1_text = "Machine learning is transforming healthcare by enabling early disease detection"
    idea2_text = "AI-powered diagnostic tools can analyze medical images faster than human doctors"
    
    # Distill first idea
    response1 = requests.post(f"{BASE_URL}/api/distill", json={"text": idea1_text})
    if response1.status_code != 200:
        print(f"⚠️  Failed to distill idea 1: {response1.json()}")
        return
    
    distilled1 = response1.json()
    idea1_id = f"test_idea_1_{int(time.time())}"
    
    # Save first idea
    save_response1 = requests.post(f"{BASE_URL}/api/save_idea", json={
        "idea_id": idea1_id,
        "embedding_vector": distilled1["embedding_vector"],
        "idea_data": {
            "idea_id": idea1_id,
            "created_at": "2024-01-01T00:00:00Z",
            "content_raw": idea1_text,
            "distilled_data": {
                "one_liner": distilled1["one_liner"],
                "tags": distilled1["tags"],
                "summary": distilled1["summary"],
                "graph_structure": distilled1["graph_structure"]
            },
            "embedding_vector": distilled1["embedding_vector"]
        }
    })
    
    if save_response1.status_code != 200:
        print(f"⚠️  Failed to save idea 1: {save_response1.json()}")
        return
    
    print(f"✅ Created idea 1: {idea1_id[:8]}")
    
    # Distill second idea
    response2 = requests.post(f"{BASE_URL}/api/distill", json={"text": idea2_text})
    if response2.status_code != 200:
        print(f"⚠️  Failed to distill idea 2: {response2.json()}")
        return
    
    distilled2 = response2.json()
    idea2_id = f"test_idea_2_{int(time.time())}"
    
    # Save second idea
    save_response2 = requests.post(f"{BASE_URL}/api/save_idea", json={
        "idea_id": idea2_id,
        "embedding_vector": distilled2["embedding_vector"],
        "idea_data": {
            "idea_id": idea2_id,
            "created_at": "2024-01-01T00:00:00Z",
            "content_raw": idea2_text,
            "distilled_data": {
                "one_liner": distilled2["one_liner"],
                "tags": distilled2["tags"],
                "summary": distilled2["summary"],
                "graph_structure": distilled2["graph_structure"]
            },
            "embedding_vector": distilled2["embedding_vector"]
        }
    })
    
    if save_response2.status_code != 200:
        print(f"⚠️  Failed to save idea 2: {save_response2.json()}")
        return
    
    print(f"✅ Created idea 2: {idea2_id[:8]}")
    
    # Test merge
    print("\nTesting merge...")
    merge_response = requests.post(f"{BASE_URL}/api/merge_ideas", json={
        "idea_ids": [idea1_id, idea2_id]
    })
    
    if merge_response.status_code == 200:
        merged = merge_response.json()
        print(f"✅ Merge successful!")
        print(f"   Merged idea: {merged['merged_idea']['distilled_data']['one_liner']}")
        print(f"   Merged from: {merged['merged_idea']['merged_from_ids']}")
        
        merged_id = merged['merged_idea']['idea_id']
        
        # Test refine on merged idea
        print("\nTesting refine...")
        refine_response = requests.post(f"{BASE_URL}/api/refine_idea", json={
            "idea_id": merged_id,
            "new_context": "Recent studies show 95% accuracy in cancer detection"
        })
        
        if refine_response.status_code == 200:
            refined = refine_response.json()
            print(f"✅ Refine successful!")
            print(f"   Refined idea: {refined['refined_idea']['distilled_data']['one_liner']}")
            print(f"   Version: {refined['refined_idea'].get('version', 1)}")
        else:
            print(f"❌ Refine failed: {refine_response.json()}")
        
        # Test split on merged idea
        print("\nTesting split...")
        split_response = requests.post(f"{BASE_URL}/api/split_idea", json={
            "idea_id": merged_id
        })
        
        if split_response.status_code == 200:
            split = split_response.json()
            print(f"✅ Split successful!")
            print(f"   Created {len(split['sub_ideas'])} sub-ideas:")
            for idx, sub in enumerate(split['sub_ideas'], 1):
                print(f"   {idx}. {sub['distilled_data']['one_liner']}")
        else:
            print(f"❌ Split failed: {split_response.json()}")
    else:
        print(f"❌ Merge failed: {merge_response.json()}")
    
    print("\n✅ Full evolution flow test completed\n")

if __name__ == "__main__":
    print("=" * 60)
    print("Evolution Command API Endpoint Tests")
    print("=" * 60)
    print()
    
    try:
        # Basic validation tests
        test_health()
        test_merge_ideas_validation()
        test_split_idea_validation()
        test_refine_idea_validation()
        
        # Full flow test (requires API key)
        print("=" * 60)
        print("Full Evolution Flow Test (requires API key)")
        print("=" * 60)
        print()
        test_full_evolution_flow()
        
        print("=" * 60)
        print("All tests completed!")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the backend is running on port 5000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
