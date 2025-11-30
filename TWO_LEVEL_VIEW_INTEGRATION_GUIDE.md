# 两级视图功能完整启用指南

## 📋 当前状态

### ✅ 已完成的基础组件
1. **任务 2**：`utils/graphLevelManager.ts` - 图谱级别管理系统
2. **任务 3**：`components/GraphView.tsx` - 支持两级视图的图谱组件

### ❌ 缺失的集成层
**在 App.tsx 中集成 GraphLevelManager 和 GraphView**

这个集成工作**没有在任务列表中明确列出**，但它是启用两级视图功能的关键步骤。

## 🎯 需要完成的集成工作

### 步骤 1：在 App.tsx 中初始化 GraphLevelManager

```typescript
import { GraphLevelManager } from './utils/graphLevelManager';

function AppContent() {
  // ... 现有状态
  
  // 新增：图谱级别管理器
  const [graphLevelManager] = useState(() => new GraphLevelManager());
  const [currentGraphLevel, setCurrentGraphLevel] = useState<1 | 2>(1);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  
  // 当想法列表变化时，更新管理器
  useEffect(() => {
    graphLevelManager.setIdeas(ideas);
    updateGraphData();
  }, [ideas]);
  
  const updateGraphData = () => {
    const data = graphLevelManager.getGraphData();
    setGraphData(data);
    setCurrentGraphLevel(graphLevelManager.getCurrentLevel());
  };
  
  // ... 其他代码
}
```

### 步骤 2：添加级别转换处理函数

```typescript
// 处理节点点击（Level 1 → Level 2）
const handleNodeClick = (nodeId: string) => {
  if (currentGraphLevel === 1) {
    // 从 Level 1 点击想法节点，转换到 Level 2
    graphLevelManager.transitionToLevel2(nodeId);
    setSelectedIdeaId(nodeId);
    updateGraphData();
  }
};

// 处理返回 Level 1
const handleBackToLevel1 = () => {
  graphLevelManager.transitionToLevel1();
  updateGraphData();
};
```

### 步骤 3：更新 GraphView 组件的使用

```typescript
// 在渲染部分，替换现有的 GraphView
<GraphView 
  graphData={graphData}
  onNodeClick={handleNodeClick}
  onBackToLevel1={handleBackToLevel1}
/>
```

### 步骤 4：添加级别切换 UI（可选）

```typescript
// 在图谱视图上方添加级别指示器
<div className="absolute top-4 right-4 bg-slate-800/90 px-3 py-1 rounded text-sm">
  {currentGraphLevel === 1 ? '宏观视图' : '微观视图'}
</div>
```

## 📝 完整的集成示例

```typescript
// App.tsx 中的关键修改

import { GraphLevelManager, GraphData } from './utils/graphLevelManager';

function AppContent() {
  const { t, language, setLanguage } = useLanguage();
  const [ideas, setIdeas] = useState<Idea[]>(MOCK_IDEAS);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(MOCK_IDEAS[0].idea_id);
  
  // 新增：图谱级别管理
  const [graphLevelManager] = useState(() => new GraphLevelManager());
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  
  const selectedIdea = ideas.find(i => i.idea_id === selectedIdeaId) || null;

  // 当想法列表变化时，更新图谱数据
  useEffect(() => {
    if (ideas.length > 0) {
      graphLevelManager.setIdeas(ideas);
      updateGraphData();
    }
  }, [ideas]);

  const updateGraphData = () => {
    try {
      const data = graphLevelManager.getGraphData();
      setGraphData(data);
    } catch (error) {
      console.error('Failed to update graph data:', error);
    }
  };

  // 处理图谱节点点击
  const handleGraphNodeClick = (nodeId: string) => {
    const currentLevel = graphLevelManager.getCurrentLevel();
    
    if (currentLevel === 1) {
      // Level 1: 点击想法节点，转换到 Level 2
      graphLevelManager.transitionToLevel2(nodeId);
      setSelectedIdeaId(nodeId);
      updateGraphData();
    }
  };

  // 处理返回 Level 1
  const handleBackToLevel1 = () => {
    graphLevelManager.transitionToLevel1();
    updateGraphData();
  };

  // ... 其他现有代码

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans">
      {/* ... 侧边栏 ... */}
      
      <div className="flex-1 flex flex-col relative h-full">
        {selectedIdea ? (
          <>
            {/* ... 头部 ... */}
            
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* 图谱视图容器 */}
              <div className="flex-1 h-1/2 lg:h-full lg:w-2/3 border-b lg:border-b-0 lg:border-r border-slate-800 relative bg-slate-950">
                {graphData ? (
                  <GraphView 
                    graphData={graphData}
                    onNodeClick={handleGraphNodeClick}
                    onBackToLevel1={handleBackToLevel1}
                  />
                ) : (
                  // 向后兼容：如果没有 graphData，使用旧模式
                  <GraphView data={selectedIdea.distilled_data.graph_structure} />
                )}
                
                {/* 级别指示器 */}
                {graphData && (
                  <div className="absolute top-4 right-4 bg-slate-800/90 px-3 py-1 rounded text-sm border border-slate-700">
                    {graphData.level === 1 ? '🌐 宏观视图' : '🔬 微观视图'}
                  </div>
                )}
                
                {/* ... 现有的覆盖信息 ... */}
              </div>
              
              {/* ... 右侧面板 ... */}
            </div>
          </>
        ) : (
          // ... 空状态 ...
        )}
      </div>
    </div>
  );
}
```

