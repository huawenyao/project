# AI 思考过程可视化系统 - 页面集成实现方案

## 📋 产品核心功能分析

### 产品定位
**AI-Native Agent App Builder** - 用户通过自然语言描述需求，AI Agents 自动构建、配置和部署应用程序

### 核心 Agents
1. **UIAgent** - UI 组件选择和布局优化
2. **BackendAgent** - API 创建和业务逻辑
3. **DatabaseAgent** - 数据库架构设计
4. **IntegrationAgent** - 第三方集成
5. **DeploymentAgent** - 环境设置和部署

### 用户核心操作流程
```
用户登录 → Dashboard (概览) → Builder (输入需求 + 开始构建)
→ 实时观看 Agents 工作 → 构建完成 → Apps (应用列表) → 查看/回放历史
```

---

## 🎯 页面组件集成方案

### 1. **Builder 页面** (核心页面 - 80% 可视化功能)

#### 页面布局
```
┌─────────────────────────────────────────────────────────────┐
│ Header (ConnectionIndicator + 用户信息)                      │
├──────────────┬──────────────────────────────┬────────────────┤
│              │                              │                │
│   左侧面板    │        中央工作区             │   右侧边栏      │
│   (30%)      │         (50%)               │    (20%)       │
│              │                              │                │
│ [需求输入]    │   [Agent 状态卡片网格]        │ [决策时间线]    │
│              │   ┌─────┐ ┌─────┐           │                │
│ • 项目名称    │   │UIAgt│ │BEAgt│           │ • 未读决策(3)   │
│ • 需求描述    │   └─────┘ └─────┘           │ • 高重要性决策  │
│ • 技术栈选择  │   ┌─────┐ ┌─────┐           │ • 时间线       │
│ • 高级选项    │   │DBAgt│ │IntAg│           │ • 筛选/搜索    │
│              │   └─────┘ └─────┘           │                │
│ [开始构建]    │   ┌─────┐                   │                │
│              │   │DplAgt│                   │                │
│ [构建历史]    │   └─────┘                   │                │
│              │                              │                │
│              │   [整体进度条]                │                │
│              │   ████████░░ 65%             │                │
│              │                              │                │
│              │   [错误卡片] (如果有)          │                │
│              │   ⚠️ DatabaseAgent 连接超时   │                │
│              │                              │                │
├──────────────┴──────────────────────────────┴────────────────┤
│ 底部可折叠区 (Agent 协作视图)                                  │
│ ▼ Agent 协作关系图 (列表视图 ⇌ 图形视图)                       │
│   UIAgent → BackendAgent → DatabaseAgent → DeploymentAgent   │
└─────────────────────────────────────────────────────────────┘
```

#### 组件集成清单

**左侧面板** (BuilderSidebar.tsx - 新建)
- 需求输入表单
  - 项目名称输入框
  - 需求描述多行文本框 (支持 Markdown)
  - 技术栈选择 (React/Vue, Node/Django, MySQL/PostgreSQL)
  - 高级选项折叠面板
- 操作按钮
  - "开始构建" 按钮 (主要 CTA)
  - "保存草稿" 按钮
  - "清空" 按钮
- 构建历史快捷入口
  - 最近 3 个构建会话卡片

**中央工作区** (BuilderWorkspace.tsx - 新建)
- **AgentStatusGrid.tsx** (新建)
  - 使用 `AgentStatusCard` 组件展示 5 个 Agent
  - 网格布局 (2-3 列自适应)
  - 实时 WebSocket 更新
  - 点击卡片展开详情

- **ProgressSummary** 组件
  - 整体进度条
  - 已完成/进行中/待启动 Agent 数量统计
  - 预计剩余时间

- **ErrorCard** 组件 (条件渲染)
  - 当 Agent 失败时显示
  - 错误详情、恢复选项
  - 重试/跳过/终止按钮

**右侧边栏** (DecisionSidebarPanel.tsx - 新建)
- **DecisionTimeline** 组件
  - 决策时间线（按时间倒序）
  - 未读决策数量徽章
  - 决策重要性标记（高/中/低）
  - 点击展开 DecisionModal
  - "全部标为已读" 按钮
  - 筛选选项 (按 Agent, 按重要性)

**底部可折叠区** (CollaborationPanel.tsx - 新建)
- 折叠/展开按钮
- **AgentDependencyGraph** 组件 (图形视图)
- **AgentListView** 组件 (列表视图)
- 视图切换按钮
- **TaskQueueViewer** 组件 (可选)

