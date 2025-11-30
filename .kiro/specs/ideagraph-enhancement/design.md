# 设计文档：IdeaGraph AI 增强

## 概述

本设计文档概述了增强 IdeaGraph AI 以完全实现 PRD 愿景的架构和实施策略。增强功能聚焦于三个核心支柱：

1. **智能蒸馏**：升级提示工程和实体提取，以生成更高质量的知识图谱
2. **分层可视化**：实现两级图谱视图以管理复杂性并改善用户体验
3. **进化操作**：使用户能够通过对话式 AI 精炼、合并和拆分想法

该设计保持现有的 React + Flask 架构，同时引入用于图谱级别管理、进化命令处理和增强 RAG 功能的新组件。

## 架构

### 系统组件

```
┌─────────────────────────────────────────────────────────────┐
│                     前端 (React)                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  想法列表    │  │  图谱视图    │  │ 聊天面板     │     │
│  │  组件        │  │  组件        │  │ 组件         │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  图谱级别       │                       │
│                   │  管理器         │                       │
│                   └────────┬────────┘                       │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  进化命令       │                       │
│                   │  UI             │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API 层        │
                    └────────┬────────┘
┌────────────────────────────┼────────────────────────────────┐
│                    后端 (Flask)                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 蒸馏引擎     │  │  进化处理器  │  │  增强型      │     │
│  │              │  │              │  │  RAG 引擎    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  向量数据库     │                       │
│                   │  管理器         │                       │
│                   └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

1. **想法创建流程**：
   - 用户输入 → 蒸馏引擎 → 结构化 JSON → 向量数据库
   - 嵌入向量生成 → 相似度索引

2. **图谱可视化流程**：
   - Level 1：加载所有想法 → 计算相似度 → 按阈值过滤 → 渲染宏观图谱
   - Level 2：点击节点 → 加载子图谱 → 渲染实体关系图

3. **进化命令流程**：
   - 用户选择 → 触发命令 → 收集上下文 → LLM 处理 → 新建/更新想法 → 数据库更新 → UI 刷新

## 组件和接口

### 前端组件

#### 1. GraphLevelManager（图谱级别管理器）

**目的**：管理 Level 1（宏观）和 Level 2（微观）图谱视图之间的状态和转换。

**接口**：
```typescript
interface GraphLevelManager {
  currentLevel: 1 | 2;
  selectedIdeaId: string | null;
  transitionToLevel2(ideaId: string): void;
  transitionToLevel1(): void;
  getGraphData(): GraphData;
}

interface GraphData {
  level: 1 | 2;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    similarityThreshold?: number;
    focusedIdeaId?: string;
  };
}
```

**职责**：
- 跟踪当前可视化级别
- 管理带动画的平滑转换
- 根据级别要求过滤数据
- 向 GraphView 组件提供适当的数据

#### 2. EvolutionCommandUI（进化命令 UI）

**目的**：提供用于触发合并、拆分和精炼操作的用户界面。

**接口**：
```typescript
interface EvolutionCommandUI {
  selectedIdeas: string[];
  availableCommands: EvolutionCommand[];
  onMerge(ideaIds: string[]): Promise<Idea>;
  onSplit(ideaId: string): Promise<Idea[]>;
  onRefine(ideaId: string, additionalContext: string): Promise<Idea>;
}

