# WebSocket Events Protocol

**Version**: 1.0.0
**Protocol**: Socket.IO
**Namespace**: `/builder`

## Overview

本文档定义前后端WebSocket实时通信的事件协议。所有事件使用JSON格式，遵循统一的命名和结构规范。

---

## Connection & Authentication

### Client → Server: `authenticate`

客户端建立连接后发送认证令牌

**Payload**:
```json
{
  "token": "jwt-token-here"
}
```

**Response (via `authenticated` event)**:
```json
{
  "userId": "uuid",
  "username": "john_doe"
}
```

---

### Client → Server: `join-project`

加入特定项目的房间以接收该项目的更新

**Payload**:
```json
{
  "projectId": "project-uuid"
}
```

**Response (via `project-joined` event)**:
```json
{
  "projectId": "project-uuid",
  "members": 3
}
```

---

## Agent Status Events

### Server → Client: `agent:status:update`

Agent状态更新（实时推送）

**Payload**:
```json
{
  "type": "agent:status:update",
  "timestamp": 1698765432000,
  "payload": {
    "agentId": "agent-uuid",
    "agentType": "ui",  // ui, backend, database, integration, deployment
    "status": "working",  // idle, working, waiting, completed, failed
    "currentTask": "Generating UI layout for Dashboard page",
    "progress": 65,  // 0-100
    "message": "Selected 5 components from library"
  }
}
```

---

### Server → Client: `agent:output`

Agent完成任务并输出结果

**Payload**:
```json
{
  "type": "agent:output",
  "timestamp": 1698765432000,
  "payload": {
    "agentId": "agent-uuid",
    "agentType": "database",
    "output": {
      "entities": [
        {"name": "User", "fields": [...], "relationships": [...]}
      ],
      "migrations": ["CREATE TABLE users ..."]
    },
    "summary": "Created 3 data tables: User, Product, Order"
  }
}
```

---

### Server → Client: `agent:error`

Agent执行失败

**Payload**:
```json
{
  "type": "agent:error",
  "timestamp": 1698765432000,
  "payload": {
    "agentId": "agent-uuid",
    "agentType": "backend",
    "error": {
      "code": "AI_API_TIMEOUT",
      "message": "AI service timeout after 30s",
      "details": {...},
      "retryable": true,
      "retryCount": 1
    }
  }
}
```

---

## Build Progress Events

### Server → Client: `build:started`

构建流程开始

**Payload**:
```json
{
  "type": "build:started",
  "timestamp": 1698765432000,
  "payload": {
    "projectId": "project-uuid",
    "estimatedDuration": 120,  // seconds
    "phases": ["analyze", "design", "generate", "validate"]
  }
}
```

---

### Server → Client: `build:progress`

构建进度更新

**Payload**:
```json
{
  "type": "build:progress",
  "timestamp": 1698765432000,
  "payload": {
    "projectId": "project-uuid",
    "currentPhase": "design",
    "phaseProgress": 75,  // 0-100
    "overallProgress": 45,  // 0-100
    "message": "Database schema design completed",
    "estimatedTimeRemaining": 75  // seconds
  }
}
```

---

### Server → Client: `build:completed`

构建完成

**Payload**:
```json
{
  "type": "build:completed",
  "timestamp": 1698765432000,
  "payload": {
    "projectId": "project-uuid",
    "duration": 118,  // seconds
    "previewUrl": "http://localhost:3000/preview/project-uuid",
    "stats": {
      "componentsGenerated": 12,
      "apiEndpointsCreated": 8,
      "dataModelsCreated": 3
    }
  }
}
```

---

### Server → Client: `build:failed`

构建失败

**Payload**:
```json
{
  "type": "build:failed",
  "timestamp": 1698765432000,
  "payload": {
    "projectId": "project-uuid",
    "error": {
      "phase": "generate",
      "message": "Failed to generate API endpoints",
      "details": {...},
      "suggestions": [
        "Check if requirements are clear enough",
        "Try simplifying the feature scope"
      ]
    }
  }
}
```

---

## User Decision Events

### Server → Client: `user:decision:required`

需要用户做出决策

**Payload**:
```json
{
  "type": "user:decision:required",
  "timestamp": 1698765432000,
  "payload": {
    "projectId": "project-uuid",
    "agentId": "agent-uuid",
    "decisionId": "decision-uuid",
    "question": "Which layout style do you prefer?",
    "options": [
      {
        "id": "option-1",
        "label": "Modern Dashboard",
        "description": "Card-based layout with charts",
        "preview": "url-to-preview-image"
      },
      {
        "id": "option-2",
        "label": "Classic Table",
        "description": "Traditional table-based layout"
      }
    ],
    "timeout": 300  // seconds, auto-select default if no response
  }
}
```

