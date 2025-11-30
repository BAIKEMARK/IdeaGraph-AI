# PRD: IdeaGraph AI —— 基于动态知识图谱的第二大脑





## 1. 产品概述 (Product Overview)



**IdeaGraph AI** 是一款基于大模型与动态知识图谱的灵感管理工具。它不仅仅记录笔记，而是将非结构化的灵感“蒸馏”为结构化的知识网络。

- **核心差异点**：笔记不再是孤岛，而是通过实体（Entity）和关系（Relation）自动链接；用户可以通过对话让笔记“生长”、“融合”与“裂变”。
- **核心价值**：将线性的“记录”转化为网状的“认知”。



## 2. 核心用户流程 (Core User Flow)



1. **输入与蒸馏**：用户输入任意长度的想法（文本/语音/图），AI自动提取One-Liner（核心洞察）、标签及图谱节点。
2. **可视化探索**：用户在图谱视图中查看灵感星空，点击节点展开查看子图谱细节。
3. **对话与进化**：用户圈选多个Idea进入对话窗口，通过RAG技术进行深度研讨，并指挥AI执行“融合Idea”或“拆分Idea”的操作。



## 3. 功能需求详述 (Functional Specifications)





### 3.1 模块一：灵感捕获与蒸馏 (Capture & Distill)



- 

  **输入界面**：支持Markdown文本输入、图片上传（OCR识别 ）。

  

  

- **AI 处理逻辑（后台）**：

  - 无论输入长短，通过 **自适应蒸馏 (Adaptive Distillation)** 标准化处理。

  - 

    **One-Liner 生成**：提取不超过20字的本质洞察 。

    

    

  - **知识图谱提取**：从非结构化文本中提取 `Entities` (节点) 和 `Relations` (边)。

- **输出数据**：存入数据库前必须完成 JSON 结构化。



### 3.2 模块二：分级动态图谱 (Hierarchical Graph View)



- **设计原则**：解决节点过多造成的“视觉噪音”。

- **Level 1 宏观视图 (默认)**：

  - 仅显示 `Idea` 核心节点（Root Node）和高频 `Tags`。
  - 连线仅显示 Idea 之间的强关联（Semantic Similarity）。

- **Level 2 微观视图 (点击后)**：

  - 点击任意 Idea 节点，视图聚焦并展开其 **子图谱 (Sub-graph)**。

  - 显示该 Idea 内部的详细实体（关键点、心智模型、提及的人/物）。

    

    



### 3.3 模块三：上下文对话工作台 (Contextual Chat Workbench)



- **上下文注入 (Context Injection)**：
  - 用户在图谱中多选 Idea (Node A, Node B)，点击“Chat”。
  - 系统检索 Idea A 和 B 的完整内容 + 向量数据库中的相关片段 (RAG)。
- **进化指令 (Evolution Commands)**：
  - **Refine (深化)**：对话中补充细节，AI 自动更新原 Idea 的图谱结构。
  - **Merge (融合)**：指令“合并这两个想法”，AI 生成一个新的 Idea C，包含 A 和 B 的精华，并建立 A->C, B->C 的继承关系。
  - **Split (拆分)**：指令“拆分这个想法”，AI 将长文拆解为多个独立 Idea 卡片。

------



## 4. 数据结构规范 (Data Schema)



为了支持图谱和RAG，必须采用强类型的 JSON 结构。

JSON

```
{
  "idea_id": "UUID",
  "created_at": "Timestamp",
  "content_raw": "原始文本内容...",
  "distilled_data": {
    "one_liner": "一句话核心洞察",
    "tags": ["Tag1", "Tag2"],
    "summary": "AI生成的摘要",
    "graph_structure": {
      "nodes": [
        {"id": "node_1", "name": "实体名", "type": "Concept", "desc": "描述"},
        {"id": "node_2", "name": "实体名", "type": "Tool", "desc": "描述"}
      ],
      "edges": [
        {"source": "node_1", "target": "node_2", "relation": "depends_on", "desc": "关系描述"}
      ]
    }
  },
  "embedding_vector": [0.123, ...], // 用于向量检索
  "linked_idea_ids": ["idea_005", "idea_088"] // 关联的其他Idea ID
}
```

