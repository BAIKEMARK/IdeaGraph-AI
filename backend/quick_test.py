#!/usr/bin/env python3
"""Quick API speed test"""

import os
import time
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
load_dotenv("../.env")

LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

print(f"Testing: {LLM_MODEL} at {LLM_BASE_URL}")

if not LLM_API_KEY:
    print("❌ No API key configured!")
    exit(1)

client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)

# Quick test
print("Sending test message...")
start = time.time()

try:
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": "Say hello in 5 words"}],
        temperature=0.7
    )
    elapsed = time.time() - start
    
    print(f"\n✅ Response in {elapsed:.2f}s")
    print(f"Reply: {response.choices[0].message.content}")
    
    if elapsed < 2:
        print("\n🚀 API is FAST!")
    elif elapsed < 5:
        print("\n✅ API speed is OK")
    elif elapsed < 10:
        print("\n⚠️  API is SLOW - consider switching to a faster model")
    else:
        print("\n❌ API is VERY SLOW - definitely switch to a faster model or provider")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
