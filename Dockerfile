# 多阶段构建 Dockerfile for 魔搭社区创空间

# 阶段 1: 构建前端
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./
RUN npm ci

# 复制前端源代码和配置
COPY src ./src
COPY tsconfig.json vite.config.ts vitest.config.ts vitest.setup.ts ./
COPY config ./config

# 构建前端
RUN npm run build

# 阶段 2: 运行时环境
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 复制后端依赖文件
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend ./backend

# 复制启动文件
COPY app.py start.sh ./

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/dist ./dist

# 创建数据目录
RUN mkdir -p /app/backend/data

# 设置脚本权限
RUN chmod +x start.sh

# 暴露端口
EXPOSE 7860

# 设置环境变量
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# 启动命令（优先使用 app.py，兼容魔搭社区）
CMD ["python", "app.py"]