------



## 5. 核心 Prompt 工程 (Core Prompts)



请在开发中直接集成以下 Prompt，用于驱动 AI 引擎。



### 5.1 灵感蒸馏 (Idea Distillation) - 用于写入/更新



*功能：将用户输入转化为 JSON 图谱数据。*

Python

```
SYSTEM_PROMPT_DISTILL = """
---Role---
You are an expert Idea Distillation Specialist. Your goal is to transform messy user inputs into a structured "Idea Graph".

---Instructions---
1. **Core Distillation (The Root):**
    * Analyze the input text to identify the single, most central concept.
    * Generate a `One_Liner`: A concise insight (max 20 words) capturing the essence.
    * Identify `Tags`: 3-5 high-level thematic tags.

2. **Entity & Insight Extraction (The Nodes):**
    * Identify clearly defined entities, concepts, mental models, or key arguments.
    * **Entity Types**: [Concept, Tool, Person, Problem, Solution, Methodology, Metric].
    * **Description**: Provide a concise description strictly based on the input context.

3. **Relationship Extraction (The Edges):**
    * Identify how these entities connect to the `Core Idea` or to each other.
    * **Logic-First**: Prioritize logical relationships (e.g., "solves", "causes", "contradicts", "consists_of").

4. **Output Format:**
    * Return ONLY a valid JSON object matching the `distilled_data` schema defined in the technical specs.
"""
```



### 5.2 进化式对话 (Evolution Chat) - 用于 RAG 回答



*功能：基于图谱回答，并识别用户修改意图。*

Python

```
SYSTEM_PROMPT_CHAT = """
---Role---
You are an intelligent "Second Brain" partner. You are discussing specific ideas with the user.

---Goal---
Synthesize an answer based on the provided **Context** (Knowledge Graph + Document Chunks).
If the user's input significantly changes the idea, explicitly suggest an update action at the end of your response.

---Instructions---
1. **Answer Synthesis:**
    * Use `Knowledge Graph Data` for structure and relationships.
    * Use `Document Chunks` for details.
    * Citation style: Use [n] to cite source chunks.

2. **Action Triggers:**
    * If the user provides new information that contradicts or expands the context, ask: "Should I update the '[Idea Name]' with this new detail?"
    * If the discussion spawns a totally new concept, ask: "This sounds like a new idea. Should I create a new card for '[New Concept]'?"

---Context---
{context_data}
"""
```



### 5.3 关键词提取 (Keyword Extraction) - 用于检索



*功能：LightRAG 风格的检索增强。*

Python

```
SYSTEM_PROMPT_KEYWORDS = """
---Role---
You are a retrieval specialist for a personal knowledge base.

---Goal---
Extract keywords to find relevant notes and ideas in the user's database.

1. **High-Level Keywords**: Themes, abstract concepts (e.g., "Productivity Systems").
2. **Low-Level Keywords**: Specific entities, proper nouns (e.g., "Obsidian", "Project Alpha").

---Output Format---
JSON object with `high_level_keywords` and `low_level_keywords`.
"""
```

------



## 6. MVP 实施范围 (MVP Scope)



为确保快速上线验证，MVP 阶段包含以下内容：

1. **输入端**：仅支持文本输入，接入 LLM API 完成 JSON 结构化存储。
2. **展示端**：
   - 左侧列表：显示 Idea 卡片（One-Liner + 标签）。
   - 右侧详情：使用简单的力导向图（如 ECharts/D3.js）展示当前 Idea 的子图谱。
3. **对话端**：
   - 选中单个 Idea 进行对话。
   - 支持简单的“更新”指令（AI 返回更新后的 JSON，前端覆盖旧数据）。
4. **技术栈建议**：
   - 前端：React / Vue + D3.js (图谱可视化)
   - 后端：Python (FastAPI)
   - LLM：GPT-4o 或 Claude 3.5 Sonnet (强逻辑推理)
   - 数据库：Supabase (PostgreSQL + pgvector) 用于同时存储 JSON 和 向量数据。