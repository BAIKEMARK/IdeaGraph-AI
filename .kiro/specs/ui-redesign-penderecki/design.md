# Design Document

## Overview

本设计文档描述了 IdeaGraph 应用的 UI 重构方案，参考 Penderecki's Garden 网站的设计美学。重构将保持现有功能完整性的同时，引入更加优雅、沉浸式的用户界面，提升整体用户体验。

设计核心理念：
- **优雅简约**：使用精致的排版、适度的留白和克制的色彩
- **流畅动效**：通过自然的动画和过渡增强交互体验
- **视觉深度**：利用玻璃态、阴影和渐变创造层次感
- **沉浸体验**：打造专注、无干扰的工作环境

## Architecture

### Component Hierarchy

```
App
├── HeroSection (新增 - 首次访问时显示)
│   ├── AnimatedTitle
│   ├── FeatureHighlights
│   └── CTAButton
├── MainLayout
│   ├── EnhancedSidebar
│   │   ├── AppHeader
│   │   ├── IdeaInputArea
│   │   └── IdeaListPanel
│   └── ContentArea
│       ├── GraphVisualization
│       └── ChatPanel
└── LoadingStates
    ├── SkeletonLoader
    └── LoadingAnimation
```

### Design System Structure

```
styles/
├── tokens/
│   ├── colors.css          # 色彩系统
│   ├── typography.css      # 字体系统
│   ├── spacing.css         # 间距系统
│   └── shadows.css         # 阴影系统
├── effects/
│   ├── glassmorphism.css   # 玻璃态效果
│   ├── animations.css      # 动画库
│   └── transitions.css     # 过渡效果
└── components/
    ├── buttons.css         # 按钮样式
    ├── cards.css           # 卡片样式
    └── forms.css           # 表单样式
```

## Components and Interfaces

### 1. HeroSection Component

首次访问时显示的欢迎界面，提供应用介绍和引导。

**Props:**
```typescript
interface HeroSectionProps {
  onGetStarted: () => void;
  onSkip: () => void;
}
```

**Features:**
- 大标题动画（逐字淡入）
- 特性卡片展示（交错动画）
- 视差背景效果
- 平滑滚动过渡

### 2. EnhancedSidebar Component

重新设计的侧边栏，使用玻璃态效果和改进的视觉层次。

**Props:**
```typescript
interface EnhancedSidebarProps {
  ideas: Idea[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateIdea: (text: string) => void;
  // ... 其他现有 props
}
```

**Design Features:**
- 半透明背景 + 背景模糊（backdrop-filter: blur(20px)）
- 渐变边框
- 自定义滚动条样式
- 卡片悬停效果（提升 + 发光）

### 3. GraphVisualization Enhancement

增强图谱可视化的视觉效果和交互体验。

**New Features:**
- 节点发光效果（box-shadow + filter: drop-shadow）
- 渐变连线（SVG linearGradient）
- 粒子背景动画
- 平滑的缩放和拖拽

**Implementation:**
```typescript
// 节点样式增强
const nodeStyle = {
  fill: 'url(#nodeGradient)',
  filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.5))',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
};

// 连线渐变
<defs>
  <linearGradient id="edgeGradient">
    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
  </linearGradient>
</defs>
```

### 4. ChatInterface Enhancement

现代化的聊天界面设计。

**Design Features:**
- 消息气泡重新设计（圆角、阴影、渐变）
- 打字指示器动画
- 消息入场动画（从下方滑入 + 淡入）
- 平滑自动滚动

### 5. LoadingStates Component

优雅的加载状态处理。

**Types:**
```typescript
type LoadingType = 'skeleton' | 'spinner' | 'shimmer';

interface LoadingStatesProps {
  type: LoadingType;
  message?: string;
}
```