type EvolutionCommand = 'merge' | 'split' | 'refine';
```

**职责**：
- 根据选择状态显示命令按钮
- 显示确认对话框
- 处理操作期间的加载状态
- 显示结果并更新 UI

#### 3. MultiSelectIdeaList（多选想法列表）

**目的**：支持多选的增强型 IdeaList 组件，用于进化命令。

**接口**：
```typescript
interface MultiSelectIdeaList extends IdeaList {
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelection(ideaId: string): void;
  onSelectAll(): void;
  onClearSelection(): void;
}
```

### 后端组件

#### 1. 增强型蒸馏引擎

**目的**：实现符合 PRD 的提示工程，以实现高质量的知识图谱提取。

**接口**：
```python
class DistillationEngine:
    def distill(self, text: str) -> DistilledData:
        """
        将原始文本蒸馏为结构化知识图谱。
        使用 PRD 中的 SYSTEM_PROMPT_DISTILL。
        """
        pass
    
    def validate_schema(self, data: dict) -> bool:
        """根据完整的 JSON schema 验证输出。"""
        pass
    
    def enforce_constraints(self, data: dict) -> dict:
        """强制执行约束，如 20 字 one-liner 限制。"""
        pass
```

**关键特性**：
- 使用 PRD 定义的 SYSTEM_PROMPT_DISTILL
- 验证实体类型：Concept、Tool、Person、Problem、Solution、Methodology、Metric
- 优先考虑逻辑关系：solves、causes、contradicts、consists_of、depends_on
- 强制执行 one-liner 的 20 字限制
- 验证完整的 JSON schema 合规性

#### 2. 进化处理器

**目的**：处理想法的合并、拆分和精炼操作。

**接口**：
```python
class EvolutionProcessor:
    def merge_ideas(self, idea_ids: List[str]) -> Idea:
        """将多个想法合并为一个综合概念。"""
        pass
    
    def split_idea(self, idea_id: str) -> List[Idea]:
        """将一个想法拆分为 2-5 个子概念。"""
        pass
    
    def refine_idea(self, idea_id: str, new_context: str) -> Idea:
        """用额外信息精炼一个想法。"""
        pass
    
    def establish_relationships(self, parent_id: str, child_ids: List[str], 
                               relation_type: str) -> None:
        """创建 linked_idea_ids 关系。"""
        pass
```

**提示词**：

**合并提示词**：
```python
MERGE_PROMPT = """你是一个综合多个相关想法的专家。

给定这些想法：
{idea_contents}

创建一个新的综合想法，要求：
1. 捕捉所有输入想法的精髓
2. 识别共同主题和独特贡献
3. 解决任何矛盾或张力
4. 生成统一的知识图谱结构

以标准的 distilled_data JSON 格式返回结果。"""
```

**拆分提示词**：
```python
SPLIT_PROMPT = """你是一个将复杂想法分解为聚焦子概念的专家。

给定这个想法：
{idea_content}

识别 2-5 个不同的子概念，要求：
1. 每个都代表一个连贯的、独立的方面
2. 共同覆盖原始想法的全部范围
3. 彼此之间重叠最小
4. 可以独立发展

对于每个子概念，返回完整的 distilled_data JSON 结构。"""
```

**精炼提示词**：
```python
REFINE_PROMPT = """你正在用新信息更新现有想法。

原始想法：
{original_content}

新信息：
{new_context}

生成更新的 distilled_data 结构，要求：
1. 无缝整合新信息
2. 保留原始的有价值方面
3. 解决任何矛盾
4. 更新知识图谱以反映新的实体和关系

返回完整的更新后的 distilled_data JSON。"""
```

#### 3. 增强型 RAG 引擎

**目的**：实现符合 PRD 的 RAG，具有适当的上下文注入和引用。

**接口**：
```python
class EnhancedRAGEngine:
    def extract_keywords(self, query: str) -> KeywordSet:
        """提取高级和低级关键词。"""
        pass
    
    def build_context(self, idea_ids: List[str], query: str) -> RAGContext:
        """从想法和相似片段构建综合上下文。"""
        pass
    
    def generate_response(self, query: str, context: RAGContext, 
                         history: List[Message]) -> Response:
        """生成带引用和进化建议的响应。"""
        pass
    
    def detect_evolution_opportunity(self, response: str, 
                                    context: RAGContext) -> Optional[EvolutionSuggestion]:
        """检测响应是否建议想法进化。"""
        pass
