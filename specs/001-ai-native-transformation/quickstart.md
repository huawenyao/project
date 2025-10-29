# Quick Start Guide: AI原生平台核心转型

**Feature**: 001-ai-native-transformation
**Date**: 2025-10-28
**Target Audience**: 开发者

## Prerequisites

确保您的开发环境满足以下要求：

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: 15+
- **Redis**: 7+
- **Docker**: 24+ (可选，用于本地开发环境)

---

## 1. Environment Setup (5分钟)

### 1.1 Clone Repository & Install Dependencies

```bash
# Clone项目（如果尚未clone）
cd /home/op/ai-builder-studio

# 安装所有依赖（根目录、前端、后端）
npm run install:all

# 或分别安装
cd backend && npm install
cd ../frontend && npm install
```

### 1.2 Configure Environment Variables

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，填写必需的配置
nano .env
```

**关键环境变量**:

```bash
# AI服务配置
AI_MODEL_PROVIDER=anthropic  # 或 openai
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/ai_builder_db
REDIS_URL=redis://localhost:6379

# 认证配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# WebSocket配置
FRONTEND_URL=http://localhost:12000

# 端口配置
BACKEND_PORT=3001
FRONTEND_PORT=12000
```

### 1.3 Initialize Database

```bash
# 创建数据库
createdb ai_builder_db

# 运行迁移（使用Prisma或Sequelize）
cd backend
npx prisma migrate dev --name init

# 或手动执行SQL
psql -d ai_builder_db -f ../specs/001-ai-native-transformation/migrations/init.sql
```

### 1.4 Start Services

```bash
# 方式1: 使用Docker Compose（推荐）
docker-compose up -d postgres redis

# 方式2: 手动启动PostgreSQL和Redis
# （根据您的操作系统使用对应命令）
```

---

## 2. Run Development Servers (2分钟)

### 2.1 Start Backend

```bash
cd backend
npm run dev

# 输出示例：
# ✓ Server running on http://localhost:3001
# ✓ WebSocket server listening
# ✓ Connected to PostgreSQL
# ✓ Connected to Redis
```

### 2.2 Start Frontend

```bash
# 新终端窗口
cd frontend
npm run dev

# 输出示例：
# ➜  Local:   http://localhost:12000/
# ➜  Network: use --host to expose
```

### 2.3 Verify Services

打开浏览器访问：

- **前端界面**: http://localhost:12000
- **后端API**: http://localhost:3001/health
- **API文档**: http://localhost:3001/api-docs (Swagger UI)

---

## 3. Test Core Workflows (10分钟)

### 3.1 Register & Login

```bash
# 使用cURL测试注册API
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!"
  }'

# 登录获取JWT Token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# 保存返回的token
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3.2 Create Project via Natural Language

```bash
# 创建项目
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Todo App",
    "requirementText": "我需要一个待办事项应用，用户可以创建、编辑、删除和标记完成任务。每个任务有标题、描述、截止日期和优先级。"
  }'

# 获取projectId
export PROJECT_ID="uuid-here"
```

### 3.3 Connect WebSocket & Monitor Agents

使用前端界面或WebSocket客户端：

```javascript
// 前端代码示例 (frontend/src/pages/Builder.tsx)
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/builder', {
  auth: { token: localStorage.getItem('jwt') },
});

socket.emit('join-project', { projectId });

socket.on('agent:status:update', (event) => {
  console.log('Agent Update:', event.payload);
  // 更新UI显示Agent状态
});

socket.on('build:progress', (event) => {
  console.log('Build Progress:', event.payload.overallProgress + '%');
});

socket.on('build:completed', (event) => {
  console.log('Build Complete! Preview URL:', event.payload.previewUrl);
});
```

### 3.4 Trigger Agent Build

```bash
# 启动构建流程
curl -X POST http://localhost:3001/api/projects/$PROJECT_ID/build \
  -H "Authorization: Bearer $JWT_TOKEN"

# 观察WebSocket事件流：
# 1. build:started
# 2. agent:status:update (多个Agent状态更新)
# 3. build:progress (进度更新)
# 4. build:completed (完成)
```

---

## 4. Development Workflow

### 4.1 Project Structure

```
ai-builder-studio/
├── backend/
│   ├── src/
│   │   ├── agents/          # 🔥 核心扩展区域
│   │   │   ├── BaseAgent.ts
│   │   │   ├── UIAgent.ts
│   │   │   └── ...
│   │   ├── services/        # 🔥 新增服务
│   │   │   ├── AgentOrchestrator.ts
│   │   │   ├── NLPService.ts
│   │   │   └── ...
│   │   ├── websocket/       # 🆕 WebSocket处理
│   │   ├── models/          # 🆕 数据模型
│   │   └── index.ts
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Builder/     # 🆕 构建器组件
│   │   ├── pages/
│   │   │   └── Builder.tsx  # 🔥 核心页面
│   │   └── hooks/           # 🆕 自定义Hooks
│   └── tests/
└── specs/001-ai-native-transformation/
    ├── plan.md
    ├── research.md          # 技术决策
    ├── data-model.md        # 数据库设计
    ├── contracts/           # API契约
    └── quickstart.md        # 本文档
```

### 4.2 Adding a New Agent

