# Implementation Plan: AI思考过程可视化系统

**Branch**: `002-ai-thinking-visualization` | **Date**: 2025-10-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ai-thinking-visualization/spec.md`

## Summary

本功能为AI-Native Agent App Builder Engine添加实时可视化能力,让用户可以看到AI Agent的工作状态、决策推理和协作过程,提供透明、可感知的产品体验。

**核心功能**:
- 实时Agent状态和进度可视化(混合更新频率200ms-2s)
- AI决策透明化展示(混合toast通知+侧边栏时间线)
- Agent拟人化交互体验(专业友好型性格设定)
- 双视图协作关系展示(列表视图⇌图形流程图)
- 智能错误恢复(自动重试+用户确认)
- 历史回放功能(热数据+S3冷存储)
- 双主题系统(温暖友好风⇌科技未来感)
- 隐私优先的匿名化数据收集

**技术方法**:
- 前端: React 18 + Zustand + React Query + React Flow + react-hot-toast + Tailwind CSS
- 后端: Socket.IO混合推送策略 + PostgreSQL热数据 + S3冷存储
- 实时通信: WebSocket房间隔离 + 指数退避重连 + 心跳检测
- 性能优化: 虚拟滚动 + React.memo + 防抖节流 + Web Worker
- 数据收集: PostHog客户端匿名化 + GDPR合规

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 18+ 后端, React 18 前端)
**Primary Dependencies**:
- 前端: React 18, Zustand, React Query, React Flow, react-hot-toast, Tailwind CSS
- 后端: Express, Socket.IO, PostgreSQL, Redis, AWS SDK (S3)
**Storage**: PostgreSQL 14+ (热数据30天) + S3/MinIO (冷数据归档)
**Testing**: Jest (后端单元测试), React Testing Library (前端组件测试), Cypress (E2E测试)
**Target Platform**: Web (Chrome/Firefox/Safari/Edge最新版), 响应式支持桌面/平板/手机
**Project Type**: Web应用 (frontend/ + backend/)
**Performance Goals**:
- Agent状态更新延迟: <1秒 (高优先级200-500ms, 低优先级1-2s)
- UI帧率: ≥30fps (处理10个并行Agent时)
- 历史数据查询: 热数据<500ms, 冷数据<3s
- Toast通知响应: <100ms
- 决策详情加载: <500ms
**Constraints**:
- 单次构建会话事件日志: <5MB
- WebSocket连接数: 支持1000+并发连接
- 数据归档窗口: 30天 (超过自动归档到S3)
- 前端可视化渲染: 不显著增加CPU/内存占用
- 隐私合规: GDPR/CCPA (匿名化, opt-out, 数据保留≤12个月)
**Scale/Scope**:
- 预估用户数: 10k MAU
- 平均构建会话: 3-6个Agent, 1-3个关键决策/Agent, 2-10分钟时长
- 热数据存储: 估计1000-5000次构建/30天
- 冷数据增长: 约1-5GB/月

## Constitution Check

*项目宪章尚未定义,暂无需检查违规项。本功能遵循现有代码库的架构模式 (backend/ + frontend/ 分离, Socket.IO实时通信, TypeScript类型安全, PostgreSQL+Redis存储)。*

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-thinking-visualization/
├── spec.md                  # 功能规格说明 (/speckit.specify命令输出)
├── plan.md                  # 本文件 (/speckit.plan命令输出)
├── research.md              # Phase 0输出 - 技术决策研究 (8个决策)
├── data-model.md            # Phase 1输出 - 数据模型设计 (8个实体)
├── quickstart.md            # Phase 1输出 - 快速开始指南
├── contracts/               # Phase 1输出 - API契约
│   ├── rest-api.yaml        # OpenAPI 3.0规范 (8个REST端点)
│   └── websocket-events.md  # Socket.IO事件规范 (5种推送事件)
├── checklists/              # 质量检查清单
│   └── requirements.md      # 规格质量检查清单 (已通过)
└── tasks.md                 # Phase 2输出 (/speckit.tasks命令 - 待生成)
```

