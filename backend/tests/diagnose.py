"""
Quick diagnostic script to check backend configuration
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

print("=" * 60)
print("Backend Configuration Diagnostic")
print("=" * 60)

# Check for .env files
backend_env = Path("backend/.env")
root_env_local = Path(".env.local")
root_env = Path(".env")

print("\n📁 Environment Files:")
print(f"  backend/.env: {'✅ Found' if backend_env.exists() else '❌ Not found'}")
print(f"  .env.local: {'✅ Found' if root_env_local.exists() else '❌ Not found'}")
print(f"  .env: {'✅ Found' if root_env.exists() else '❌ Not found'}")

# Load environment variables
load_dotenv("backend/.env")
load_dotenv(".env.local")
load_dotenv(".env")

# Check API configuration
print("\n🔑 API Configuration:")
llm_key = os.getenv("LLM_API_KEY")
llm_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
llm_model = os.getenv("LLM_MODEL", "gpt-4o-mini")

if llm_key:
    print(f"  LLM_API_KEY: ✅ Configured ({llm_key[:10]}...)")
else:
    print(f"  LLM_API_KEY: ❌ Not configured")

print(f"  LLM_BASE_URL: {llm_url}")
print(f"  LLM_MODEL: {llm_model}")

embedding_key = os.getenv("EMBEDDING_API_KEY") or llm_key
embedding_url = os.getenv("EMBEDDING_BASE_URL") or llm_url
embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

if embedding_key:
    print(f"  EMBEDDING_API_KEY: ✅ Configured")
else:
    print(f"  EMBEDDING_API_KEY: ❌ Not configured")

print(f"  EMBEDDING_BASE_URL: {embedding_url}")
print(f"  EMBEDDING_MODEL: {embedding_model}")

# Check vector database
print("\n💾 Vector Database:")
vector_db = Path("backend/vector_db.pkl")
ideas_db = Path("backend/ideas_db.pkl")

print(f"  vector_db.pkl: {'✅ Found' if vector_db.exists() else '❌ Not found (will be created)'}")
print(f"  ideas_db.pkl: {'✅ Found' if ideas_db.exists() else '❌ Not found (will be created)'}")

if vector_db.exists():
    import pickle
    with open(vector_db, 'rb') as f:
        vectors = pickle.load(f)
    print(f"  Ideas stored: {len(vectors)}")

# Check backend server
print("\n🌐 Backend Server:")
import socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
result = sock.connect_ex(('127.0.0.1', 5000))
if result == 0:
    print("  Port 5000: ✅ Backend is running")
else:
    print("  Port 5000: ❌ Backend not running")
sock.close()

# Test health endpoint
print("\n🏥 Health Check:")
try:
    import requests
    response = requests.get("http://localhost:5000/api/health", timeout=2)
    if response.ok:
        data = response.json()
        print(f"  Status: ✅ {data.get('status')}")
        print(f"  API Configured: {'✅' if data.get('api_configured') else '❌'}")
        print(f"  Ideas Count: {data.get('ideas_count', 0)}")
    else:
        print(f"  Status: ❌ HTTP {response.status_code}")
except requests.exceptions.ConnectionError:
    print("  Status: ❌ Cannot connect (backend not running?)")
except Exception as e:
    print(f"  Status: ❌ Error: {e}")

# Recommendations
print("\n" + "=" * 60)
print("💡 Recommendations:")
print("=" * 60)

if not llm_key:
    print("\n❌ API Key Not Configured!")
    print("   Create backend/.env with:")
    print("   LLM_API_KEY=your_api_key_here")
    print("   LLM_BASE_URL=https://api.openai.com/v1")
    print("\n   Or copy .env.example to backend/.env and edit it")
    sys.exit(1)

if result != 0:
    print("\n❌ Backend Not Running!")
    print("   Start it with: python backend/app.py")
    sys.exit(1)

print("\n✅ Everything looks good!")
print("   Backend is configured and running properly.")
