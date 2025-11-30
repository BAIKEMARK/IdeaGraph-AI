#!/usr/bin/env python3
"""Test script to verify get_all_ideas endpoint"""

import requests
import json

BACKEND_URL = "http://localhost:5000/api"

def test_get_all_ideas():
    """Test the get_all_ideas endpoint"""
    print("Testing /api/get_all_ideas endpoint...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/get_all_ideas")
        
        print(f"Status Code: {response.status_code}")
        
        if response.ok:
            data = response.json()
            ideas = data.get("ideas", [])
            print(f"✓ Successfully retrieved {len(ideas)} ideas")
            
            if ideas:
                print("\nFirst idea:")
                first_idea = ideas[0]
                print(f"  ID: {first_idea.get('idea_id')}")
                print(f"  One-liner: {first_idea.get('distilled_data', {}).get('one_liner')}")
                print(f"  Tags: {first_idea.get('distilled_data', {}).get('tags')}")
        else:
            print(f"✗ Request failed: {response.text}")
            
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    test_get_all_ideas()