---

### Client → Server: `user:decision:response`

用户响应决策请求

**Payload**:
```json
{
  "decisionId": "decision-uuid",
  "selectedOptionId": "option-1",
  "feedback": "Looks great!"  // optional
}
```

---

## Deployment Events

### Server → Client: `deployment:progress`

部署进度更新

**Payload**:
```json
{
  "type": "deployment:progress",
  "timestamp": 1698765432000,
  "payload": {
    "deploymentId": "deployment-uuid",
    "environment": "test",
    "stage": "building",  // building, deploying, health-check
    "progress": 40,  // 0-100
    "message": "Building Docker image..."
  }
}
```

---

### Server → Client: `deployment:success`

部署成功

**Payload**:
```json
{
  "type": "deployment:success",
  "timestamp": 1698765432000,
  "payload": {
    "deploymentId": "deployment-uuid",
    "environment": "test",
    "url": "https://test-project-xyz.aibuilder.app",
    "healthStatus": "healthy",
    "duration": 245  // seconds
  }
}
```

---

## Error Handling

所有错误事件使用统一格式：

```json
{
  "type": "error",
  "timestamp": 1698765432000,
  "payload": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "recoverable": true,
    "actions": [
      {"label": "Retry", "action": "retry"},
      {"label": "Cancel", "action": "cancel"}
    ]
  }
}
```

---

## Heartbeat

### Server → Client: `ping`

服务器发送心跳（每30秒）

**Payload**: `null`

### Client → Server: `pong`

客户端响应心跳

**Payload**: `null`

---

## Event Naming Conventions

- **格式**: `<domain>:<entity>:<action>`
- **示例**:
  - `agent:status:update` - Agent领域, status实体, update动作
  - `build:progress` - Build领域, progress实体
  - `user:decision:required` - User领域, decision实体, required动作

---

## Client Implementation Example

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3001/builder', {
  auth: {
    token: localStorage.getItem('jwt'),
  },
});

// 认证成功
socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.username);
});

// 加入项目房间
socket.emit('join-project', { projectId: 'xxx' });

// 监听Agent状态更新
socket.on('agent:status:update', (event) => {
  updateAgentUI(event.payload);
});

// 监听构建进度
socket.on('build:progress', (event) => {
  updateProgressBar(event.payload.overallProgress);
});

// 处理用户决策请求
socket.on('user:decision:required', (event) => {
  showDecisionModal(event.payload);
});

// 发送决策响应
function respondToDecision(decisionId: string, optionId: string) {
  socket.emit('user:decision:response', {
    decisionId,
    selectedOptionId: optionId,
  });
}

// 断线重连
socket.on('reconnect', () => {
  console.log('Reconnected, rejoining project...');
  socket.emit('join-project', { projectId: currentProjectId });
});
```

---

## Server Implementation Example

```typescript
import { Server } from 'socket.io';
import { verifyJWT } from './auth';

const io = new Server(3001, {
  cors: { origin: 'http://localhost:12000' },
});

const builderNamespace = io.of('/builder');

builderNamespace.use(async (socket, next) => {
  // 认证中间件
  const token = socket.handshake.auth.token;
  try {
    const user = await verifyJWT(token);
    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

builderNamespace.on('connection', (socket) => {
  console.log('Client connected:', socket.data.user.id);

  socket.emit('authenticated', {
    userId: socket.data.user.id,
    username: socket.data.user.username,
  });

  // 加入项目房间
  socket.on('join-project', ({ projectId }) => {
    socket.join(`project:${projectId}`);
    socket.emit('project-joined', { projectId, members: 1 });
  });

  // 处理用户决策响应
  socket.on('user:decision:response', async (data) => {
    await handleUserDecision(data.decisionId, data.selectedOptionId);
  });

  // 断线处理
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.data.user.id);
  });
});

// Agent发布状态更新（通过Redis Pub/Sub）
function publishAgentUpdate(projectId: string, payload: any) {
  builderNamespace.to(`project:${projectId}`).emit('agent:status:update', {
    type: 'agent:status:update',
    timestamp: Date.now(),
    payload,
  });
}
```

---

## Testing

使用Socket.IO客户端工具测试事件：

```bash
# 安装工具
npm install -g socket.io-client-tool

# 连接并测试
socketio-client-tool http://localhost:3001/builder \
  --auth '{"token":"jwt-token"}' \
  --emit 'join-project' '{"projectId":"xxx"}' \
  --on 'agent:status:update'
```

---

**版本历史**:
- v1.0.0 (2025-10-28): 初始版本，定义核心事件协议
