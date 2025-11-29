# 速度诊断指南

## 你的问题分析

根据日志：
```
LLM call: 18.34s  ⚠️ 这是主要问题！
RAG processing: 0.002s  ✅ 很快
```

**结论**: 速度慢的原因是 **LLM API 响应慢**，不是我们的代码问题。

## 为什么 LLM 调用这么慢？

可能的原因：
1. **模型太大/太慢** - 某些模型本身就慢（如 GPT-4）
2. **API服务器慢** - 服务器在国外或负载高
3. **网络延迟** - 网络连接慢
4. **请求队列** - API有请求限制，需要排队

## 快速测试 API 速度

运行测试脚本：
```bash
cd backend
python test_api_speed.py
```

这会测试：
- 简单LLM调用
- 复杂LLM调用（类似distill）
- Embedding调用
- 带上下文的Chat调用

## 解决方案

### 方案1: 换更快的模型 ⭐ 推荐

在 `.env` 文件中修改：

```env
# 从慢模型
LLM_MODEL=gpt-4

# 改为快模型
LLM_MODEL=gpt-3.5-turbo
# 或
LLM_MODEL=gpt-4o-mini
```

**预期提升**: 3-5倍速度提升

### 方案2: 使用国内API服务

如果你的API在国外，考虑使用国内代理或服务：

```env
LLM_BASE_URL=https://your-domestic-api.com/v1
```

常见的国内API服务：
- 阿里云百炼
- 智谱AI (GLM)
- 月之暗面 (Kimi)
- DeepSeek

### 方案3: 使用本地模型

使用 Ollama 运行本地模型：

```bash
# 安装 Ollama
# 下载模型
ollama pull llama3.2

# 配置
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2
```

**优点**: 
- 完全免费
- 无网络延迟
- 数据隐私

**缺点**: 
- 需要较好的硬件
- 质量可能不如GPT-4

### 方案4: 减少上下文长度

如果必须使用慢模型，可以减少发送的上下文：

在 `backend/app.py` 中：
```python
# 减少相似灵感数量
similar_ideas = search_similar_ideas(current_embedding, top_k=1, exclude_id=current_id)

# 减少概念数量
if graph_info['concepts']:
    idea_context += f"\n\nKey Concepts: {', '.join(graph_info['concepts'][:2])}\n"
```

## 性能基准对比

### GPT-4 (慢)
- 简单调用: 3-5秒
- 复杂调用: 10-20秒
- 质量: ⭐⭐⭐⭐⭐

### GPT-3.5-turbo (快)
- 简单调用: 0.5-1秒
- 复杂调用: 2-4秒
- 质量: ⭐⭐⭐⭐

### GPT-4o-mini (平衡)
- 简单调用: 1-2秒
- 复杂调用: 3-6秒
- 质量: ⭐⭐⭐⭐

### 本地模型 (最快)
- 简单调用: 0.1-0.5秒
- 复杂调用: 0.5-2秒
- 质量: ⭐⭐⭐ (取决于模型)

## 检查当前配置

查看你正在使用的模型：
```bash
# 在 .env 或 backend/.env 中查看
cat .env | grep LLM_MODEL
cat backend/.env | grep LLM_MODEL
```

或访问：
```
http://localhost:5000/api/health
```

查看 `llm_model` 字段。

## 推荐配置

### 开发/测试环境
```env
LLM_MODEL=gpt-3.5-turbo
EMBEDDING_MODEL=text-embedding-3-small
```

### 生产环境（追求质量）
```env
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

### 本地开发（免费）
```env
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2
EMBEDDING_BASE_URL=http://localhost:11434/v1
EMBEDDING_MODEL=nomic-embed-text
```

## 下一步

1. 运行 `python backend/test_api_speed.py` 测试当前API速度
2. 如果 > 5秒，考虑换模型或API
3. 修改 `.env` 配置
4. 重启后端服务
5. 再次测试

记住：**18秒的LLM调用时间是API本身的问题，不是我们代码的问题**。