```

**关键特性**：
- 使用 PRD 中的 SYSTEM_PROMPT_CHAT 和 SYSTEM_PROMPT_KEYWORDS
- 提取高级（主题）和低级（实体）关键词
- 包含知识图谱数据（结构）和文档片段（内容）
- 添加 [n] 引用标记
- 检测并建议进化机会

## 数据模型

### 增强型想法 Schema

```typescript
interface Idea {
  // 核心字段
  idea_id: string;              // UUID
  created_at: string;           // ISO 时间戳
  content_raw: string;          // 原始用户输入
  
  // 蒸馏数据
  distilled_data: DistilledData;
  
  // 向量数据
  embedding_vector: number[];   // 相似度搜索必需
  
  // 关系
  linked_idea_ids?: string[];   // 相关想法引用
  parent_idea_id?: string;      // 用于拆分的想法
  child_idea_ids?: string[];    // 已被拆分的想法
  merged_from_ids?: string[];   // 用于合并的想法
  
  // 聊天历史
  chat_history?: ChatMessage[];
  
  // 元数据
  last_modified?: string;       // ISO 时间戳
  version?: number;             // 用于跟踪精炼
}

interface DistilledData {
  one_liner: string;            // 最多 20 字
  tags: string[];               // 3-5 个主题标签
  summary: string;              // 详细摘要
  graph_structure: GraphStructure;
}

interface GraphStructure {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphNode {
  id: string;
  name: string;
  type: EntityType;             // 验证的枚举
  desc: string;
}

type EntityType = 
  | 'Concept' 
  | 'Tool' 
  | 'Person' 
  | 'Problem' 
  | 'Solution' 
  | 'Methodology' 
  | 'Metric';

interface GraphEdge {
  source: string;               // 节点 ID
  target: string;               // 节点 ID
  relation: RelationType;       // 验证的枚举
  desc?: string;
}

type RelationType = 
  | 'solves' 
  | 'causes' 
  | 'contradicts' 
  | 'consists_of' 
  | 'depends_on'
  | 'enables'
  | 'disrupts'
  | 'powered_by'
  | 'relates_to';
```

### RAG 上下文模型

```typescript
interface RAGContext {
  // 上下文中的主要想法
  primary_ideas: Idea[];
  
  // 来自向量搜索的相似想法
  similar_ideas: Array<{
    idea: Idea;
    similarity: number;
  }>;
  
  // 提取的关键词
  keywords: KeywordSet;
  