**浮动通知**
- **DecisionToast** 组件 (右下角)
  - 高重要性决策弹出通知
  - 5 秒自动消失
  - 点击查看详情/关闭按钮

**全局**
- **ThemeToggle** (Header 区域)
- **FocusModeToggle** (Header 区域)
- **ConnectionIndicator** (Header 区域) ✅ 已完成

---

### 2. **Dashboard 页面** (概览监控 - 15% 可视化功能)

#### 页面布局
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 项目概览                                                   │
│ ┌──────────┬──────────┬──────────┬──────────┐               │
│ │ 总项目数  │ 进行中   │ 已完成   │ 失败     │               │
│ │   24     │    3     │   18     │   3      │               │
│ └──────────┴──────────┴──────────┴──────────┘               │
│                                                              │
│ 🔄 进行中的构建 (2个)                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 电商管理系统                              65% ████████░░ │ │
│ │ 3/5 Agents 完成 • UIAgent 进行中                        │ │
│ │ [查看详情] [进入 Builder]                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────┬───────────────────────────────┐│
│ │ 📝 最近决策 (3条)          │ 📈 Agent 活动统计             ││
│ │ • UIAgent: 选择 React      │   [Agent 活动图表]           ││
│ │ • BackendAgent: REST API   │   UIAgent    ████████ 80%   ││
│ │ • DatabaseAgent: PostgreSQL│   BackendAgt █████████ 90%  ││
│ └──────────────────────────┴───────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### 组件集成清单
- **快速统计卡片** (DashboardStats.tsx - 新建)
  - 项目数、进行中、完成、失败统计

- **进行中的构建列表** (ActiveBuilds.tsx - 新建)
  - 使用 `ProgressSummary` 组件
  - 卡片式展示每个进行中的构建
  - "查看详情" → 跳转到 Builder

- **最近决策面板** (RecentDecisions.tsx - 新建)
  - 使用 `DecisionTimeline` 组件 (简化版，只显示最近 5 条)
  - 点击跳转到具体项目的 Builder 页面

- **Agent 活动统计** (AgentActivityStats.tsx - 新建)
  - Agent 使用频率图表
  - Agent 平均耗时统计
  - Agent 成功率统计

---

### 3. **Apps 页面** (应用管理 + 历史回放 - 5% 可视化功能)

#### 页面布局
```
┌─────────────────────────────────────────────────────────────┐
│ 🗂️ 我的应用 (24个)                    [搜索] [筛选] [排序]    │
│                                                              │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐
│ │ 📱 电商系统   │ 🎨 博客平台   │ 💼 CRM系统   │ 📊 数据看板  │
│ │ ✅ 已完成     │ 🔄 构建中65% │ ✅ 已完成     │ ❌ 失败      │
│ │ 2天前        │ 5分钟前      │ 1周前        │ 3天前       │
│ │ [详情][回放] │ [详情][进入] │ [详情][回放] │ [详情][重试] │
│ └──────────────┴──────────────┴──────────────┴──────────────┘
│                                                              │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐
│ │ ...          │ ...          │ ...          │ ...         │
│ └──────────────┴──────────────┴──────────────┴──────────────┘
└─────────────────────────────────────────────────────────────┘
```

