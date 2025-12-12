#!/bin/bash

# 魔搭社区创空间启动脚本

echo "🚀 Starting IdeaGraph AI..."

# 检查环境变量
if [ -z "$LLM_API_KEY" ]; then
    echo "⚠️  Warning: LLM_API_KEY not set"
    echo "Please configure your API key in the environment variables"
fi

# 创建数据目录
mkdir -p /app/backend/data

# 启动应用
echo "🌐 Starting server on port 7860..."
python app.py