# 速度问题解决方案

## 🔍 问题诊断

你的日志显示：
```
LLM call: 18.34s  ← 这是问题所在！
```

**这意味着 API 本身响应慢，不是代码问题。**

## 🚀 快速测试

运行这个命令测试你的API速度：

```bash
cd backend
python quick_test.py
```

这会告诉你API是快还是慢。

## 💡 解决方案

### 如果测试显示 "API is VERY SLOW"

#### 选项1: 换更快的模型 ⭐ 最简单

编辑 `.env` 或 `backend/.env`：

```env
# 如果你用的是 gpt-4，改成：
LLM_MODEL=gpt-3.5-turbo

# 或者
LLM_MODEL=gpt-4o-mini
```

然后重启后端：
```bash
python backend/app.py
```

#### 选项2: 换API提供商

如果你的API在国外且网络慢，考虑使用国内服务：

**DeepSeek** (便宜快速):
```env
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_API_KEY=your_deepseek_key
LLM_MODEL=deepseek-chat
```

**智谱AI**:
```env
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_API_KEY=your_zhipu_key
LLM_MODEL=glm-4
```

#### 选项3: 使用本地模型 (完全免费)

1. 安装 Ollama: https://ollama.ai
2. 下载模型:
   ```bash
   ollama pull llama3.2
   ```
3. 配置 `.env`:
   ```env
   LLM_BASE_URL=http://localhost:11434/v1
   LLM_MODEL=llama3.2
   EMBEDDING_BASE_URL=http://localhost:11434/v1
   EMBEDDING_MODEL=nomic-embed-text
   ```

## 📊 性能对比

| 模型 | 速度 | 质量 | 成本 |
|------|------|------|------|
| GPT-4 | 🐌 10-20s | ⭐⭐⭐⭐⭐ | 💰💰💰 |
| GPT-4o-mini | 🚗 3-6s | ⭐⭐⭐⭐ | 💰 |
| GPT-3.5-turbo | 🚀 1-3s | ⭐⭐⭐⭐ | 💰 |
| DeepSeek | 🚀 1-3s | ⭐⭐⭐⭐ | 💰 |
| Llama3.2 (本地) | ⚡ 0.5-2s | ⭐⭐⭐ | 免费 |

## 🔧 我们已经做的优化

1. ✅ 防抖保存 - 减少不必要的网络请求
2. ✅ 性能监控 - 显示每个操作的耗时
3. ✅ 异步保存 - 不阻塞用户操作

**但是**：如果 LLM API 本身慢（18秒），我们无法通过代码优化来解决。

## 📝 检查当前配置

查看你正在使用什么模型：

```bash
# Windows
type .env | findstr LLM_MODEL

# 或访问
http://localhost:5000/api/health
```

## ⚡ 推荐配置

### 追求速度
```env
LLM_MODEL=gpt-3.5-turbo
```

### 平衡速度和质量
```env
LLM_MODEL=gpt-4o-mini
```

### 完全免费
```env
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2
```

## 🎯 下一步

1. 运行 `python backend/quick_test.py`
2. 如果显示慢，修改 `.env` 中的 `LLM_MODEL`
3. 重启后端
4. 测试速度是否改善

记住：**18秒是API的问题，不是我们代码的问题！**