## 🔧 可选的增强功能

### 1. 添加相似度阈值调节器

```typescript
const [similarityThreshold, setSimilarityThreshold] = useState(0.7);

useEffect(() => {
  graphLevelManager.setSimilarityThreshold(similarityThreshold);
  updateGraphData();
}, [similarityThreshold]);

// UI 组件
<div className="absolute bottom-4 right-4 bg-slate-800/90 p-3 rounded">
  <label className="text-xs">相似度阈值: {similarityThreshold.toFixed(2)}</label>
  <input 
    type="range" 
    min="0.5" 
    max="1" 
    step="0.05"
    value={similarityThreshold}
    onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
  />
</div>
```

### 2. 添加键盘快捷键

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && graphLevelManager.getCurrentLevel() === 2) {
      handleBackToLevel1();
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

### 3. 添加转换动画提示

```typescript
const [isTransitioning, setIsTransitioning] = useState(false);

const handleGraphNodeClick = async (nodeId: string) => {
  setIsTransitioning(true);
  
  // 延迟以显示动画
  await new Promise(resolve => setTimeout(resolve, 300));
  
  graphLevelManager.transitionToLevel2(nodeId);
  setSelectedIdeaId(nodeId);
  updateGraphData();
  
  setIsTransitioning(false);
};
```

## 📊 集成后的功能流程

### Level 1（宏观视图）
1. 用户打开应用 → 显示所有想法的宏观图谱
2. 节点大小相同，颜色统一（蓝色）
3. 边的粗细和透明度反映相似度
4. 悬停显示相似度百分比
5. 点击节点 → 转换到 Level 2

### Level 2（微观视图）
1. 显示选中想法的详细实体关系图
2. 节点按类型着色（Concept、Tool、Person 等）
3. 显示关系边和标签
4. 左上角显示"返回概览"按钮
5. 点击返回 → 转换回 Level 1

## 🎯 为什么这个集成没有在任务列表中？

查看任务列表后发现：
- **任务 2** 创建了 GraphLevelManager 工具类
- **任务 3** 增强了 GraphView 组件
- **任务 5-21** 都是其他功能（进化命令、RAG、OCR 等）

**集成工作被假定为"隐含在任务 3 中"**，但实际上它是一个独立的步骤。

## 💡 建议

如果你想现在就启用两级视图功能，可以：

1. **选项 A**：按照上面的指南手动集成到 App.tsx
2. **选项 B**：创建一个新的任务"3.5 在 App.tsx 中集成两级视图"
3. **选项 C**：等到完成更多任务后再一起集成

我建议选择**选项 A**，因为：
- 基础组件已经完成
- 集成代码相对简单
- 可以立即看到两级视图的效果
- 不会影响其他任务的进行

## 📝 总结

**完全启用两级视图功能需要在 App.tsx 中集成 GraphLevelManager**，这个工作：
- ✅ 不在原始任务列表中
- ✅ 是任务 2 和任务 3 之间的"隐含步骤"
- ✅ 需要约 50-100 行代码
- ✅ 可以立即实现

你想现在就实现这个集成吗？
