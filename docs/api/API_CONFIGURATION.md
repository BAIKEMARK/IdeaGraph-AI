# API 配置说明 / API Configuration Guide

## 概述 / Overview

本应用支持所有兼容 OpenAI API 格式的大语言模型服务，包括 LLM 和 Embedding API。

This application supports all OpenAI-compatible API services, including LLM and Embedding APIs.

## 配置文件 / Configuration File

所有 API 配置都在 `.env.local` 文件中完成。请复制 `.env.example` 并重命名为 `.env.local`，然后填入你的配置。

All API configurations are done in the `.env.local` file. Copy `.env.example` and rename it to `.env.local`, then fill in your configuration.

## 配置项说明 / Configuration Options

### LLM API 配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `LLM_API_KEY` | LLM API 密钥 | `sk-xxx` |
| `LLM_BASE_URL` | LLM API 基础 URL | `https://api.openai.com/v1` |
| `LLM_MODEL` | 使用的模型名称 | `gpt-4o-mini` |

### Embedding API 配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `EMBEDDING_API_KEY` | Embedding API 密钥（可选，留空则使用 LLM_API_KEY） | `sk-xxx` |
| `EMBEDDING_BASE_URL` | Embedding API 基础 URL（可选，留空则使用 LLM_BASE_URL） | `https://api.openai.com/v1` |
| `EMBEDDING_MODEL` | 使用的 Embedding 模型 | `text-embedding-3-small` |

## 常见服务商配置示例 / Common Provider Examples

### OpenAI

```env
LLM_API_KEY=sk-your-openai-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini

EMBEDDING_API_KEY=sk-your-openai-key
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

### Azure OpenAI

```env
LLM_API_KEY=your-azure-key
LLM_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment-name
LLM_MODEL=gpt-4

EMBEDDING_API_KEY=your-azure-key
EMBEDDING_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-embedding-deployment
EMBEDDING_MODEL=text-embedding-ada-002
```

### DeepSeek (深度求索)

```env
LLM_API_KEY=your-deepseek-key
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat

EMBEDDING_API_KEY=your-deepseek-key
EMBEDDING_BASE_URL=https://api.deepseek.com/v1
EMBEDDING_MODEL=deepseek-embedding
```

### Moonshot AI (月之暗面)

```env
LLM_API_KEY=your-moonshot-key
LLM_BASE_URL=https://api.moonshot.cn/v1
LLM_MODEL=moonshot-v1-8k

# Moonshot 目前可能不提供 embedding，可以使用其他服务
EMBEDDING_API_KEY=your-openai-key
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

### Ollama (本地部署)

```env
LLM_API_KEY=ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama2

EMBEDDING_API_KEY=ollama
EMBEDDING_BASE_URL=http://localhost:11434/v1
EMBEDDING_MODEL=nomic-embed-text
```

### LM Studio (本地部署)

```env
LLM_API_KEY=lm-studio
LLM_BASE_URL=http://localhost:1234/v1
LLM_MODEL=your-loaded-model-name

EMBEDDING_API_KEY=lm-studio
EMBEDDING_BASE_URL=http://localhost:1234/v1
EMBEDDING_MODEL=your-embedding-model
```

### 智谱 AI (GLM)

```env
LLM_API_KEY=your-zhipu-key
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-4

EMBEDDING_API_KEY=your-zhipu-key
EMBEDDING_BASE_URL=https://open.bigmodel.cn/api/paas/v4
EMBEDDING_MODEL=embedding-2
```

## 混合配置 / Mixed Configuration

你可以为 LLM 和 Embedding 使用不同的服务商：

You can use different providers for LLM and Embedding:

```env
# 使用 DeepSeek 作为 LLM
LLM_API_KEY=your-deepseek-key
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat

# 使用 OpenAI 作为 Embedding
EMBEDDING_API_KEY=your-openai-key
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

## 测试配置 / Testing Configuration

启动后端后，访问健康检查端点查看配置：

After starting the backend, visit the health check endpoint to view configuration:

```bash
curl http://localhost:5000/api/health
```

返回示例 / Example response:
```json
{
  "status": "ok",
  "llm_model": "gpt-4o-mini",
  "embedding_model": "text-embedding-3-small",
  "llm_base_url": "https://api.openai.com/v1",
  "embedding_base_url": "https://api.openai.com/v1"
}
```

## 注意事项 / Notes

1. **API Key 安全**: 永远不要将 `.env.local` 文件提交到版本控制系统
2. **模型兼容性**: 确保你选择的模型支持 JSON 格式输出（用于 distill 功能）
3. **Embedding 维度**: 不同的 embedding 模型输出维度可能不同，这不影响功能
4. **本地模型**: 使用本地模型时，确保模型已经加载并运行

1. **API Key Security**: Never commit `.env.local` to version control
2. **Model Compatibility**: Ensure your chosen model supports JSON format output (for distill feature)
3. **Embedding Dimensions**: Different embedding models may have different output dimensions, which doesn't affect functionality
4. **Local Models**: When using local models, ensure the model is loaded and running