```typescript
// 1. 创建Agent类 (backend/src/agents/NewAgent.ts)
import { BaseAgent } from './BaseAgent';

export class NewAgent extends BaseAgent {
  protected initializeCapabilities(): void {
    this.capabilities = {
      actions: ['new-action-1', 'new-action-2'],
      supportedFormats: ['json'],
    };
  }

  async execute(action: string, parameters: any, context: any) {
    switch (action) {
      case 'new-action-1':
        return this.handleAction1(parameters, context);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async handleAction1(params: any, context: any) {
    // 使用AI生成响应
    const aiResponse = await this.generateWithAI(
      `Generate ${params.target} based on ${context.requirement}`,
      { temperature: 0.7 }
    );

    return { result: aiResponse };
  }
}

// 2. 在AgentOrchestrator中注册
// (backend/src/services/AgentOrchestrator.ts)
import { NewAgent } from '../agents/NewAgent';

this.agents.set('new', new NewAgent(this.aiService));
```

### 4.3 Adding a New Frontend Component

```tsx
// frontend/src/components/Builder/NewComponent.tsx
import React from 'react';
import { Card } from 'antd';
import { useAgent } from '../../hooks/useAgent';

export const NewComponent: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { agents, loading } = useAgent(projectId);

  return (
    <Card title="New Feature">
      {/* Your component logic */}
    </Card>
  );
};
```

### 4.4 Testing

```bash
# 后端单元测试
cd backend
npm run test

# 特定Agent测试
npm run test -- agents/UIAgent.test.ts

# 前端测试
cd frontend
npm run test

# E2E测试（可选，使用Playwright）
npm run test:e2e
```

---

## 5. Common Issues & Solutions

### Issue 1: AI API调用失败

**错误**: `Error: AI API timeout`

**解决方案**:
1. 检查API密钥是否正确设置：`echo $ANTHROPIC_API_KEY`
2. 验证网络连接：`curl https://api.anthropic.com`
3. 检查配额：访问AI提供者控制台查看剩余配额

### Issue 2: WebSocket连接断开

**错误**: `WebSocket connection failed`

**解决方案**:
1. 确认后端WebSocket服务器运行：`curl http://localhost:3001/health`
2. 检查CORS配置：确保`FRONTEND_URL`环境变量正确
3. 查看浏览器控制台网络标签，检查WebSocket握手

### Issue 3: 数据库连接失败

**错误**: `Error: connect ECONNREFUSED ::1:5432`

**解决方案**:
1. 确认PostgreSQL运行：`pg_isready`
2. 检查`DATABASE_URL`环境变量格式
3. 验证数据库用户权限：`psql -U user -d ai_builder_db`

### Issue 4: Redis连接失败

**错误**: `Error: Redis connection refused`

**解决方案**:
1. 启动Redis：`redis-server` 或 `docker start redis`
2. 测试连接：`redis-cli ping` (应返回PONG)
3. 检查`REDIS_URL`环境变量

---

## 6. Next Steps

完成Quick Start后，您可以：

### 6.1 阅读详细文档

- **架构设计**: `specs/001-ai-native-transformation/plan.md`
- **技术研究**: `specs/001-ai-native-transformation/research.md`
- **数据模型**: `specs/001-ai-native-transformation/data-model.md`
- **API契约**: `specs/001-ai-native-transformation/contracts/`

### 6.2 实现User Stories

按优先级实施功能：

**P1 (MVP核心)**:
1. User Story 1: 自然语言应用创建
2. User Story 2: 智能Agent协作可视化

**P2 (增强功能)**:
3. User Story 3: AI辅助的可视化编辑
4. User Story 4: 智能数据模型推荐

**P3 (高级功能)**:
5. User Story 5: 一键部署与环境管理
6. User Story 6: 智能代码审查与优化建议

### 6.3 运行Tasks生成命令

```bash
# 生成详细的实施任务列表
/speckit.tasks
```

这将生成 `specs/001-ai-native-transformation/tasks.md`，包含每个User Story的具体实施步骤和技术任务。

---

## 7. Useful Commands

```bash
# 开发服务器
npm run dev                  # 同时启动前端和后端
npm run dev:frontend         # 仅前端 (Vite, port 12000)
npm run dev:backend          # 仅后端 (nodemon, port 3001)

# 构建
npm run build                # 构建整个项目
npm run build:frontend       # 仅构建前端 (tsc + vite build)
npm run build:backend        # 仅构建后端 (tsc)

# 测试
npm test                     # 运行所有测试
npm run test:frontend        # 前端测试 (Vitest)
npm run test:backend         # 后端测试 (Jest)
cd backend && npm run test:watch  # 后端测试监听模式

# 代码质量
cd frontend && npm run lint  # 前端linting
cd backend && npm run lint   # 后端linting
cd frontend && npm run type-check  # TypeScript类型检查

# 数据库
npx prisma studio            # 打开Prisma Studio (数据库GUI)
npx prisma migrate dev       # 创建新迁移
npx prisma migrate deploy    # 应用迁移到生产

# Docker
docker-compose up -d         # 启动所有服务（后台）
docker-compose logs -f       # 查看实时日志
docker-compose down          # 停止所有服务
```

---

## 8. Resources

- **项目文档**: `/specs/001-ai-native-transformation/`
- **API文档**: http://localhost:3001/api-docs (Swagger)
- **Storybook** (可选): http://localhost:6006
- **Claude Code文档**: https://docs.claude.com/en/docs/claude-code

---

**Happy Coding! 🚀**

如有问题，请查看：
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- 项目README: `/README.md`
- CLAUDE.md: `/CLAUDE.md` (Claude Code专用指南)
