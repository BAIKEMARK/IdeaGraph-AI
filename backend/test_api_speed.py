#!/usr/bin/env python3
"""Test API speed to diagnose performance issues"""

import os
import time
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()
load_dotenv("../.env")

LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

EMBEDDING_API_KEY = os.getenv("EMBEDDING_API_KEY") or LLM_API_KEY
EMBEDDING_BASE_URL = os.getenv("EMBEDDING_BASE_URL") or LLM_BASE_URL
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

print("=" * 60)
print("API Speed Test")
print("=" * 60)
print(f"LLM API: {LLM_BASE_URL}")
print(f"LLM Model: {LLM_MODEL}")
print(f"Embedding API: {EMBEDDING_BASE_URL}")
print(f"Embedding Model: {EMBEDDING_MODEL}")
print("=" * 60)

if not LLM_API_KEY:
    print("❌ LLM_API_KEY not configured!")
    exit(1)

# Initialize clients
llm_client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
embedding_client = OpenAI(api_key=EMBEDDING_API_KEY, base_url=EMBEDDING_BASE_URL)

# Test 1: Simple LLM call
print("\n1️⃣  Testing simple LLM call...")
test_text = "Hello, how are you?"
start = time.time()
try:
    response = llm_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "user", "content": test_text}
        ],
        temperature=0.7
    )
    elapsed = time.time() - start
    print(f"   ✅ Simple LLM call: {elapsed:.2f}s")
    print(f"   Response: {response.choices[0].message.content[:100]}...")
except Exception as e:
    print(f"   ❌ Failed: {e}")

# Test 2: Complex LLM call (like distill)
print("\n2️⃣  Testing complex LLM call (distill-like)...")
complex_prompt = """You are an AI assistant that distills user ideas into structured data.
Given a raw text idea, extract:
1. A one-liner summary
2. Relevant tags (keywords)
3. A detailed summary
4. A graph structure with nodes and edges representing concepts, tools, people, and their relationships.

Return JSON in this exact format:
{
  "one_liner": "...",
  "tags": ["tag1", "tag2"],
  "summary": "...",
  "graph_structure": {
    "nodes": [
      {"id": "node1", "name": "Node Name", "type": "Concept", "desc": "Description"}
    ],
    "edges": [
      {"source": "node1", "target": "node2", "relation": "relates_to", "desc": "Optional description"}
    ]
  }
}
"""
test_idea = "我想开发一个记录日常生活和兴趣爱好的应用"

start = time.time()
try:
    response = llm_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": complex_prompt},
            {"role": "user", "content": f"Distill this idea:\n\n{test_idea}"}
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    elapsed = time.time() - start
    print(f"   ✅ Complex LLM call: {elapsed:.2f}s")
    print(f"   Response length: {len(response.choices[0].message.content)} chars")
except Exception as e:
    print(f"   ❌ Failed: {e}")

# Test 3: Embedding call
print("\n3️⃣  Testing embedding call...")
start = time.time()
try:
    response = embedding_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=test_idea
    )
    elapsed = time.time() - start
    vector_size = len(response.data[0].embedding)
    print(f"   ✅ Embedding call: {elapsed:.2f}s")
    print(f"   Vector size: {vector_size} dimensions")
except Exception as e:
    print(f"   ❌ Failed: {e}")

# Test 4: Chat with context (like chat endpoint)
print("\n4️⃣  Testing chat with context...")
chat_context = """Current Idea Context:
- Summary: 一款用于记录日常琐事、灵感想法和随笔的生活记录应用
- Tags: 记录生活, 爱好兴趣, 个人经历
- Details: 这是一个帮助用户记录和整理日常生活点滴的应用程序

Key Concepts: 生活记录, 日常琐事, 灵感想法, 随笔记录, 个人经历
"""

start = time.time()
try:
    response = llm_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful AI assistant discussing ideas with the user.\n\n" + chat_context},
            {"role": "user", "content": "app通过什么方式开发比较合适"}
        ],
        temperature=0.8
    )
    elapsed = time.time() - start
    print(f"   ✅ Chat call: {elapsed:.2f}s")
    print(f"   Response: {response.choices[0].message.content[:100]}...")
except Exception as e:
    print(f"   ❌ Failed: {e}")

print("\n" + "=" * 60)
print("Summary:")
print("=" * 60)
print("If any call takes > 5 seconds, your API is slow.")
print("Consider:")
print("  - Using a faster model (e.g., gpt-3.5-turbo instead of gpt-4)")
print("  - Using a different API provider")
print("  - Using a local model (e.g., Ollama)")
print("=" * 60)