### Source Code (repository root)

```text
# Web应用结构 (backend/ + frontend/)

backend/
├── src/
│   ├── models/                          # 数据模型 (Sequelize ORM)
│   │   ├── BuildSession.ts              # 构建会话模型
│   │   ├── AgentWorkStatus.ts           # Agent状态模型
│   │   ├── DecisionRecord.ts            # 决策记录模型
│   │   ├── AgentErrorRecord.ts          # 错误记录模型
│   │   ├── CollaborationEvent.ts        # 协作事件模型
│   │   ├── PreviewData.ts               # 预览数据模型
│   │   ├── AgentPersona.ts              # Agent拟人化配置
│   │   └── UserInteractionMetric.ts     # 用户交互指标
│   ├── services/
│   │   ├── VisualizationService.ts      # 可视化核心服务
│   │   ├── WebSocketService.ts          # WebSocket管理 (混合推送策略)
│   │   ├── DataArchiveService.ts        # 数据归档服务 (S3)
│   │   ├── AgentStatusTracker.ts        # Agent状态跟踪
│   │   ├── DecisionManager.ts           # 决策记录管理
│   │   ├── MetricsCollector.ts          # 匿名化指标收集
│   │   └── ReplayService.ts             # 历史回放服务
│   ├── routes/
│   │   └── visualizationRoutes.ts       # /api/visualization/* REST端点
│   ├── websocket/
│   │   ├── handlers/
│   │   │   ├── sessionSubscription.ts   # 会话订阅处理
│   │   │   ├── agentStatusEmitter.ts    # Agent状态推送
│   │   │   ├── decisionEmitter.ts       # 决策推送
│   │   │   └── errorEmitter.ts          # 错误推送
│   │   └── middleware/
│   │       ├── authentication.ts        # JWT验证
│   │       └── rateLimit.ts             # 速率限制
│   ├── jobs/
│   │   └── archiveOldSessions.ts        # 定时归档任务 (每日)
│   └── migrations/
│       ├── 001_create_build_sessions.sql
│       ├── 002_create_agent_work_status.sql
│       ├── 003_create_decision_records.sql
│       ├── 004_create_agent_error_records.sql
│       ├── 005_create_collaboration_events.sql
│       ├── 006_create_preview_data.sql
│       ├── 007_create_agent_personas.sql
│       ├── 008_create_user_interaction_metrics.sql
│       ├── 009_create_indexes.sql
│       └── 010_seed_agent_personas.sql
└── tests/
    ├── unit/
    │   ├── services/
    │   ├── models/
    │   └── utils/
    ├── integration/
    │   ├── websocket.test.ts            # WebSocket事件测试
    │   ├── visualization-api.test.ts    # REST API测试
    │   └── data-archive.test.ts         # 归档流程测试
    └── contract/
        └── api-contracts.test.ts        # OpenAPI契约验证

frontend/
├── src/
│   ├── components/
│   │   ├── Visualization/                    # 可视化核心组件
│   │   │   ├── VisualizationPanel.tsx       # 主面板容器
│   │   │   ├── AgentStatusCard.tsx          # Agent状态卡片
│   │   │   ├── ProgressSummary.tsx          # 整体进度汇总
│   │   │   ├── DecisionToast.tsx            # Toast通知组件
│   │   │   ├── DecisionSidebar.tsx          # 决策侧边栏
│   │   │   ├── DecisionCard.tsx             # 决策卡片详情
│   │   │   ├── DecisionTimeline.tsx         # 决策时间线
│   │   │   ├── AgentListView.tsx            # 列表视图 (默认)
│   │   │   ├── AgentGraphView.tsx           # 图形视图 (React Flow)
│   │   │   ├── ViewToggle.tsx               # 视图切换按钮
│   │   │   ├── ErrorCard.tsx                # 错误详情卡片
│   │   │   ├── ReplayPlayer.tsx             # 回放播放器
│   │   │   ├── ThemeToggle.tsx              # 主题切换
│   │   │   ├── FocusModeToggle.tsx          # 专注模式
│   │   │   └── PreviewModal.tsx             # 预览模态窗口
│   │   └── UI/
│   │       ├── AnimatedCard.tsx             # 动画卡片容器
│   │       ├── ProgressBar.tsx              # 进度条
│   │       ├── StatusBadge.tsx              # 状态徽章
│   │       └── LoadingSpinner.tsx           # 加载动画
│   ├── services/
│   │   ├── WebSocketService.ts              # WebSocket客户端
│   │   ├── VisualizationAPI.ts              # REST API调用
│   │   └── MetricsService.ts                # 匿名化指标上报
│   ├── stores/                               # Zustand状态管理
│   │   ├── visualizationStore.ts            # 可视化状态
│   │   ├── agentStatusStore.ts              # Agent状态
│   │   ├── decisionStore.ts                 # 决策记录
│   │   ├── themeStore.ts                    # 主题偏好
│   │   └── settingsStore.ts                 # 用户设置
│   ├── hooks/
│   │   ├── useWebSocket.ts                  # WebSocket连接Hook
│   │   ├── useVisualization.ts              # 可视化数据Hook
│   │   ├── useAgentStatus.ts                # Agent状态Hook (React Query)
│   │   ├── useDecisions.ts                  # 决策数据Hook (React Query)
│   │   ├── useReplay.ts                     # 回放Hook
│   │   └── useTheme.ts                      # 主题Hook
│   ├── types/
│   │   ├── visualization.types.ts           # 可视化类型定义
│   │   ├── agent.types.ts                   # Agent类型
│   │   ├── decision.types.ts                # 决策类型
│   │   └── websocket.types.ts               # WebSocket事件类型
│   └── styles/
│       ├── themes/
│       │   ├── warm-friendly.css            # 温暖友好风主题
│       │   └── tech-futuristic.css          # 科技未来感主题
│       └── animations.css                   # 动画效果
└── tests/
    ├── components/
    │   └── Visualization/
    │       ├── AgentStatusCard.test.tsx
    │       ├── DecisionSidebar.test.tsx
    │       └── AgentGraphView.test.tsx
    ├── hooks/
    │   └── useWebSocket.test.ts
    └── e2e/
        ├── visualization-flow.cy.ts         # 完整可视化流程E2E测试
        └── theme-switching.cy.ts            # 主题切换E2E测试
```