#### 应用详情页 (AppDetail.tsx - 新建)
```
┌─────────────────────────────────────────────────────────────┐
│ ← 返回应用列表          电商管理系统                          │
│                                                              │
│ ┌─ 基本信息 ──────────────────────────────────────────────┐ │
│ │ 状态: ✅ 已完成                                          │ │
│ │ 创建时间: 2025-10-28 15:30                              │ │
│ │ 完成时间: 2025-10-28 16:45 (耗时 1小时15分钟)           │ │
│ │ Agents: UIAgent, BackendAgent, DatabaseAgent, ...       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Tabs: [构建历史] [回放] [Agent 贡献] [决策记录] [部署信息]   │
│                                                              │
│ 【构建历史 Tab】                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ • 2025-10-28 16:45 - 构建完成 ✅                         │ │
│ │ • 2025-10-28 16:30 - DeploymentAgent 完成部署            │ │
│ │ • 2025-10-28 16:15 - BackendAgent 完成 API 开发          │ │
│ │ • ...                                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ 【回放 Tab】                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [ReplayPlayer 组件]                                      │ │
│ │ ▶️ 播放  ⏸️ 暂停  ⏩ 快进  ⏪ 后退                        │ │
│ │ ━━━━━━━━━━━━━━━━━ 45:23 / 1:15:30                      │ │
│ │                                                          │ │
│ │ [回放时显示 Agent 状态卡片和决策时间线]                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### 组件集成清单
- **应用卡片网格** (AppGrid.tsx - 新建)
  - 应用状态徽章 (完成/进行中/失败)
  - 进度指示器 (进行中的应用)
  - 快捷操作按钮

- **应用详情页** (AppDetail.tsx - 新建)
  - **ReplayPlayer** 组件
  - 构建历史时间线
  - Agent 贡献统计
  - 决策记录归档查看

---

### 4. **Agents 页面** (Agent 管理 + 关系图)

#### 页面布局
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI Agents 管理                                            │
│                                                              │
│ Tabs: [所有 Agents] [协作关系图] [性能统计]                  │
│                                                              │
│ 【所有 Agents Tab】                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎨 UIAgent                                ✅ 可用        │ │
│ │ 专注于 UI 组件选择和布局优化                              │ │
│ │ • 能力: 组件选择、布局设计、响应式适配                    │ │
│ │ • 历史任务: 156 次  成功率: 94%                           │ │
│ │ [查看详情]                                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚙️ BackendAgent                           ✅ 可用        │ │
│ │ API 创建和业务逻辑实现                                    │ │
│ │ ...                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ 【协作关系图 Tab】                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [AgentDependencyGraph 组件 - 完整视图]                    │ │
│ │                                                          │ │
│ │     ┌─────────┐                                          │ │
│ │     │UIAgent  │                                          │ │
│ │     └────┬────┘                                          │ │
│ │          │                                               │ │
│ │          ↓                                               │ │
│ │     ┌────────────┐      ┌──────────────┐                │ │
│ │     │BackendAgent│ →    │DatabaseAgent │                │ │
│ │     └────────────┘      └──────────────┘                │ │
│ │          │                                               │ │
│ │          ↓                                               │ │
│ │     ┌────────────────┐                                   │ │
│ │     │DeploymentAgent │                                   │ │
│ │     └────────────────┘                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### 组件集成清单
- **Agent 列表** (AgentList.tsx - 新建)
  - Agent 卡片 (名称、描述、能力、统计)
  - Agent 状态指示器
  - 历史性能统计

- **AgentDependencyGraph** 组件 (完整视图)
  - 静态关系图展示
  - Agent 依赖关系说明

---

## 📐 技术实现细节

### 1. 状态管理方案

#### Zustand Store (客户端 UI 状态)
```typescript
// stores/builderStore.ts
interface BuilderState {
  // 构建会话
  currentSessionId: string | null;
  sessionStatus: 'idle' | 'building' | 'completed' | 'failed';

  // Agent 状态
  agents: AgentWorkStatus[];

  // 决策
  decisions: DecisionRecord[];
  unreadDecisions: number;

  // 错误
  errors: AgentErrorRecord[];

  // UI 状态
  viewMode: 'list' | 'graph';
  focusMode: boolean;
  sidebarCollapsed: boolean;

  // Actions
  setSessionId: (id: string) => void;
  updateAgentStatus: (agent: AgentWorkStatus) => void;
  addDecision: (decision: DecisionRecord) => void;
  markDecisionAsRead: (id: string) => void;
  toggleViewMode: () => void;
  toggleFocusMode: () => void;
}
```

#### React Query (服务器状态)
```typescript
// hooks/useBuilderSession.ts
export const useBuilderSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['builder-session', sessionId],
    queryFn: () => fetchSession(sessionId),
    refetchInterval: false, // 通过 WebSocket 更新
  });
};

