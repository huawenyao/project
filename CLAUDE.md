# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言设置

**所有与用户的交互必须使用中文（简体中文）。** 详见 `claude.md` 文件。

## ⚠️ 关键注意事项（必读）

### ORM 迁移状态

**项目正在从 Sequelize 迁移到 Prisma，两套系统目前共存：**

- **Prisma**（新系统）：
  - Schema 文件：`backend/prisma/schema.prisma`
  - 用于所有新功能开发
  - 字段命名：使用 `type`（不是 `taskType` 或 `agentType`）
  - 修改 schema 后**必须**运行 `npx prisma generate`

- **Sequelize**（遗留系统）：
  - 模型文件：`backend/src/models/*.model.ts`
  - 仍在可视化相关功能中使用
  - 不要删除这些文件，部分 Service 仍依赖

### 字段命名规范

**统一使用以下字段名（避免混淆）：**

| 模型 | 正确字段名 | ❌ 错误示例 |
|------|-----------|------------|
| Task | `type` | ~~taskType~~ |
| Agent | `type` | ~~agentType~~ |
| Project | `status` | ~~projectStatus~~ |

### 启动前必做步骤

每次修改数据库 Schema 或遇到类型错误时：

```bash
# 1. 更新 Prisma 客户端
cd backend
npx prisma generate

# 2. 类型检查（修复所有错误后再启动）
npx tsc --noEmit

# 3. 启动服务
npm run dev
```

### 依赖版本约定

**前端 React Query：**
- ✅ 正确：`@tanstack/react-query`
- ❌ 错误：`react-query`（旧版本，不要使用）

**后端 VisualizationEmitter：**
- ✅ 正确：`import visualizationEmitter from '../websocket/visualizationEmitter'`（default import）
- ❌ 错误：`VisualizationEmitter.getInstance()`（该方法不存在）

## 项目概述

AI-Native Agent App Builder Engine - 一个革命性的平台，将传统的无代码应用构建转变为智能的、代理驱动的体验。用户使用自然语言描述需求，AI 代理自动构建、配置和部署应用程序。

### 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **AI/ML**: OpenAI GPT-4, Anthropic Claude (通过 @anthropic-ai/sdk)
- **数据库**: PostgreSQL + Redis
- **实时通信**: Socket.IO (WebSocket)
- **部署**: Docker + Kubernetes ready

## 核心架构

### 多层架构设计

```
用户界面层 (frontend/)
    ↓
WebSocket/REST API
    ↓
AI 代理编排器 (AgentOrchestrator)
    ↓
专业化代理层 (agents/)
├── UIAgent - UI 组件选择和布局优化
├── BackendAgent - API 创建和业务逻辑
├── DatabaseAgent - 数据库架构设计
├── IntegrationAgent - 第三方集成
└── DeploymentAgent - 环境设置和部署
    ↓
执行引擎 (services/)
```

### 代理系统架构

所有代理继承自 `BaseAgent` 抽象类 (backend/src/agents/BaseAgent.ts)：

- **能力注册**: 每个代理通过 `initializeCapabilities()` 定义其能力
- **执行模式**: 通过 `execute(action, parameters, context)` 执行任务
- **AI 集成**: 使用 `generateWithAI()` 调用 LLM
- **并发控制**: 支持最多 3 个并发任务
- **重试机制**: 内置指数退避重试逻辑

### 关键服务

1. **AgentOrchestrator** (backend/src/services/AgentOrchestrator.ts)
   - 协调多个专业化代理
   - 任务分解和分配
   - 代理间通信管理

2. **AIService** (backend/src/services/AIService.ts)
   - 统一的 AI 提供者接口
   - 支持 OpenAI 和 Anthropic
   - 通过环境变量 `AI_MODEL_PROVIDER` 配置

3. **DatabaseService** (backend/src/services/DatabaseService.ts)
   - PostgreSQL 连接管理
   - 数据库连接池

### 实时通信架构

使用 Socket.IO 实现客户端-服务器实时通信：

- **连接**: `io.on('connection')`
- **项目房间**: `socket.join('project-{projectId}')`
- **代理请求**: `socket.on('agent-request')` → 触发 AgentOrchestrator
- **响应流**: `socket.emit('agent-response')` / `agent-error`

## 开发命令

### 环境设置

```bash
# 安装所有依赖（根目录、前端、后端）
npm run install:all

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加必需的 API 密钥：
# - OPENAI_API_KEY 或 ANTHROPIC_API_KEY
# - DATABASE_URL (PostgreSQL)
# - REDIS_URL
# - JWT_SECRET
```

### 开发服务器

```bash
# 同时启动前端和后端开发服务器
npm run dev

# 仅启动前端 (Vite dev server，端口 12000)
npm run dev:frontend

# 仅启动后端 (nodemon + ts-node，端口 3001)
npm run dev:backend

# 运行后端演示服务器
cd backend && npm run demo
```

### 构建和测试

```bash
# 构建整个项目
npm run build

# 构建前端 (tsc + vite build)
npm run build:frontend

# 构建后端 (tsc)
npm run build:backend

# 运行所有测试
npm test

# 仅前端测试
npm run test:frontend

# 仅后端测试 (Jest)
npm run test:backend

# 后端测试监听模式
cd backend && npm run test:watch
```

