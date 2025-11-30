#!/bin/bash
echo "Starting IdeaGraph AI Backend..."
cd "$(dirname "$0")/.."
cd backend
python app.py