// hooks/useAgentStatuses.ts
export const useAgentStatuses = (sessionId: string) => {
  return useQuery({
    queryKey: ['agent-statuses', sessionId],
    queryFn: () => fetchAgentStatuses(sessionId),
    // WebSocket 更新后手动更新缓存
  });
};
```

### 2. WebSocket 集成

```typescript
// hooks/useBuilderWebSocket.ts
export const useBuilderWebSocket = (sessionId: string) => {
  const queryClient = useQueryClient();
  const builderStore = useBuilderStore();

  useEffect(() => {
    if (!sessionId) return;

    // 订阅会话
    WebSocketService.emit('subscribe-session', { sessionId });

    // 监听 Agent 状态更新
    const unsubAgent = WebSocketService.on('agent-status-update', (data) => {
      builderStore.updateAgentStatus(data);
      // 更新 React Query 缓存
      queryClient.setQueryData(['agent-statuses', sessionId], (old: any) => {
        return old.map((a: any) => a.agentId === data.agentId ? data : a);
      });
    });

    // 监听决策创建
    const unsubDecision = WebSocketService.on('decision-created', (data) => {
      builderStore.addDecision(data);
      // 显示 Toast 通知 (高重要性)
      if (data.impact === 'high') {
        showDecisionToast(data);
      }
    });

    // 监听错误
    const unsubError = WebSocketService.on('agent-error', (data) => {
      builderStore.addError(data);
    });

    return () => {
      unsubAgent();
      unsubDecision();
      unsubError();
      WebSocketService.emit('unsubscribe-session', { sessionId });
    };
  }, [sessionId]);
};
```

### 3. 路由结构

```typescript
// App.tsx
<Routes>
  {/* Dashboard */}
  <Route path="/dashboard" element={<Dashboard />} />

  {/* Builder */}
  <Route path="/builder" element={<Builder />} />
  <Route path="/builder/:sessionId" element={<Builder />} /> {/* 继续/查看构建 */}

  {/* Apps */}
  <Route path="/apps" element={<Apps />} />
  <Route path="/apps/:appId" element={<AppDetail />} />
  <Route path="/apps/:appId/replay" element={<AppReplay />} />

  {/* Agents */}
  <Route path="/agents" element={<Agents />} />
  <Route path="/agents/:agentId" element={<AgentDetail />} />

  {/* Settings */}
  <Route path="/settings" element={<Settings />} />
</Routes>
```

---

## 🗂️ 文件组织结构

```
frontend/src/
├── pages/
│   ├── Dashboard.tsx                    ✨ 重构
│   ├── Builder.tsx                      ✨ 重构 (核心页面)
│   ├── Apps.tsx                         ✨ 重构
│   ├── AppDetail.tsx                    🆕 新建
│   ├── AppReplay.tsx                    🆕 新建
│   ├── Agents.tsx                       ✨ 重构
│   └── Settings.tsx                     (现有)
│
├── components/
│   ├── Builder/                         🆕 新目录
│   │   ├── BuilderSidebar.tsx          🆕 左侧面板
│   │   ├── BuilderWorkspace.tsx        🆕 中央工作区
│   │   ├── AgentStatusGrid.tsx         🆕 Agent 网格
│   │   ├── DecisionSidebarPanel.tsx    🆕 右侧决策面板
│   │   ├── CollaborationPanel.tsx      🆕 底部协作面板
│   │   └── BuildContext.tsx            🆕 Builder 上下文
│   │
│   ├── Dashboard/                       🆕 新目录
│   │   ├── DashboardStats.tsx          🆕 统计卡片
│   │   ├── ActiveBuilds.tsx            🆕 进行中构建
│   │   ├── RecentDecisions.tsx         🆕 最近决策
│   │   └── AgentActivityStats.tsx      🆕 Agent 活动统计
│   │
│   ├── Apps/                            🆕 新目录
│   │   ├── AppGrid.tsx                 🆕 应用网格
│   │   ├── AppCard.tsx                 🆕 应用卡片
│   │   └── AppDetailTabs.tsx           🆕 详情标签页
│   │
│   ├── Agents/                          🆕 新目录
│   │   ├── AgentList.tsx               🆕 Agent 列表
│   │   ├── AgentCard.tsx               🆕 Agent 卡片
│   │   └── AgentDetailPanel.tsx        🆕 Agent 详情
│   │
│   ├── Visualization/                   (现有 - Phase 1-12)
│   │   ├── AgentStatusCard.tsx         ✅ 已有
│   │   ├── DecisionTimeline.tsx        ✅ 已有
│   │   ├── DecisionToast.tsx           ✅ 已有
│   │   ├── AgentDependencyGraph.tsx    ✅ 已有
│   │   ├── AgentListView.tsx           ✅ 已有
│   │   ├── ReplayPlayer.tsx            ✅ 已有
│   │   ├── ErrorCard.tsx               ✅ 已有
│   │   ├── ProgressSummary.tsx         ✅ 已有
│   │   ├── ThemeToggle.tsx             ✅ 已有
│   │   └── FocusModeToggle.tsx         ✅ 已有
│   │
│   ├── Layout/
│   │   ├── Header.tsx                  ✅ 已更新 (ConnectionIndicator)
│   │   ├── Sidebar.tsx                 (现有)
│   │   └── Layout.tsx                  (现有)
│   │
│   └── ConnectionIndicator.tsx         ✅ 已有 (Phase 13)
│
├── hooks/
│   ├── useBuilderSession.ts            🆕 构建会话
│   ├── useBuilderWebSocket.ts          🆕 WebSocket 集成
│   ├── useAgentStatuses.ts             🆕 Agent 状态
│   ├── useDecisions.ts                 🆕 决策管理
│   └── useReplay.ts                    ✅ 已有
│
├── stores/
│   ├── builderStore.ts                 🆕 Builder 状态
│   ├── themeStore.ts                   ✅ 已有
│   └── agentStore.ts                   🆕 Agent 状态
│
└── services/
    ├── WebSocketService.ts             ✅ 已有 (Phase 13)
    ├── BuilderAPI.ts                   🆕 Builder API
    └── VisualizationAPI.ts             ✅ 已有
