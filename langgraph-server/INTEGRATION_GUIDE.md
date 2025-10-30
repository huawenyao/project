# LangGraph Server 集成指南

本文档详细说明了如何将 LangGraph Server 集成到 AI Builder Studio 主应用中。

---

## 📋 目录

1. [系统架构](#系统架构)
2. [快速开始](#快速开始)
3. [后端集成](#后端集成)
4. [前端集成](#前端集成)
5. [可用的 Agents](#可用的-agents)
6. [测试](#测试)
7. [故障排除](#故障排除)

---

## 系统架构

### 整体架构图

```
前端 (React)
    ↓ WebSocket
后端 (Node.js/Express)
    ↓ HTTP/WebSocket
LangGraph Server (Python/FastAPI)
    ↓
┌─────────────────────────────┐
│   Builder Agent             │
│   UI Agent                  │
│   Database Agent            │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│   持久化存储 (PostgreSQL)    │
│   LangSmith 追踪            │
└─────────────────────────────┘
```

### 组件说明

| 组件 | 位置 | 作用 |
|------|------|------|
| **LangGraph Server** | `langgraph-server/` | Python FastAPI 服务，运行 LangGraph Agents |
| **后端集成** | `backend/src/services/LangGraphClient.ts` | Node.js 客户端，连接 LangGraph Server |
| **WebSocket 处理** | `backend/src/services/WebSocketService.ts` | 处理实时通信和流式响应 |
| **前端服务** | `frontend/src/services/LangGraphService.ts` | 前端服务层，封装 WebSocket 通信 |
| **React Hooks** | `frontend/src/hooks/useLangGraphAgent.ts` | React Hooks，简化 Agent 调用 |

---

## 快速开始

### 1. 启动 LangGraph Server

```bash
cd langgraph-server
./start-server.sh
```

服务器将在 `http://localhost:8123` 启动。

### 2. 启动后端服务

```bash
cd backend
npm run dev
```

后端服务将在 `http://localhost:3001` 启动。

### 3. 启动前端应用

```bash
cd frontend
npm run dev
```

前端应用将在 `http://localhost:3000` 启动。

### 4. 运行集成测试

```bash
cd langgraph-server
./test-integration.py
```

---

## 后端集成

### LangGraphClient

**位置**: `backend/src/services/LangGraphClient.ts`

这是连接 LangGraph Server 的核心客户端。

#### 基本用法

```typescript
import { getLangGraphClient } from './services/LangGraphClient';

// 获取客户端实例
const client = getLangGraphClient();

// 运行 Builder Agent
const result = await client.runBuilderAgent(
  '创建一个待办事项应用',
  { userId: 'user123' }
);

// 运行 UI Agent
const uiResult = await client.runUIAgent(
  '设计待办事项列表界面'
);

// 运行 Database Agent
const dbResult = await client.runDatabaseAgent(
  '设计待办事项数据库架构'
);
```

#### 流式 API

```typescript
// 流式运行 Agent
const stream = await client.streamAgent('builder_agent', {
  user_request: '创建一个待办事项应用',
  context: { userId: 'user123' }
});

// 监听流式事件
stream.on('chunk', (chunk) => {
  console.log('收到数据块:', chunk);
});

stream.on('end', (data) => {
  console.log('完成:', data);
});

stream.on('error', (error) => {
  console.error('错误:', error);
});
```

#### 健康检查

```typescript
// 检查 LangGraph Server 是否可用
const isHealthy = await client.healthCheck();
console.log('服务器健康:', isHealthy);

// 获取可用的 Agent 列表
const agents = await client.getAvailableAgents();
console.log('可用的 Agents:', agents);
```

### WebSocket 集成

**位置**: `backend/src/services/WebSocketService.ts`

WebSocket 服务已添加 LangGraph 事件处理。

#### 前端 → 后端事件

| 事件 | 数据 | 说明 |
|------|------|------|
| `langgraph:agent:run` | `{ agentName, request, context, sessionId }` | 运行 Agent（非流式） |
| `langgraph:agent:stream` | `{ agentName, request, context, sessionId }` | 流式运行 Agent |

#### 后端 → 前端事件

| 事件 | 数据 | 说明 |
|------|------|------|
| `langgraph:agent:start` | `{ agentName, sessionId, timestamp }` | Agent 开始执行 |
| `langgraph:agent:chunk` | `{ agentName, sessionId, chunk, timestamp }` | 流式数据块 |
| `langgraph:agent:complete` | `{ agentName, sessionId, result, timestamp }` | Agent 执行完成 |
| `langgraph:agent:error` | `{ agentName, sessionId, error, timestamp }` | Agent 执行错误 |
| `langgraph:agent:update` | `{ sessionId, agentName, status, progress, message }` | Agent 状态更新 |

### 环境变量

在 `backend/.env` 中添加:

```bash
# LangGraph Server Configuration
LANGGRAPH_SERVER_URL=http://localhost:8123
```

---

## 前端集成

### LangGraphService

**位置**: `frontend/src/services/LangGraphService.ts`

前端服务层，封装 WebSocket 通信。

#### 基本用法

```typescript
import langGraphService from './services/LangGraphService';

// 运行 Builder Agent
const sessionId = langGraphService.runBuilderAgent(
  '创建一个待办事项应用',
  { userId: 'user123' }
);

// 监听事件
langGraphService.on('agent:complete', (response) => {
  console.log('完成:', response);
});

langGraphService.on('agent:error', (error) => {
  console.error('错误:', error);
});
```

### React Hooks

**位置**: `frontend/src/hooks/useLangGraphAgent.ts`

提供了简化的 React Hooks。

#### useLangGraphAgent

通用 Hook，可用于任何 Agent:

```tsx
import { useLangGraphAgent } from './hooks/useLangGraphAgent';

function MyComponent() {
  const { loading, response, error, run } = useLangGraphAgent({
    agentName: 'builder_agent',
    streaming: true,
    onComplete: (res) => {
      console.log('完成:', res);
    },
    onError: (err) => {
      console.error('错误:', err);
    },
    onChunk: (chunk) => {
      console.log('数据块:', chunk);
    },
  });

  return (
    <div>
      <button
        onClick={() => run('创建一个待办事项应用')}
        disabled={loading}
      >
        {loading ? '运行中...' : '运行 Agent'}
      </button>

      {error && <div>错误: {error.error}</div>}
      {response && <div>结果: {JSON.stringify(response.result)}</div>}
    </div>
  );
}
```

#### 专用 Hooks

```tsx
import {
  useLangGraphBuilderAgent,
  useLangGraphUIAgent,
  useLangGraphDatabaseAgent
} from './hooks/useLangGraphAgent';

// Builder Agent
const builder = useLangGraphBuilderAgent({
  streaming: true,
  onComplete: (res) => console.log('构建完成:', res),
});

// UI Agent
const ui = useLangGraphUIAgent({
  streaming: true,
  onComplete: (res) => console.log('UI 设计完成:', res),
});

// Database Agent
const database = useLangGraphDatabaseAgent({
  streaming: true,
  onComplete: (res) => console.log('数据库设计完成:', res),
});
```

#### Hook API

```typescript
interface UseLangGraphAgentResult {
  // 状态
  loading: boolean;              // 是否正在执行
  error: LangGraphError | null;  // 错误信息
  response: LangGraphAgentResponse | null;  // 响应结果
  chunks: any[];                 // 流式数据块数组
  sessionId: string | null;      // 会话ID

  // 方法
  run: (request: string, context?: any) => void;  // 运行 Agent
  cancel: () => void;                              // 取消执行
  reset: () => void;                               // 重置状态
}
```

### 示例组件

#### 简单示例

```tsx
import React from 'react';
import { useLangGraphBuilderAgent } from './hooks/useLangGraphAgent';

export const BuilderAgentDemo: React.FC = () => {
  const { loading, response, error, run } = useLangGraphBuilderAgent({
    streaming: false,
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Builder Agent Demo</h2>

      <button
        onClick={() => run('创建一个待办事项应用')}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? '运行中...' : '运行 Builder Agent'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          错误: {error.error}
        </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h3 className="font-bold">结果:</h3>
          <pre className="mt-2 overflow-auto">
            {JSON.stringify(response.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
```

#### 流式示例

```tsx
import React from 'react';
import { useLangGraphBuilderAgent } from './hooks/useLangGraphAgent';

export const StreamingBuilderDemo: React.FC = () => {
  const { loading, chunks, error, run } = useLangGraphBuilderAgent({
    streaming: true,
    onChunk: (chunk) => {
      console.log('收到数据块:', chunk);
    },
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Streaming Builder Agent Demo</h2>

      <button
        onClick={() => run('创建一个博客系统')}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? '运行中...' : '流式运行 Builder Agent'}
      </button>

      {loading && (
        <div className="mt-4">
          <div className="animate-pulse">正在生成...</div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          错误: {error.error}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <h3 className="font-bold">数据流 ({chunks.length} 个数据块):</h3>
        {chunks.map((chunk, index) => (
          <div key={index} className="p-2 bg-gray-100 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(chunk, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 可用的 Agents

### 1. Builder Agent

**功能**: 应用架构设计和代码生成

**入口**: `builder_agent`

**工具**:
- `analyze_requirements`: 分析需求
- `generate_architecture`: 生成架构设计
- `generate_component_code`: 生成组件代码

**示例请求**:
```typescript
run('创建一个待办事项应用，包括任务列表、添加/编辑/删除功能');
```

### 2. UI Agent

**功能**: UI/UX 设计和组件生成

**入口**: `ui_agent`

**工具**:
- `analyze_ui_requirements`: 分析 UI 需求
- `select_component_library`: 选择组件库
- `generate_layout_design`: 生成布局设计
- `generate_component_code`: 生成组件代码
- `create_style_guide`: 创建样式指南

**示例请求**:
```typescript
run('设计一个待办事项列表界面，包括任务卡片、筛选器和搜索框');
```

### 3. Database Agent

**功能**: 数据库设计和 SQL 生成

**入口**: `database_agent`

**工具**:
- `analyze_data_requirements`: 分析数据需求
- `select_database_type`: 选择数据库类型
- `design_database_schema`: 设计数据库架构
- `generate_migration_sql`: 生成迁移 SQL
- `suggest_indexes`: 推荐索引
- `generate_orm_models`: 生成 ORM 模型

**示例请求**:
```typescript
run('设计一个待办事项应用的数据库，包括用户、任务和分类表');
```

---

## 测试

### 集成测试脚本

运行完整的集成测试:

```bash
cd langgraph-server
./test-integration.py
```

测试项目:
1. ✅ 服务器健康检查
2. ✅ 获取 Agent 列表
3. ✅ Builder Agent 功能测试
4. ✅ UI Agent 功能测试
5. ✅ Database Agent 功能测试
6. ✅ 持久化存储测试
7. ✅ LangSmith 追踪测试

### 手动测试

#### 测试 LangGraph Server

```bash
# 健康检查
curl http://localhost:8123/health

# 获取 Agent 列表
curl http://localhost:8123/assistants

# 创建线程
curl -X POST http://localhost:8123/threads \
  -H "Content-Type: application/json" \
  -d '{}'

# 运行 Agent
curl -X POST http://localhost:8123/runs \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "THREAD_ID",
    "assistant_id": "builder_agent",
    "input": {
      "messages": [
        {"role": "user", "content": "创建一个待办事项应用"}
      ]
    }
  }'
```

#### 测试 Agent CLI

```bash
cd langgraph-server
python test-agent.py

# 输入示例
# Agent: builder
# 请求: 创建一个待办事项应用
```

---

## 故障排除

### 问题 1: LangGraph Server 无法启动

**症状**: `./start-server.sh` 失败

**解决方案**:
1. 检查虚拟环境是否正确创建:
   ```bash
   cd langgraph-server
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. 检查端口 8123 是否被占用:
   ```bash
   lsof -i :8123
   ```

3. 查看错误日志:
   ```bash
   tail -f langgraph-server/*.log
   ```

### 问题 2: 后端无法连接 LangGraph Server

**症状**: `Health check failed: ECONNREFUSED`

**解决方案**:
1. 确保 LangGraph Server 正在运行:
   ```bash
   curl http://localhost:8123/health
   ```

2. 检查后端 `.env` 配置:
   ```bash
   LANGGRAPH_SERVER_URL=http://localhost:8123
   ```

3. 检查防火墙设置

### 问题 3: Agent 执行超时

**症状**: `Agent 执行超时`

**解决方案**:
1. 增加超时时间（在 `LangGraphClient.ts` 中）:
   ```typescript
   timeout: 300000, // 5分钟
   ```

2. 检查 OpenAI API Key 是否正确配置:
   ```bash
   env | grep OPENAI_API_KEY
   ```

3. 查看 LangGraph Server 日志:
   ```bash
   tail -f langgraph-server/server.log
   ```

### 问题 4: 前端 WebSocket 连接失败

**症状**: `WebSocket connection failed`

**解决方案**:
1. 检查后端服务是否运行:
   ```bash
   curl http://localhost:3001/health
   ```

2. 检查前端 WebSocket URL 配置:
   ```typescript
   // frontend/src/services/WebSocketService.ts
   const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';
   ```

3. 检查 CORS 配置（在 `backend/src/index.ts` 中）

### 问题 5: LangSmith 追踪未显示

**症状**: LangSmith 中看不到追踪数据

**解决方案**:
1. 检查环境变量:
   ```bash
   env | grep LANGCHAIN
   ```

2. 确保正确配置:
   ```bash
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your-key-here
   LANGCHAIN_PROJECT=ai-builder-studio
   ```

3. 重启 LangGraph Server:
   ```bash
   cd langgraph-server
   ./stop-server.sh
   ./start-server.sh
   ```

### 问题 6: 持久化存储失败

**症状**: `数据库连接失败`

**解决方案**:
1. 检查 PostgreSQL 服务:
   ```bash
   sudo systemctl status postgresql
   ```

2. 检查数据库 URL:
   ```bash
   env | grep DATABASE_URL
   ```

3. 测试数据库连接:
   ```bash
   cd langgraph-server
   python -c "from src.storage.database import get_db_manager; db = get_db_manager(); print('连接成功' if db else '连接失败')"
   ```

### 获取帮助

如果问题仍未解决:

1. 查看完整文档:
   - [README.md](./README.md)
   - [LANGSMITH_SETUP.md](./LANGSMITH_SETUP.md)
   - [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

2. 查看日志:
   ```bash
   # LangGraph Server 日志
   tail -f langgraph-server/server.log

   # 后端日志
   cd backend && npm run dev  # 查看控制台输出

   # 前端日志
   cd frontend && npm run dev  # 查看浏览器控制台
   ```

3. 运行诊断:
   ```bash
   ./verify-installation.sh
   ```

---

## 下一步

1. **配置 LangSmith 追踪**
   - 参考 [LANGSMITH_SETUP.md](./LANGSMITH_SETUP.md)

2. **自定义 Agents**
   - 在 `src/agents/` 目录创建新的 Agent
   - 参考现有 Agent 的实现模式

3. **生产部署**
   - 使用 Docker 容器化部署
   - 配置反向代理（Nginx）
   - 设置 HTTPS

4. **性能优化**
   - 启用 Redis 缓存
   - 配置连接池
   - 实现请求队列

---

**更新时间**: 2025-10-30
**版本**: v1.0