**Skeleton Screen:**
- 使用渐变动画模拟内容加载
- 保持布局稳定性
- 平滑过渡到实际内容

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: {
      base: string;
      elevated: string;
      overlay: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
  };
  effects: {
    glassmorphism: {
      background: string;
      blur: string;
      border: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
      glow: string;
    };
  };
  animations: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      default: string;
      spring: string;
      smooth: string;
    };
  };
}
```

### Animation Configuration

```typescript
interface AnimationConfig {
  fadeIn: {
    duration: number;
    delay?: number;
    easing: string;
  };
  slideIn: {
    direction: 'up' | 'down' | 'left' | 'right';
    duration: number;
    distance: number;
  };
  scale: {
    from: number;
    to: number;
    duration: number;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Visual Consistency Properties

Property 1: Color palette consistency
*For any* rendered interface element, the element should use colors from the defined theme color palette
**Validates: Requirements 2.1**

Property 2: Glassmorphism effect consistency
*For any* background element, the element should have backdrop-filter blur and semi-transparent background properties
**Validates: Requirements 2.2**

Property 3: Typography consistency
*For any* text element, the element should use the defined font-family, font-weight, and line-height from the typography system
**Validates: Requirements 2.3**

Property 4: Shadow treatment consistency
*For any* card or panel element, the element should have box-shadow CSS property applied
**Validates: Requirements 2.4**

Property 5: Spacing consistency
*For any* component, the spacing values (margin, padding) should be multiples of the base spacing unit (4px or 8px)
**Validates: Requirements 2.5**

### Animation Properties

Property 6: Hover transition consistency
*For any* interactive element, the element should have CSS transition properties defined for hover state changes
**Validates: Requirements 3.1**

Property 7: Entrance animation consistency
*For any* newly rendered content element, the element should have animation or transition properties for entrance effects
**Validates: Requirements 3.2**

Property 8: Easing function consistency
*For any* transition or animation, the timing function should use defined easing curves (cubic-bezier or named easing)
**Validates: Requirements 3.5**

### Navigation Properties

Property 9: Navigation hover feedback
*For any* navigation item, the item should have hover state styles with transition properties
**Validates: Requirements 4.2**

### Sidebar Properties

Property 10: Card hover effects
*For any* idea card in the sidebar, the card should have hover state styles defined
**Validates: Requirements 5.2**

Property 11: Form focus states
*For any* form input in the sidebar, the input should have focus state styles defined
**Validates: Requirements 5.4**

### Graph Visualization Properties

Property 12: Node visual effects
*For any* graph node element, the node should have glow effects (box-shadow or filter) and transition properties
**Validates: Requirements 6.2**

Property 13: Edge gradient styling
*For any* graph edge element, the edge should use SVG gradient definitions with opacity attributes
**Validates: Requirements 6.3**

Property 14: Node interaction feedback
*For any* graph node, the node should have transition CSS and hover state changes defined
**Validates: Requirements 6.4**

### Chat Interface Properties

Property 15: Message entrance animation
*For any* new chat message element, the message should have entrance animation classes or properties applied
**Validates: Requirements 7.2**

### Responsive Design Properties

Property 16: Layout adaptation
*For any* viewport width change, the layout should adapt by applying appropriate CSS classes or styles based on breakpoint
**Validates: Requirements 8.1**

### Shadow System Properties

Property 17: Multi-layer shadows
*For any* elevated element, the element should have box-shadow CSS with multiple comma-separated shadow definitions
**Validates: Requirements 9.1**

Property 18: Hover shadow enhancement
*For any* interactive element, the hover state should have increased box-shadow values compared to default state
**Validates: Requirements 9.2**

Property 19: Inset shadow usage
*For any* card or panel element, the element should have inset box-shadow CSS property
**Validates: Requirements 9.3**

Property 20: Glow effects on contrast
*For any* light-colored element on dark background, the element should have glow effect (box-shadow or filter with blur)
**Validates: Requirements 9.4**

Property 21: Shadow direction consistency
*For any* box-shadow definition, the x and y offset values should follow consistent directional pattern (e.g., all shadows cast downward-right)
**Validates: Requirements 9.5**

### Performance Properties

Property 22: Loading state responsiveness
*For any* loading state change, the visual feedback should appear within 100 milliseconds
**Validates: Requirements 10.5**

## Error Handling

### CSS Fallbacks

对于不支持现代 CSS 特性的浏览器，提供优雅降级：

```css
/* Glassmorphism with fallback */
.glass-panel {
  background: rgba(15, 23, 42, 0.8); /* Fallback */
  backdrop-filter: blur(20px);
}

@supports not (backdrop-filter: blur(20px)) {
  .glass-panel {
    background: rgba(15, 23, 42, 0.95); /* More opaque fallback */
  }
}
```

### Animation Performance

使用 `will-change` 提示浏览器优化动画性能，但避免过度使用：

```css
.animated-element {
  will-change: transform, opacity;
}

/* 动画完成后移除 */
.animated-element.animation-complete {
  will-change: auto;
}
```

### Loading State Errors

当加载失败时，显示友好的错误状态：

```typescript
interface ErrorState {
  type: 'network' | 'timeout' | 'unknown';
  message: string;
  retry?: () => void;
}
```

## Testing Strategy

### Visual Regression Testing

使用视觉回归测试工具（如 Percy, Chromatic）确保 UI 变更不会意外破坏设计：

1. 为关键界面状态创建快照
2. 在 PR 中自动比较视觉差异
3. 人工审核视觉变更

### Component Testing

使用 React Testing Library 测试组件行为：

```typescript
describe('HeroSection', () => {
  it('should display when no ideas exist', () => {
    render(<HeroSection ideas={[]} />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should not display when ideas exist', () => {
    render(<HeroSection ideas={mockIdeas} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
```

### CSS Property Testing

测试关键 CSS 属性是否正确应用：

```typescript
describe('Glassmorphism effects', () => {
  it('should apply backdrop-filter to glass panels', () => {
    const { container } = render(<GlassPanel />);
    const panel = container.firstChild;
    const styles = window.getComputedStyle(panel);
    expect(styles.backdropFilter).toContain('blur');
  });
});
```

### Animation Testing

测试动画是否正确触发：

```typescript
describe('Entrance animations', () => {
  it('should apply fade-in animation to new messages', () => {
    const { container } = render(<ChatMessage />);
    const message = container.firstChild;
    expect(message).toHaveClass('animate-fade-in');
  });
});
```

### Responsive Testing

测试不同视口尺寸下的布局：

```typescript
describe('Responsive layout', () => {
  it('should stack vertically on mobile', () => {
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));
    const { container } = render(<MainLayout />);
    expect(container.firstChild).toHaveClass('flex-col');
  });

  it('should use multi-column on desktop', () => {
    global.innerWidth = 1920;
    global.dispatchEvent(new Event('resize'));
    const { container } = render(<MainLayout />);
    expect(container.firstChild).toHaveClass('flex-row');
  });
});
```

### Accessibility Testing

确保 UI 重构不影响可访问性：

```typescript
describe('Accessibility', () => {
  it('should maintain keyboard navigation', () => {
    render(<Navigation />);
    const firstItem = screen.getAllByRole('link')[0];
    firstItem.focus();
    expect(document.activeElement).toBe(firstItem);
  });

  it('should have sufficient color contrast', () => {
    // Use tools like jest-axe
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Performance Testing

测试动画性能和加载时间：

```typescript
describe('Performance', () => {
  it('should respond to loading state changes within 100ms', async () => {
    const startTime = performance.now();
    const { rerender } = render(<LoadingState isLoading={false} />);
    rerender(<LoadingState isLoading={true} />);
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100);
  });
});
```

## Implementation Notes

### CSS-in-JS vs CSS Modules

考虑到项目已使用 Tailwind CSS，建议：
- 继续使用 Tailwind 的 utility classes 作为基础
- 使用 `@apply` 指令创建可复用的组件样式
- 对于复杂动画，使用 CSS Modules 或 styled-components

### Animation Library

推荐使用 Framer Motion 实现复杂动画：
- 声明式 API，易于维护
- 内置手势支持
- 优秀的性能优化
- 支持 SVG 动画

```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  {content}
</motion.div>
```

### Progressive Enhancement

确保核心功能在禁用 JavaScript 或动画的情况下仍可用：
- 使用 CSS 动画而非 JS 动画（当可能时）
- 提供 `prefers-reduced-motion` 媒体查询支持
- 确保内容在动画前可访问

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Browser Compatibility

目标浏览器支持：
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动浏览器：iOS Safari 14+, Chrome Android 90+

关键特性兼容性：
- `backdrop-filter`: 需要 fallback
- CSS Grid: 广泛支持
- CSS Custom Properties: 广泛支持
- `will-change`: 广泛支持

## Migration Strategy

### Phase 1: Design System Setup
1. 创建设计令牌（colors, spacing, typography）
2. 建立组件样式库
3. 设置动画系统

### Phase 2: Core Components
1. 重构 Sidebar 组件
2. 增强 Graph Visualization
3. 更新 Chat Interface

### Phase 3: New Features
1. 实现 Hero Section
2. 添加 Loading States
3. 完善动画效果

### Phase 4: Polish & Optimization
1. 性能优化
2. 可访问性审查
3. 跨浏览器测试

每个阶段完成后进行用户测试和反馈收集。
