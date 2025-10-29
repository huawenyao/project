# AI-Native Builder API 文档

**版本**: 1.0.0
**基础 URL**: `http://localhost:3001/api`

## 目录

- [认证](#认证)
- [用户管理](#用户管理)
- [项目管理](#项目管理)
- [Agent 管理](#agent-管理)
- [任务管理](#任务管理)
- [代码生成与审查](#代码生成与审查)
- [部署管理](#部署管理)
- [WebSocket 事件](#websocket-事件)

---

## 认证

所有 API 请求（除了登录和注册）都需要在 HTTP 头部包含 JWT token:

```
Authorization: Bearer <your-jwt-token>
```

### POST /api/auth/register

注册新用户

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string"
}
```

**响应** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "fullName": "string"
    },
    "token": "jwt-token"
  }
}
```

### POST /api/auth/login

用户登录

**请求体**:
```json
{
  "email": "string",
  "password": "string"
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt-token"
  }
}
```

---

## 用户管理

### GET /api/users/me

获取当前用户信息

**Headers**: `Authorization: Bearer <token>`

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "avatarUrl": "string",
    "subscription": "free|pro|enterprise",
    "createdAt": "ISO8601"
  }
}
```

### PUT /api/users/me

更新当前用户信息

**请求体**:
```json
{
  "fullName": "string",
  "avatarUrl": "string"
}
```

---

## 项目管理

### POST /api/projects

创建新项目（自然语言输入）

**请求体**:
```json
{
  "name": "项目名称",
  "requirementText": "我需要一个待办事项应用，支持添加、删除和标记完成任务",
  "description": "可选的项目描述"
}
```

**响应** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "requirementSummary": {
      "entities": ["User", "Task"],
      "features": ["添加任务", "删除任务", "标记完成"],
      "technicalRequirements": { ... }
    },
    "status": "draft",
    "createdAt": "ISO8601"
  }
}
```

### GET /api/projects

获取用户的所有项目

**查询参数**:
- `status`: 按状态过滤 (draft, in_progress, completed)
- `page`: 页码 (默认 1)
- `limit`: 每页数量 (默认 20)

**响应** (200):
```json
{
  "success": true,
  "data": {
    "projects": [ ... ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

### GET /api/projects/:id

获取项目详情

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "requirementText": "string",
    "requirementSummary": { ... },
    "status": "string",
    "progress": 75,
    "agents": [ ... ],
    "components": [ ... ],
    "dataModels": [ ... ],
    "apiEndpoints": [ ... ]
  }
}
```

### PUT /api/projects/:id

更新项目

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "status": "draft|in_progress|completed"
}
```

### DELETE /api/projects/:id

删除项目

**响应** (204): 无内容

---

## Agent 管理

### GET /api/agents-v2

获取所有 Agent

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "ui|backend|database|integration|deployment",
      "name": "string",
      "status": "idle|working|completed|error",
      "capabilities": [ ... ],
      "performance": { ... }
    }
  ]
}
```

### GET /api/agents-v2/:id

获取 Agent 详情

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "string",
    "name": "string",
    "description": "string",
    "status": "string",
    "currentTask": "string",
    "capabilities": [ ... ],
    "performance": {
      "tasksCompleted": 10,
      "averageExecutionTime": 5000,
      "successRate": 0.95
    }
  }
}
```

---

## 任务管理

### GET /api/tasks

获取任务列表

**查询参数**:
- `projectId`: 项目 ID (必需)
- `status`: 按状态过滤
- `agentId`: 按 Agent 过滤

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "agentId": "uuid",
      "type": "string",
      "description": "string",
      "status": "pending|in_progress|completed|failed",
      "progress": 50,
      "dependencies": ["task-id-1", "task-id-2"],
      "priority": 5,
      "createdAt": "ISO8601",
      "startedAt": "ISO8601",
      "completedAt": "ISO8601"
    }
  ]
}
```

### POST /api/tasks

创建新任务

**请求体**:
```json
{
  "projectId": "uuid",
  "agentId": "uuid",
  "type": "string",
  "description": "string",
  "input": { ... },
  "dependencies": ["uuid"],
  "priority": 5
}
```

### GET /api/tasks/:id

获取任务详情

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "string",
    "status": "string",
    "progress": 75,
    "input": { ... },
    "output": { ... },
    "errorMessage": null,
    "executionTimeMs": 5000,
    "retryCount": 0
  }
}
```

---

## 代码生成与审查

### GET /api/code-review/project/:id/export

导出项目代码 (T088)

**响应** (200):
```json
{
  "success": true,
  "data": {
    "language": "TypeScript",
    "framework": "React + Express",
    "files": [
      {
        "path": "frontend/src/components/App.tsx",
        "content": "...",
        "description": "主应用组件"
      },
      ...
    ]
  }
}
```

### POST /api/code-review

审查代码 (T089)

**请求体**:
```json
{
  "code": "string",
  "language": "typescript",
  "filename": "App.tsx",
  "context": "optional context"
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "overall": {
      "score": 85,
      "grade": "B",
      "summary": "代码质量良好，有一些可以改进的地方"
    },
    "issues": [
      {
        "severity": "warning",
        "category": "performance",
        "title": "不必要的重渲染",
        "description": "...",
        "location": { "file": "App.tsx", "line": 45 },
        "suggestedFix": "..."
      }
    ],
    "suggestions": [
      {
        "id": "uuid",
        "category": "performance",
        "impact": "medium",
        "title": "使用 useMemo 优化",
        "description": "...",
        "before": "...",
        "after": "...",
        "benefit": "减少 50% 的重渲染"
      }
    ],
    "metrics": {
      "complexity": 45,
      "maintainability": 75,
      "linesOfCode": 150
    }
  }
}
```

### GET /api/code-review/project/:id/suggestions

获取项目的优化建议 (T090)

**响应** (200):
```json
{
  "success": true,
  "data": {
    "suggestions": [ ... ],
    "summary": {
      "totalScore": 82,
      "totalIssues": 5,
      "criticalIssues": 0,
      "suggestions": 8
    }
  }
}
```

### POST /api/code-review/impact

分析代码修改影响

**请求体**:
```json
{
  "originalCode": "string",
  "modifiedCode": "string",
  "projectId": "uuid"
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "affectedFiles": ["file1.ts", "file2.ts"],
    "affectedAPIs": ["/api/users"],
    "affectedComponents": ["UserList", "UserCard"],
    "riskLevel": "low",
    "recommendations": [ ... ]
  }
}
```

---

## 部署管理

### POST /api/projects/:id/deploy

部署项目

**请求体**:
```json
{
  "environment": "staging|production",
  "config": {
    "port": 3000,
    "replicas": 2,
    "resources": { ... }
  }
}
```

**响应** (202):
```json
{
  "success": true,
  "data": {
    "deploymentId": "uuid",
    "status": "pending",
    "environment": "staging"
  }
}
```

### GET /api/deployments/:id

获取部署状态

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "environment": "staging",
    "status": "completed",
    "accessUrl": "https://staging.example.com",
    "healthCheckUrl": "https://staging.example.com/health",
    "logs": "...",
    "deployedAt": "ISO8601"
  }
}
```