**Structure Decision**: 采用Web应用结构 (frontend/ + backend/ 分离)。
- 前端使用组件化架构,核心可视化组件集中在`components/Visualization/`
- 后端遵循现有模式,新增`visualization`模块管理可视化数据和WebSocket通信
- 使用Zustand + React Query管理前端状态,清晰分离UI状态和服务器状态
- 数据模型使用Sequelize ORM,与现有DatabaseService集成
- WebSocket使用现有Socket.IO基础设施,扩展事件处理器
- 测试覆盖单元/集成/契约/E2E四个层次

## Complexity Tracking

> **无Constitution违规项需要证明。** 本功能完全遵循现有架构模式,无额外复杂度引入。

## Phase 0: Research & Decisions

**Status**: ✅ 已完成

详见 [research.md](./research.md) - 包含8个关键技术决策:
1. 前端状态管理方案 → Zustand + React Query
2. 图形可视化库选择 → React Flow
3. Toast通知库选择 → react-hot-toast
4. 主题系统实现 → Tailwind CSS + CSS Variables
5. WebSocket状态同步策略 → Socket.IO + 指数退避重连
6. 数据归档策略 → Node.js定时任务 + AWS SDK
7. 前端性能优化 → 虚拟滚动 + React.memo + Web Worker
8. 匿名化数据收集实现 → PostHog + 客户端匿名化

所有NEEDS CLARIFICATION已解决,技术栈确定。

## Phase 1: Design & Contracts

**Status**: ✅ 已完成

