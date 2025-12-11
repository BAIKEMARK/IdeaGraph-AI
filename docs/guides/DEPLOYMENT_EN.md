# 部署指南

本文档介绍如何将 IdeaGraph AI 部署到生产环境。

## 🚀 部署选项

### 1. Docker 部署（推荐）

```bash
# 构建镜像
docker build -t ideagraph-ai .

# 运行容器
docker run -p 3000:3000 -p 5000:5000 \
  -e LLM_API_KEY=your_api_key \
  ideagraph-ai
```

### 2. 传统部署

#### 前端部署

```bash
# 构建前端
npm run build

# 部署到静态文件服务器（如 Nginx）
cp -r dist/* /var/www/html/
```

#### 后端部署

```bash
# 安装依赖
cd backend
pip install -r requirements.txt

# 使用 Gunicorn 运行
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 3. 云平台部署

#### Vercel（前端）
1. 连接 GitHub 仓库
2. 设置构建命令：`npm run build`
3. 设置输出目录：`dist`

#### Railway/Heroku（后端）
1. 连接 GitHub 仓库
2. 设置环境变量
3. 自动部署

## ⚙️ 环境变量配置

### 生产环境必需变量

```env
# LLM API 配置
LLM_API_KEY=your_production_api_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini

# 可选配置
EMBEDDING_MODEL=text-embedding-3-small
FLASK_ENV=production
```

## 🔒 安全考虑

1. **API 密钥安全**
   - 使用环境变量存储敏感信息
   - 定期轮换 API 密钥
   - 限制 API 密钥权限

2. **CORS 配置**
   - 生产环境中限制允许的域名
   - 不要使用 `*` 通配符

3. **HTTPS**
   - 生产环境必须使用 HTTPS
   - 配置 SSL 证书

## 📊 监控和日志

### 推荐监控工具
- **前端**: Sentry, LogRocket
- **后端**: New Relic, DataDog
- **基础设施**: Prometheus + Grafana

### 日志配置
```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

## 🔧 性能优化

### 前端优化
- 启用 Gzip 压缩
- 配置 CDN
- 实施缓存策略

### 后端优化
- 使用连接池
- 实施 API 限流
- 缓存频繁查询

## 📈 扩展建议

### 水平扩展
- 使用负载均衡器
- 部署多个后端实例
- 使用 Redis 作为会话存储

### 数据库升级
- 从 Pickle 迁移到 PostgreSQL + pgvector
- 实施数据备份策略
- 配置读写分离

## 🆘 故障排除

### 常见问题

1. **API 连接失败**
   - 检查网络连接
   - 验证 API 密钥
   - 查看 API 配额

2. **内存不足**
   - 增加服务器内存
   - 优化向量存储
   - 实施数据清理

3. **响应缓慢**
   - 检查 API 延迟
   - 优化数据库查询
   - 增加缓存层

### 健康检查

```bash
# 检查前端
curl http://localhost:3000

# 检查后端
curl http://localhost:5000/api/health
```