---

## WebSocket 事件

连接到 WebSocket: `ws://localhost:3001`

### 客户端发送事件

#### `join-project`
加入项目房间以接收实时更新

```json
{
  "event": "join-project",
  "data": {
    "projectId": "uuid"
  }
}
```

#### `agent-request`
请求 Agent 执行任务

```json
{
  "event": "agent-request",
  "data": {
    "projectId": "uuid",
    "agentType": "ui",
    "action": "generateComponents",
    "parameters": { ... }
  }
}
```

### 服务器发送事件

#### `agent:status:update`
Agent 状态更新

```json
{
  "event": "agent:status:update",
  "data": {
    "agentId": "uuid",
    "status": "working",
    "currentTask": "生成 UI 组件",
    "progress": 50
  }
}
```

#### `agent:output`
Agent 输出结果

```json
{
  "event": "agent:output",
  "data": {
    "agentId": "uuid",
    "taskId": "uuid",
    "output": { ... }
  }
}
```

#### `task:progress`
任务进度更新

```json
{
  "event": "task:progress",
  "data": {
    "taskId": "uuid",
    "progress": 75,
    "status": "in_progress",
    "message": "正在生成代码..."
  }
}
```

#### `build:log`
构建日志

```json
{
  "event": "build:log",
  "data": {
    "projectId": "uuid",
    "level": "info|warning|error",
    "message": "...",
    "timestamp": "ISO8601"
  }
}
```

---

## 错误响应

所有错误响应遵循统一格式:

```json
{
  "success": false,
  "error": "错误消息",
  "details": {
    "code": "ERROR_CODE",
    "message": "详细错误信息"
  }
}
```

### HTTP 状态码

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `204 No Content`: 请求成功，无返回内容
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证
- `403 Forbidden`: 无权限
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突
- `429 Too Many Requests`: 请求过于频繁
- `500 Internal Server Error`: 服务器错误

---

## 速率限制

API 使用速率限制保护服务:

- 未认证请求: 100 请求/小时
- 已认证请求: 1000 请求/小时

响应头包含速率限制信息:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

---

## 更新日志

### v1.0.0 (2025-10-29)
- 初始 API 版本发布
- Phase 8-9 功能实现
  - T088: 代码导出功能
  - T089: AI 代码审查
  - T090: 优化建议 API
  - T098: AI 响应缓存

---

**支持**: support@example.com
**文档更新**: 2025-10-29