```

---

## 📅 实施计划 (4个阶段)

### **阶段 1: Builder 页面核心功能** (优先级最高)
**时间**: 2-3 天

**任务**:
1. 重构 Builder.tsx 为三栏布局
2. 创建 BuilderSidebar (需求输入表单)
3. 创建 BuilderWorkspace (Agent 状态网格)
4. 创建 DecisionSidebarPanel (决策时间线)
5. 集成 WebSocket 实时更新
6. 实现"开始构建"流程

**交付物**:
- ✅ 用户可以输入需求并启动构建
- ✅ 实时看到 Agent 工作状态
- ✅ 看到决策卡片弹出和侧边栏
- ✅ 看到整体进度条

**验收标准**:
- User Story 1 (Agent 工作状态) 完整实现
- User Story 2 (决策推理) 基本实现
- WebSocket 连接稳定，无延迟

---

### **阶段 2: Dashboard 概览 + Builder 完善** (优先级高)
**时间**: 1-2 天

**任务**:
1. 重构 Dashboard 页面
2. 创建进行中构建列表
3. 创建最近决策面板
4. 添加 Builder 底部协作面板 (AgentDependencyGraph)
5. 实现错误卡片和恢复流程
6. 添加 ThemeToggle 和 FocusModeToggle

**交付物**:
- ✅ Dashboard 显示所有进行中的构建
- ✅ Builder 显示 Agent 协作关系图
- ✅ 错误处理流程完整

**验收标准**:
- User Story 3 (拟人化交互) 完整实现
- User Story 5 (Agent 协作) 完整实现
- 错误恢复流程符合 FR-015

---

### **阶段 3: Apps 页面 + 历史回放** (优先级中)
**时间**: 1-2 天

**任务**:
1. 重构 Apps 页面为应用网格
2. 创建 AppDetail 页面
3. 集成 ReplayPlayer 组件
4. 实现构建历史查看
5. 实现热数据和冷数据加载

**交付物**:
- ✅ 应用列表页完整
- ✅ 应用详情页 + 回放功能
- ✅ 历史记录加载(热/冷数据)

**验收标准**:
- 用户可以查看所有应用
- 用户可以回放任何历史构建
- 冷数据加载提示清晰

---

### **阶段 4: Agents 页面 + 优化抛光** (优先级低)
**时间**: 1 天

**任务**:
1. 重构 Agents 页面
2. 添加 Agent 性能统计
3. 添加协作关系图静态视图
4. 响应式布局优化
5. 性能优化和测试
6. 用户行为数据收集(匿名化)

**交付物**:
- ✅ Agents 管理页面完整
- ✅ 所有页面响应式适配
- ✅ 数据收集和隐私保护

**验收标准**:
- 所有页面在移动端正常显示
- 性能符合要求 (30fps+)
- 隐私保护符合 FR-025

---

## ✅ 下一步行动

1. **删除演示页面** (VisualizationDemo.tsx)
2. **开始阶段 1 实施**:
   - 重构 Builder.tsx
   - 创建 BuilderSidebar.tsx
   - 创建 BuilderWorkspace.tsx
   - 集成 WebSocket

---

## 🎯 成功指标

**用户体验**:
- ✅ 用户可以在 Builder 中实时看到 AI 工作过程
- ✅ 决策卡片弹出不打断工作流
- ✅ 构建过程可回放

**技术指标**:
- ✅ WebSocket 连接稳定率 > 99%
- ✅ Agent 状态更新延迟 < 500ms
- ✅ 页面帧率 > 30fps
- ✅ 首屏加载时间 < 2s

**业务指标**:
- ✅ 用户完成率 > 85%
- ✅ 决策查看率 > 60%
- ✅ 回放使用率 > 30%