### 代码质量

```bash
# 前端 linting
cd frontend && npm run lint
cd frontend && npm run lint:fix

# 前端类型检查
cd frontend && npm run type-check

# 后端 linting
cd backend && npm run lint
cd backend && npm run lint:fix
```

### Docker 部署

```bash
# 构建 Docker 镜像
npm run docker:build

# 运行 Docker 容器
npm run docker:run
```

## 项目结构关键点

### 前端结构 (frontend/src/)

```
├── components/
│   ├── Layout/      # 布局组件（Header, Sidebar, Footer）
│   └── UI/          # 可重用 UI 组件
├── pages/
│   ├── Dashboard.tsx    # 主仪表板
│   ├── Builder.tsx      # 可视化构建器
│   ├── Agents.tsx       # 代理管理和监控
│   ├── Apps.tsx         # 应用列表
│   ├── Templates.tsx    # 模板市场
│   ├── Settings.tsx     # 设置页面
│   └── Auth/            # 认证页面
├── services/        # API 客户端服务
├── contexts/        # React Context 提供者
└── types/           # TypeScript 类型定义
```

### 后端结构 (backend/src/)

```
├── agents/
│   ├── BaseAgent.ts          # 抽象基类
│   ├── UIAgent.ts            # UI 代理
│   ├── BackendAgent.ts       # 后端代理
│   ├── DatabaseAgent.ts      # 数据库代理
│   ├── IntegrationAgent.ts   # 集成代理
│   └── DeploymentAgent.ts    # 部署代理
├── services/
│   ├── AgentOrchestrator.ts  # 代理编排器
│   ├── AIService.ts          # AI 服务接口
│   └── DatabaseService.ts    # 数据库服务
├── routes/
│   ├── agentRoutes.ts        # /api/agents
│   ├── appRoutes.ts          # /api/apps
│   ├── authRoutes.ts         # /api/auth
│   └── builderRoutes.ts      # /api/builder
├── middleware/
│   ├── errorHandler.ts       # 全局错误处理
│   └── rateLimiter.ts        # 速率限制
├── utils/
│   └── logger.ts             # Winston 日志
└── types/                    # TypeScript 类型定义
```

## 开发工作流程

### 添加新代理

1. 在 `backend/src/agents/` 创建新文件，继承 `BaseAgent`
2. 实现 `initializeCapabilities()` 定义代理能力
3. 实现 `execute()` 方法处理动作
4. 在 `AgentOrchestrator` 中注册新代理
5. 更新前端 UI 以显示新代理状态

### 添加新 API 路由

1. 在 `backend/src/routes/` 创建路由文件
2. 在 `backend/src/index.ts` 中导入并注册路由
3. 创建对应的前端服务 (frontend/src/services/)
4. 使用 React Query 处理数据获取和缓存

### 测试代理功能

1. 使用 `npm run demo` 启动演示服务器
2. 或通过 WebSocket 连接发送 `agent-request` 事件
3. 监听 `agent-response` 或 `agent-error` 事件
4. 查看后端日志获取详细执行信息

## 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: 用于主数据存储
- **Redis**: 用于缓存和会话管理

## 访问端点

开发环境下：

- **前端界面**: http://localhost:12000
- **后端 API**: http://localhost:3001
- **健康检查**: http://localhost:3001/health
- **WebSocket**: ws://localhost:3001

## 关键注意事项

### AI 服务配置

项目支持两个 AI 提供者，通过环境变量切换：

```bash
# 使用 OpenAI
AI_MODEL_PROVIDER=openai
AI_MODEL_NAME=gpt-4

# 使用 Anthropic Claude
AI_MODEL_PROVIDER=anthropic
AI_MODEL_NAME=claude-3-opus-20240229
```

### WebSocket 通信模式

代理系统依赖 WebSocket 实现实时通信：
- 前端通过 Socket.IO 客户端连接
- 加入项目特定房间进行隔离
- 异步处理代理请求，避免阻塞

### 并发和性能

- 每个代理支持最多 3 个并发任务
- AgentOrchestrator 管理代理负载均衡
- 使用 Redis 进行会话状态管理
- Express 使用 compression 中间件压缩响应

### 错误处理

- 代理层：内置重试机制（指数退避）
- API 层：全局错误处理中间件
- 前端：使用 react-hot-toast 显示用户友好错误
- 日志：Winston 记录所有错误和警告

## 常见开发场景

### 修改代理提示词

编辑特定代理类中的 `getDefaultSystemPrompt()` 方法或在 `generateWithAI()` 调用时传入自定义 systemPrompt。

### 调试 WebSocket 连接

1. 检查后端日志中的连接消息
2. 使用浏览器开发工具的 Network > WS 标签
3. 确认前端 FRONTEND_URL 环境变量匹配

### 数据库迁移

当前项目处于早期阶段，暂无正式迁移系统。数据库架构通过 DatabaseService 管理。

## Spec-Kit 集成

项目使用 spec-kit 进行项目管理：
- 配置目录: `.specify/`
- 模板目录: `.specify/templates/`
- 项目宪章: `.specify/memory/constitution.md`