  // 图谱遍历结果
  graph_concepts: string[];
  graph_relations: string[];
}

interface KeywordSet {
  high_level_keywords: string[];  // 主题、抽象概念
  low_level_keywords: string[];   // 实体、专有名词
}

interface Response {
  text: string;                   // 带 [n] 引用的响应
  citations: Citation[];
  evolution_suggestion?: EvolutionSuggestion;
}

interface Citation {
  index: number;                  // [n] 标记
  idea_id: string;
  snippet: string;
}

interface EvolutionSuggestion {
  type: 'refine' | 'create_new';
  message: string;                // 确认提示
  affected_idea_ids: string[];
}
```

### 图谱级别数据模型

```typescript
interface Level1GraphData {
  level: 1;
  nodes: IdeaNode[];              // 每个想法一个节点
  edges: SimilarityEdge[];        // 按阈值过滤
  metadata: {
    similarityThreshold: number;  // 例如 0.7
    totalIdeas: number;
  };
}

interface IdeaNode {
  id: string;                     // idea_id
  label: string;                  // one_liner
  tags: string[];
  type: 'idea';
}

interface SimilarityEdge {
  source: string;                 // idea_id
  target: string;                 // idea_id
  similarity: number;             // 0-1
  type: 'similarity';
}

interface Level2GraphData {
  level: 2;
  focusedIdeaId: string;
  nodes: EntityNode[];            // 来自 graph_structure 的实体
  edges: RelationEdge[];          // 来自 graph_structure 的关系
  metadata: {
    ideaOneLiner: string;
    ideaTags: string[];
  };
}

interface EntityNode {
  id: string;                     // graph_structure 中的节点 id
  label: string;                  // 节点名称
  type: EntityType;
  desc: string;
}

interface RelationEdge {
  source: string;
  target: string;
  relation: RelationType;
  desc?: string;
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性充当人类可读规范和机器可验证正确性保证之间的桥梁。*


### 属性反思

在定义属性之前，我分析了验收标准以消除冗余：

**识别的冗余**：
- 属性 1.2 和 1.3（实体和关系类型验证）可以合并为单个 schema 验证属性
- 属性 4.3 和 4.4（合并关系建立）是重复的——都测试相同的 linked_idea_ids 行为
- 属性 7.2、7.3 和 7.4（关键词提取输出结构）可以合并为一个综合 schema 验证
- 属性 8.1、8.2、8.3 和 8.4（不同级别的 schema 验证）可以合并为一个综合 schema 验证属性
- 属性 11.3 和 11.4（边的视觉属性）可以合并为一个测试与相似度视觉相关性的属性

**合并后的属性**：
消除冗余后，我们有 30 个独特的属性，提供全面的验证覆盖。

### 正确性属性列表

属性 1：蒸馏提示词模板合规性
*对于任何*用户输入文本，当蒸馏引擎处理它时，发送给 LLM 的系统提示词应该匹配 PRD 中定义的 SYSTEM_PROMPT_DISTILL 模板
**验证：需求 1.1**

属性 2：完整蒸馏 schema 验证
*对于任何*蒸馏输出，所有节点应该具有允许集合中的类型（Concept、Tool、Person、Problem、Solution、Methodology、Metric），所有边应该具有允许集合中的关系（solves、causes、contradicts、consists_of、depends_on、enables、disrupts、powered_by、relates_to），并且所有必需字段（idea_id、created_at、content_raw、distilled_data 包含 one_liner、tags、summary、graph_structure）应该存在且类型正确
**验证：需求 1.2、1.3、1.5、8.1、8.2、8.3、8.4**

属性 3：One-liner 字数约束
*对于任何*蒸馏的想法，one_liner 字段应该包含不超过 20 个字
**验证：需求 1.4**

属性 4：Level 1 相似度阈值过滤
*对于任何* Level 1 图谱显示，显示的所有边应该具有大于或等于配置阈值的相似度分数
**验证：需求 2.2、11.2**

属性 5：级别转换保留想法选择
*对于任何*想法节点，点击它应该转换到 Level 2 视图，并将该想法作为焦点节点
**验证：需求 2.3**

属性 6：精炼保留原始内容
*对于任何*精炼操作，更新的想法应该保留原始 content_raw（可能附加注释），同时更新 distilled_data
**验证：需求 3.4**

属性 7：精炼整合两个上下文
*对于任何*带有新信息的精炼，生成的 distilled_data 应该包含来自原始想法和新上下文的元素（标签、实体或概念）
**验证：需求 3.3**

属性 8：多选时启用合并按钮
*对于任何*选择状态，当且仅当选择了 2 个或更多想法时，"合并想法"命令应该被启用
**验证：需求 4.1**

属性 9：合并输出包含源元素
*对于任何*对多个想法的合并操作，生成的合并想法应该包含至少出现在一个源想法中的标签或图谱实体
**验证：需求 4.2**

属性 10：合并建立继承关系
*对于任何*合并操作，生成的想法应该具有包含所有源想法 ID 的 merged_from_ids，并且这些 ID 应该是存在于数据库中的有效 UUID
**验证：需求 4.3、4.4**

属性 11：拆分产生有效数量的子想法
*对于任何*拆分操作，结果应该包含 2 到 5 个新想法（包含边界）
**验证：需求 5.2**

属性 12：拆分想法具有完整蒸馏
*对于任何*拆分操作，每个生成的子想法应该具有符合完整 schema 的完整 distilled_data
**验证：需求 5.3**

属性 13：拆分建立父子关系
*对于任何*拆分操作，原始想法应该具有包含所有新想法 ID 的 child_idea_ids，并且每个新想法应该具有指向原始想法的 parent_idea_id
**验证：需求 5.4、5.5**

属性 14：聊天提示词模板合规性
*对于任何*聊天消息，发送给 LLM 的系统提示词应该匹配 PRD 中定义的 SYSTEM_PROMPT_CHAT 模板
**验证：需求 6.1**

属性 15：RAG 上下文完整性
*对于任何*聊天交互，上下文应该包含来自相关想法的 graph_structure 数据（节点和边）和内容数据（summary、content_raw）
**验证：需求 6.2**

属性 16：响应引用格式
*对于任何*引用源材料的聊天响应，响应应该包含 [n] 引用标记，其中 n 是正整数，并且每个标记应该对应 citations 数组中的有效引用
**验证：需求 6.3**

属性 17：关键词提取提示词合规性
*对于任何*关键词提取请求，系统提示词应该匹配 SYSTEM_PROMPT_KEYWORDS 模板
**验证：需求 7.1**

属性 18：关键词提取输出结构
*对于任何*关键词提取结果，输出应该是包含 high_level_keywords 和 low_level_keywords 数组的 JSON 对象
**验证：需求 7.2、7.3、7.4**

属性 19：检索使用两种关键词类型
*对于任何*检索操作，high_level_keywords 和 low_level_keywords 都应该传递给搜索函数
**验证：需求 7.5**

属性 20：链接想法引用完整性
*对于任何*具有 linked_idea_ids 的想法，数组中的所有 ID 应该是存在于数据库中的有效 UUID
**验证：需求 8.5**

属性 21：多想法聊天上下文注入
*对于任何*多想法聊天会话，RAG 上下文应该包含来自所有选定想法的数据
**验证：需求 9.3**

属性 22：取消选择时更新上下文
*对于任何*多想法聊天期间的想法取消选择，RAG 上下文应该更新以排除该想法的数据
**验证：需求 9.5**

属性 23：图像文件类型验证
*对于任何*文件上传，如果文件类型不是支持的图像格式（jpg、jpeg、png、gif、bmp、webp），系统应该拒绝它并显示错误消息
**验证：需求 10.2**

属性 24：OCR 文本填充输入字段
*对于任何*成功的 OCR 操作，提取的文本应该出现在文本输入字段中
**验证：需求 10.4**

属性 25：余弦相似度计算
*对于任何*具有嵌入向量的想法对，相似度分数应该使用余弦相似度（点积除以幅度的乘积）计算
**验证：需求 11.1**

属性 26：边的视觉属性与相似度相关
*对于任何*图谱中渲染的边，线条粗细和不透明度都应该随相似度分数单调递增
**验证：需求 11.3、11.4**

属性 27：聊天消息追加到历史
*对于任何*发送或接收的聊天消息，它应该以适当的角色、内容和时间戳出现在想法的 chat_history 数组中
**验证：需求 12.1**

属性 28：导航时聊天历史持久化
*对于任何*想法切换，当前想法的 chat_history 应该在加载新想法之前保存到数据库
**验证：需求 12.2**

属性 29：聊天历史往返保留
*对于任何*具有 chat_history 的想法，保存然后加载想法应该保留所有消息及其时间戳和角色
**验证：需求 12.3、12.4**

属性 30：聊天历史选择性删除
*对于任何*清除聊天历史操作，chat_history 字段应该被删除或清空，而所有其他想法字段保持不变
**验证：需求 12.5**

## 错误处理

### 蒸馏错误

**LLM API 失败**：
- 使用指数退避重试（3 次尝试）
- 如果所有重试都失败，返回用户友好的错误消息
- 记录完整的错误详情以供调试
- 保留用户输入以便手动重试

**Schema 验证失败**：
- 记录无效输出以供分析
- 尝试修复常见问题（缺少字段、错误类型）
- 如果无法修复，提示用户重新表述输入
- 永远不要将无效数据存储到数据库

**One-Liner 长度违规**：
- 在单词边界自动截断到 20 字
- 记录警告以供监控
- 将此视为可以自动纠正的软约束

### 进化命令错误

**合并失败**：
- 在开始之前验证所有源想法是否存在
- 如果 LLM 无法生成连贯的合并，提供使用不同提示词重试的选项
- 如果合并部分完成，回滚数据库更改
- 即使合并失败也保留所有源想法

**拆分失败**：
- 验证源想法存在且具有足够的内容
- 如果 LLM 生成 < 2 或 > 5 个子想法，拒绝并重试
- 如果任何子想法未通过 schema 验证，回滚
- 即使拆分失败也保留原始想法

**精炼失败**：
- 如果精炼失败，保留原始 distilled_data
- 允许用户使用不同的措辞重试
- 记录失败以分析触发精炼问题的原因

### RAG 和聊天错误

**向量搜索失败**：
- 优雅降级到没有相似想法上下文的聊天
- 记录错误但不阻止用户交互
- 显示警告，说明上下文可能有限

**上下文构建错误**：
- 如果想法数据损坏，从上下文中排除它
- 继续使用可用的有效想法
- 通知用户哪些想法被排除

**LLM 响应错误**：
- 使用相同上下文重试一次
- 如果重试失败，显示通用错误消息
- 保留到失败点的聊天历史
- 允许用户重试他们的最后一条消息

### 数据完整性错误

**缺少嵌入向量**：
- 如果在相似度搜索期间缺少嵌入向量，重新生成
- 缓存重新生成的嵌入向量以供将来使用
- 记录警告以供监控

**断开的关系**：
- 在加载时验证 linked_idea_ids
- 删除对不存在想法的引用
- 记录断开的关系以供调查
- 如果关系被清理，向用户显示警告

**数据库损坏**：
- 在加载时验证 schema
- 尝试修复常见问题
- 如果无法修复，隔离损坏的想法
- 提供导出功能以供手动恢复

## 测试策略

### 单元测试

**后端单元测试**（Python + pytest）：
- 测试每个提示词模板格式化函数
- 使用有效和无效输入测试 schema 验证函数
- 使用已知向量测试余弦相似度计算
- 使用模拟 LLM 响应测试进化命令逻辑
- 测试数据库操作（保存、加载、更新、删除）
- 测试错误处理路径

**前端单元测试**（TypeScript + Vitest）：
- 测试 GraphLevelManager 状态转换
- 测试 EvolutionCommandUI 按钮启用/禁用逻辑
- 测试多选状态管理
- 测试数据转换函数
- 测试错误显示组件

### 基于属性的测试

我们将使用 **Hypothesis**（Python）进行后端属性测试，使用 **fast-check**（TypeScript）进行前端属性测试。每个属性测试应该运行至少 100 次迭代。

**后端属性测试**：

测试 1：Schema 验证完整性
- 生成具有各种字段组合的随机想法对象
- 验证 schema 验证器正确识别有效与无效想法
- **功能：ideagraph-enhancement，属性 2：完整蒸馏 schema 验证**

测试 2：One-Liner 字数
- 生成不同长度的随机文本
- 使用这些文本作为 one-liner 创建蒸馏数据
- 验证字数约束得到执行
- **功能：ideagraph-enhancement，属性 3：One-liner 字数约束**

测试 3：相似度阈值过滤
- 生成随机相似度分数和阈值
- 构建 Level 1 图谱数据
- 验证所有边满足阈值要求
- **功能：ideagraph-enhancement，属性 4：Level 1 相似度阈值过滤**

测试 4：精炼内容保留
- 生成随机原始想法和新上下文
- 执行精炼操作
- 验证原始 content_raw 被保留
- **功能：ideagraph-enhancement，属性 6：精炼保留原始内容**

测试 5：合并关系完整性
- 生成 2-5 个想法的随机集合
- 执行合并操作
- 验证 merged_from_ids 包含所有源 ID
- **功能：ideagraph-enhancement，属性 10：合并建立继承关系**

测试 6：拆分数量约束
- 生成具有不同内容长度的随机想法
- 执行拆分操作
- 验证结果包含 2-5 个子想法
- **功能：ideagraph-enhancement，属性 11：拆分产生有效数量的子想法**

测试 7：拆分关系完整性
- 生成随机想法
- 执行拆分操作
- 验证父级具有 child_idea_ids，子级具有 parent_idea_id
- **功能：ideagraph-enhancement，属性 13：拆分建立父子关系**

测试 8：关键词提取结构
- 生成随机查询文本
- 提取关键词
- 验证输出具有 high_level_keywords 和 low_level_keywords 数组
- **功能：ideagraph-enhancement，属性 18：关键词提取输出结构**

测试 9：引用完整性
- 生成具有 linked_idea_ids 的随机想法
- 验证所有引用的 ID 存在于数据库中
- **功能：ideagraph-enhancement，属性 20：链接想法引用完整性**

测试 10：余弦相似度正确性
- 生成随机嵌入向量
- 计算相似度
- 验证结果与手动余弦相似度计算匹配
- **功能：ideagraph-enhancement，属性 25：余弦相似度计算**

测试 11：聊天历史往返
- 生成随机聊天消息
- 保存到数据库并重新加载
- 验证所有消息及其时间戳和角色被保留
- **功能：ideagraph-enhancement，属性 29：聊天历史往返保留**

**前端属性测试**：

测试 12：级别转换一致性
- 生成随机想法 ID
- 模拟点击每个节点
- 验证 Level 2 视图聚焦于点击的想法
- **功能：ideagraph-enhancement，属性 5：级别转换保留想法选择**

测试 13：合并按钮状态
- 生成随机选择状态（选择 0-10 个想法）
- 验证按钮仅在选择 >= 2 时启用
- **功能：ideagraph-enhancement，属性 8：多选时启用合并按钮**

测试 14：多想法上下文完整性
- 生成随机选定想法集合
- 构建 RAG 上下文
- 验证所有选定想法存在于上下文中
- **功能：ideagraph-enhancement，属性 21：多想法聊天上下文注入**

测试 15：取消选择时更新上下文
- 生成随机选择和取消选择序列
- 验证上下文正确更新
- **功能：ideagraph-enhancement，属性 22：取消选择时更新上下文**

测试 16：图像文件验证
- 生成随机文件类型（有效和无效）
- 测试上传验证
- 验证仅接受有效图像类型
- **功能：ideagraph-enhancement，属性 23：图像文件类型验证**

测试 17：边的视觉相关性
- 生成随机相似度分数
- 渲染边
- 验证粗细和不透明度随相似度增加
- **功能：ideagraph-enhancement，属性 26：边的视觉属性与相似度相关**

测试 18：聊天消息追加
- 生成随机消息
- 通过聊天界面发送
- 验证每条消息出现在 chat_history 中
- **功能：ideagraph-enhancement，属性 27：聊天消息追加到历史**

### 集成测试

**端到端流程**：
1. 完整想法创建流程（输入 → 蒸馏 → 存储 → 显示）
2. 图谱级别切换流程（Level 1 → 点击节点 → Level 2 → 返回）
3. 合并流程（选择想法 → 合并 → 验证新想法 → 验证关系）
4. 拆分流程（选择想法 → 拆分 → 验证子想法 → 验证关系）
5. 精炼流程（聊天 → 检测变化 → 确认 → 验证更新）
6. 多想法聊天流程（选择多个 → 聊天 → 验证上下文）
7. 图像上传流程（上传 → OCR → 蒸馏 → 存储）

**API 集成测试**：
- 使用各种有效负载测试所有后端端点
- 测试错误响应和状态码
- 测试并发请求
- 测试大型有效负载（长想法、许多节点/边）

**数据库集成测试**：
- 测试保存/加载周期
- 测试并发写入
- 测试数据迁移场景
- 测试备份和恢复

### 手动测试清单

- [ ] 图谱转换的视觉流畅性
- [ ] LLM 调用期间 UI 的响应性
- [ ] 不同节点数量下的图谱布局质量
- [ ] 聊天对话流程和自然性
- [ ] 错误消息的清晰度和有用性
- [ ] 移动响应性（如果适用）
- [ ] 可访问性（键盘导航、屏幕阅读器）
- [ ] 大型知识库（100+ 想法）的性能

## 实施说明

### 技术栈

**现有技术栈**（将保持）：
- 前端：React 18 + TypeScript + Vite
- 可视化：D3.js
- 后端：Flask + Python 3.9+
- LLM：OpenAI 兼容 API（可配置）
- 存储：基于 Pickle 的向量数据库

**新依赖项**：
- 前端：`fast-check` 用于基于属性的测试
- 后端：`hypothesis` 用于基于属性的测试
- 后端：`jsonschema` 用于 schema 验证
- 后端：`pillow` 用于图像处理（OCR 准备）
- 后端：OpenAI Vision API 或 Tesseract 用于 OCR

### 性能考虑

**图谱渲染**：
- 为具有 100+ 节点的 Level 1 图谱实现虚拟化
- 对于非常大的图谱（500+ 节点）使用 WebGL 渲染
- 缓存计算的布局以避免重新计算
- 在批量操作期间对相似度计算进行防抖

**向量搜索**：
- 当前基于 pickle 的方法适用于 < 1000 个想法
- 对于更大规模，迁移到适当的向量数据库（Qdrant、Weaviate 或 Pinecone）
- 实现近似最近邻搜索（ANN）以提高速度
- 缓存频繁访问想法之间的相似度分数

**LLM 调用**：
- 实现请求队列以避免速率限制
- 缓存相同输入的蒸馏结果
- 对聊天使用流式响应以改善感知性能
- 实现超时处理（蒸馏 30 秒，进化命令 60 秒）

**数据库操作**：
- 尽可能批量保存操作
- 实现预写日志以进行崩溃恢复
- 为长时间运行的实例添加数据库压缩
- 考虑迁移到 SQLite 或 PostgreSQL 以获得更好的并发性

### 安全考虑

**API 密钥管理**：
- 永远不要在前端代码中暴露 API 密钥
- 对所有机密使用环境变量
- 实现密钥轮换功能
- 记录 API 使用情况以供监控

**输入验证**：
- 在 LLM 调用之前清理所有用户输入
- 限制输入文本长度（例如 10,000 个字符）
- 验证文件上传（类型、大小、内容）
- 防止提示词中的注入攻击

**数据隐私**：
- 默认情况下所有数据本地存储
- 实现用户数据可移植性的导出功能
- 清楚记录哪些数据发送给 LLM 提供商
- 为隐私敏感用例提供使用本地 LLM 模型的选项

### 部署考虑

**开发**：
- Docker Compose 设置以便于本地开发
- 前端和后端的热重载
- 模拟 LLM 响应以进行测试而无需 API 成本

**生产**：
- 容器化部署（Docker）
- 反向代理（nginx）用于提供前端和后端
- 进程管理器（systemd 或 supervisor）用于后端
- 向量数据库的自动备份
- 监控和日志记录（Sentry、LogRocket 或类似工具）

**扩展**：
- 使用负载均衡器水平扩展后端
- 共享向量数据库（Redis 或专用向量数据库）
- 前端资源的 CDN
- 每个用户的速率限制以防止滥用
