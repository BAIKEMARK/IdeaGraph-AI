# 魔搭社区创空间部署指南

## 部署步骤

### 1. 准备代码
确保你的项目包含以下 Docker 相关文件：
- `Dockerfile` - Docker 构建文件
- `docker-compose.yml` - Docker Compose 配置
- `app.py` - 魔搭社区入口文件
- `.dockerignore` - Docker 忽略文件

### 2. 环境变量配置
在魔搭社区创空间中配置以下环境变量：

**必需配置：**
```
LLM_API_KEY=your_api_key_here
```

**可选配置：**
```
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
EMBEDDING_API_KEY=your_embedding_api_key
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

### 3. 部署到魔搭社区

1. **上传代码**：将整个项目上传到魔搭社区创空间
2. **配置环境变量**：在创空间设置中添加上述环境变量
3. **启动应用**：魔搭社区会自动使用 Docker 构建和启动应用

### 4. 访问应用

应用启动后，可以通过魔搭社区提供的 URL 访问：
- 前端界面：`https://your-space-url.com/`
- API 接口：`https://your-space-url.com/api/`

## 技术架构

- **前端**：React + Vite + TypeScript
- **后端**：Flask + Python
- **部署**：Docker 多阶段构建
- **端口**：7860（魔搭社区标准端口）

## 本地测试

```bash
# 构建 Docker 镜像
docker build -t ideagraph-ai .

# 运行容器
docker run -p 7860:7860 \
  -e LLM_API_KEY=your_api_key \
  ideagraph-ai
```

## 数据持久化

应用数据存储在 `/app/backend/data` 目录中，包括：
- `vector_db.pkl` - 向量数据库
- `ideas_db.pkl` - 想法数据库

在生产环境中，建议挂载外部存储卷来持久化数据。

## 故障排除

### 1. 前端构建失败
确保 `package.json` 中的依赖正确，并且 Node.js 版本兼容。

### 2. API 密钥错误
检查环境变量 `LLM_API_KEY` 是否正确配置。

### 3. 端口访问问题
确保应用监听 `0.0.0.0:7860`，这是魔搭社区的标准配置。

### 4. 静态文件 404
确保前端构建产物正确复制到 Docker 镜像中的 `/app/dist` 目录。