### 数据模型设计
详见 [data-model.md](./data-model.md) - 包含8个核心实体:
- BuildSession (聚合根) - 管理完整构建过程生命周期
- AgentWorkStatus - 实时Agent状态 (6种状态转换)
- DecisionRecord - AI决策透明化 (重要性分级)
- AgentErrorRecord - 错误追踪 (轻微/关键分类)
- CollaborationEvent - Agent协作数据流
- PreviewData - 决策预览内容
- AgentPersona - Agent拟人化配置
- UserInteractionMetricEvent - 匿名化用户指标

**关键设计**:
- 热数据(30天) + 冷存储(S3归档)生命周期管理
- 26个精心设计的索引优化查询性能
- Redis缓存Agent配置和会话状态
- 完整的数据库迁移脚本(10个SQL文件)

### API契约
详见 [contracts/](./contracts/):
- **REST API** (`rest-api.yaml`) - OpenAPI 3.0规范,8个端点
  - 会话管理: 列表/详情/回放
  - 决策查询: 按重要性过滤
  - 配置管理: Agent配置/主题/隐私设置
  - 指标上报: 匿名化数据收集
- **WebSocket事件** (`websocket-events.md`) - Socket.IO规范,5种推送事件
  - agent-status-update (混合频率200ms-2s)
  - decision-created (立即<100ms)
  - collaboration-event
  - error-occurred (含重试状态)
  - session-completed

所有契约包含完整TypeScript类型定义、请求/响应示例、错误格式、认证要求和速率限制。

### 快速开始
详见 [quickstart.md](./quickstart.md) - 包含:
- 前置条件和多平台安装指引
- 52个环境变量配置清单
- 数据库初始化步骤
- 启动开发服务器
- WebSocket连接测试
- 功能验证清单(50+检查项)
- 10个常见问题排查

## Phase 2: Implementation Tasks

**Status**: ⏳ 待生成

运行 `/speckit.tasks` 命令生成详细的实现任务清单 (tasks.md)。

预估任务分解:
- 后端数据模型和迁移 (8个模型 + 10个迁移脚本)
- 后端服务层 (7个核心服务)
- WebSocket事件处理器 (4个处理器 + 2个中间件)
- REST API端点 (8个端点)
- 定时归档任务
- 前端可视化组件 (13个核心组件)
- 前端状态管理 (5个Store + 6个Hook)
- 主题系统 (2个主题 + CSS Variables)
- 测试覆盖 (单元/集成/契约/E2E)

## Risk Assessment

| 风险项 | 概率 | 影响 | 缓解措施 |
|--------|------|------|---------|
| WebSocket高并发性能 | 中 | 高 | Socket.IO内置房间隔离,Redis Adapter水平扩展,性能测试验证1000+连接 |
| 大量实时更新导致前端卡顿 | 中 | 高 | 虚拟滚动+React.memo+防抖节流,Web Worker后台计算,性能监控确保30fps+ |
| S3归档数据加载慢 | 低 | 中 | 热数据优先策略,冷数据异步加载+进度提示,预加载常用历史记录 |
| 图形视图复杂度高 | 中 | 中 | React Flow成熟库,限制节点数量(<50个Agent),提供列表视图替代 |
| 隐私合规风险 | 低 | 高 | 客户端匿名化,明确opt-out,GDPR合规审查,透明的隐私政策 |
| 双主题系统维护成本 | 低 | 低 | CSS Variables统一管理,Tailwind插件自动生成,设计系统规范化 |

## Next Steps

1. ✅ **规格澄清完成** - 8个关键决策点已确认
2. ✅ **技术研究完成** - 8个技术决策已做出并文档化
3. ✅ **数据模型设计完成** - 8个实体定义,26个索引,10个迁移脚本
4. ✅ **API契约定义完成** - REST API + WebSocket事件完整规范
5. ✅ **快速开始指南完成** - 开发环境搭建文档
6. ⏳ **待生成任务清单** - 运行 `/speckit.tasks` 生成详细实现任务
7. ⏳ **待实施开发** - 按任务清单进行开发,先P1后P2/P3
8. ⏳ **待测试验证** - 单元/集成/E2E测试,性能测试,隐私合规审查

---

**Generated by**: `/speckit.plan` command
**Date**: 2025-10-27
**Version**: 1.0
