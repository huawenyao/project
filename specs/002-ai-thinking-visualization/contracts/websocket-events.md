# WebSocket事件规范: AI思考过程可视化系统

**版本**: 1.0.0
**协议**: Socket.IO
**传输方式**: WebSocket (自动降级到HTTP长轮询)
**认证方式**: JWT Token (握手时验证)

---

## 目录

- [连接管理](#连接管理)
- [客户端订阅事件](#客户端订阅事件)
- [服务器推送事件](#服务器推送事件)
- [TypeScript类型定义](#typescript类型定义)
- [错误处理](#错误处理)
- [重连策略](#重连策略)
- [性能优化](#性能优化)

---

## 连接管理

### 建立连接

客户端使用Socket.IO客户端库建立WebSocket连接：

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token-here', // JWT认证token
  },
  transports: ['websocket', 'polling'], // 优先使用WebSocket
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

// 监听连接成功
socket.on('connect', () => {
  console.log('WebSocket连接已建立', socket.id);
});

// 监听连接错误
socket.on('connect_error', (error) => {
  console.error('连接失败:', error.message);
});

// 监听断开连接
socket.on('disconnect', (reason) => {
  console.warn('连接已断开:', reason);
});
```

### 加入项目房间

连接成功后，客户端加入特定项目的房间以接收该项目的实时更新：

```typescript
socket.emit('join-project', { projectId: 'project-uuid-here' });

socket.on('joined-project', (data) => {
  console.log('已加入项目房间:', data.projectId);
});
```

### 离开项目房间

```typescript
socket.emit('leave-project', { projectId: 'project-uuid-here' });

socket.on('left-project', (data) => {
  console.log('已离开项目房间:', data.projectId);
});
```

---

## 客户端订阅事件

客户端发送这些事件到服务器以订阅/取消订阅实时更新。

### 1. `subscribe-session`

订阅特定构建会话的实时更新。

**请求数据**:

```typescript
interface SubscribeSessionRequest {
  sessionId: string; // 会话UUID
  includeDecisions?: boolean; // 是否包含决策事件（默认true）
  includeCollaborations?: boolean; // 是否包含协作事件（默认true）
  includeErrors?: boolean; // 是否包含错误事件（默认true）
}
```

**示例**:

```typescript
socket.emit('subscribe-session', {
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
  includeDecisions: true,
  includeCollaborations: true,
  includeErrors: true,
});
```

**响应事件**: `session-subscribed`

```typescript
interface SessionSubscribedResponse {
  success: boolean;
  sessionId: string;
  currentState: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    overallProgress: number; // 0-100
    agents: AgentWorkStatusData[];
  };
}
```

**示例响应**:

```typescript
socket.on('session-subscribed', (data: SessionSubscribedResponse) => {
  console.log('已订阅会话:', data.sessionId);
  console.log('当前状态:', data.currentState);
});
```

---

### 2. `unsubscribe-session`

取消订阅特定构建会话。

**请求数据**:

```typescript
interface UnsubscribeSessionRequest {
  sessionId: string; // 会话UUID
}
```

**示例**:

```typescript
socket.emit('unsubscribe-session', {
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
});
```

**响应事件**: `session-unsubscribed`

```typescript
interface SessionUnsubscribedResponse {
  success: boolean;
  sessionId: string;
}
```

---

## 服务器推送事件

服务器主动推送这些事件到已订阅的客户端。

### 1. `agent-status-update`

Agent状态变化时推送（混合更新频率策略）。

**推送频率**:
- **高优先级Agent** (UIAgent, BackendAgent, DatabaseAgent): 200-500ms
- **低优先级Agent** (DeploymentAgent, IntegrationAgent): 1-2s
- **状态关键变化** (pending→in_progress, in_progress→completed): 立即推送

**事件数据**:

```typescript
interface AgentStatusUpdateEvent {
  sessionId: string;
  agentId: string;
  agentType: 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  previousStatus?: string;
  currentTask: string; // 当前任务描述（50-200字符）
  progress: number; // 0-100
  startTime?: string; // ISO 8601格式
  endTime?: string; // ISO 8601格式（如已完成）
  duration?: number; // 持续时长（秒）
  retryCount: number;
  timestamp: string; // ISO 8601格式
  metadata?: {
    estimatedRemainingTime?: number; // 预计剩余时间（秒）
    [key: string]: any;
  };
}
```

**示例**:

```typescript
socket.on('agent-status-update', (data: AgentStatusUpdateEvent) => {
  console.log(`${data.agentType} 状态更新:`, data.status);
  console.log(`当前任务: ${data.currentTask}`);
  console.log(`进度: ${data.progress}%`);

  // 更新UI显示Agent状态
  updateAgentCard(data.agentId, {
    status: data.status,
    task: data.currentTask,
    progress: data.progress,
  });
});
```

**完整示例数据**:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "agentId": "agent_ui_001",
  "agentType": "UIAgent",
  "status": "in_progress",
  "previousStatus": "pending",
  "currentTask": "正在为您设计导航栏组件...",
  "progress": 35,
  "startTime": "2025-10-27T10:30:05Z",
  "duration": 120,
  "retryCount": 0,
  "timestamp": "2025-10-27T10:32:05Z",
  "metadata": {
    "estimatedRemainingTime": 180
  }
}
```

---

### 2. `decision-created`

Agent产生新决策时立即推送（延迟<100ms）。

**事件数据**:

```typescript
interface DecisionCreatedEvent {
  sessionId: string;
  decisionId: string;
  agentId: string;
  agentType: 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
  title: string; // 决策标题
  importance: 'high' | 'medium' | 'low'; // 重要性
  reasoning: string; // 决策理由（1-2句话摘要）
  fullReasoning?: string; // 完整理由（3-5条要点）
  alternatives?: DecisionAlternative[]; // 备选方案
  selectedReason?: string; // 选择该方案的原因
  impacts?: DecisionImpact[]; // 决策影响
  timestamp: string; // ISO 8601格式
  hasPreview: boolean; // 是否有预览数据
  previewType?: 'image' | 'html' | 'json'; // 预览类型
  previewUrl?: string; // 预览数据URL（如有）
  metadata?: {
    tags?: string[];
    relatedDecisions?: string[]; // 相关决策ID列表
    [key: string]: any;
  };
}

interface DecisionAlternative {
  name: string;
  pros: string[];
  cons: string[];
}

interface DecisionImpact {
  area: string; // 影响领域（如"开发效率"、"维护成本"）
  description: string; // 影响描述
  severity: 'positive' | 'neutral' | 'negative'; // 影响性质
}
```

**示例**:

```typescript
socket.on('decision-created', (data: DecisionCreatedEvent) => {
  console.log(`新决策产生: ${data.title}`);
  console.log(`重要性: ${data.importance}`);
  console.log(`理由: ${data.reasoning}`);

  // 根据重要性决定如何展示
  if (data.importance === 'high') {
    // 高重要性：右下角toast通知
    showToastNotification({
      title: data.title,
      summary: data.reasoning,
      decisionId: data.decisionId,
      autoClose: 5000, // 5秒后自动收起
    });
  }

  // 所有决策都添加到侧边栏时间线
  addToDecisionTimeline(data);
});
```

**完整示例数据**:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "decisionId": "decision_001",
  "agentId": "agent_ui_001",
  "agentType": "UIAgent",
  "title": "选择React作为前端框架",
  "importance": "high",
  "reasoning": "React拥有丰富的生态系统和组件库，团队熟悉度高",
  "fullReasoning": "综合考虑以下因素：1) React拥有成熟的生态系统和大量第三方库；2) 团队成员对React有丰富经验；3) 适合构建复杂的单页应用；4) 社区支持活跃，问题解决效率高；5) 与后端API集成简单",
  "alternatives": [
    {
      "name": "Vue.js",
      "pros": ["学习曲线平缓", "模板语法简洁", "文档完善"],
      "cons": ["生态系统相对较小", "企业级支持不如React"]
    },
    {
      "name": "Angular",
      "pros": ["完整的框架解决方案", "TypeScript原生支持", "企业级特性"],
      "cons": ["学习曲线陡峭", "包体积较大", "灵活性较低"]
    }
  ],
  "selectedReason": "综合考虑团队技能栈、项目复杂度和长期维护成本，React是最优选择",
  "impacts": [
    {
      "area": "开发效率",
      "description": "丰富的组件库可加速开发，预计节省30%开发时间",
      "severity": "positive"
    },
    {
      "area": "维护成本",
      "description": "良好的社区支持和团队熟悉度降低维护成本",
      "severity": "positive"
    },
    {
      "area": "学习成本",
      "description": "新成员需要学习React生态系统",
      "severity": "neutral"
    }
  ],
  "timestamp": "2025-10-27T10:32:15Z",
  "hasPreview": true,
  "previewType": "image",
  "previewUrl": "/api/visualization/previews/decision_001",
  "metadata": {
    "tags": ["frontend", "framework", "architecture"],
    "relatedDecisions": []
  }
}
```

---

### 3. `collaboration-event`

Agent间协作事件（数据传递、依赖触发）。

**推送时机**: 协作发生时立即推送

**事件数据**:

```typescript
interface CollaborationEventData {
  sessionId: string;
  eventId: string;
  sourceAgentId: string;
  sourceAgentType: 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
  targetAgentId: string;
  targetAgentType: 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
  collaborationType: 'data_transfer' | 'dependency_trigger' | 'validation_request' | 'approval_request';
  dataType: string; // 传递的数据类型（如"database_schema", "api_spec", "ui_components"）
  dataSummary: string; // 数据内容摘要（1-2句话）
  dataSize?: number; // 数据大小（字节）
  timestamp: string; // ISO 8601格式
  metadata?: {
    [key: string]: any;
  };
}
```

**示例**:

```typescript
socket.on('collaboration-event', (data: CollaborationEventData) => {
  console.log(`协作: ${data.sourceAgentType} → ${data.targetAgentType}`);
  console.log(`数据类型: ${data.dataType}`);
  console.log(`摘要: ${data.dataSummary}`);

  // 在可视化界面显示协作动画
  showCollaborationAnimation(
    data.sourceAgentId,
    data.targetAgentId,
    data.dataType
  );

  // 在图形视图中显示连线流动效果
  if (currentView === 'graph') {
    animateDataFlow(data.sourceAgentId, data.targetAgentId);
  }
});
```

**完整示例数据**:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "eventId": "collab_001",
  "sourceAgentId": "agent_db_001",
  "sourceAgentType": "DatabaseAgent",
  "targetAgentId": "agent_backend_001",
  "targetAgentType": "BackendAgent",
  "collaborationType": "data_transfer",
  "dataType": "database_schema",
  "dataSummary": "包含5个表: users, products, orders, payments, reviews",
  "dataSize": 2048,
  "timestamp": "2025-10-27T10:35:00Z",
  "metadata": {
    "tableCount": 5,
    "relationshipCount": 8
  }
}
```

---

### 4. `error-occurred`

Agent执行错误时推送（含重试状态）。

**推送时机**: 错误发生时立即推送

**事件数据**:

```typescript
interface ErrorOccurredEvent {
  sessionId: string;
  errorId: string;
  agentId: string;
  agentType: 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
  errorType: 'network_timeout' | 'api_rate_limit' | 'service_unavailable' | 'decision_generation_failed' | 'dependency_missing' | 'data_validation_error' | 'unknown';
  errorCategory: 'minor' | 'critical'; // 轻微错误或关键错误
  errorMessage: string; // 用户友好的错误消息
  technicalDetails?: string; // 技术细节（可选，供高级用户查看）
  stackTrace?: string; // 堆栈跟踪（可选）
  retryStrategy: 'auto_retry' | 'manual_retry' | 'no_retry';
  currentRetryCount: number;
  maxRetryCount: number;
  nextRetryDelay?: number; // 下次重试延迟（秒）
  suggestedActions: string[]; // 建议的用户操作
  timestamp: string; // ISO 8601格式
  metadata?: {
    affectedComponents?: string[];
    [key: string]: any;
  };
}
```

**示例**:

```typescript
socket.on('error-occurred', (data: ErrorOccurredEvent) => {
  console.error(`Agent错误: ${data.agentType} - ${data.errorMessage}`);

  if (data.errorCategory === 'minor' && data.retryStrategy === 'auto_retry') {
    // 轻微错误，自动重试
    showRetryStatus({
      agentId: data.agentId,
      message: `正在重试(第${data.currentRetryCount}/${data.maxRetryCount}次)...`,
      nextRetryIn: data.nextRetryDelay,
    });
  } else if (data.errorCategory === 'critical') {
    // 关键错误，暂停构建并显示错误详情
    pauseBuildSession(data.sessionId);
    showErrorModal({
      title: `${data.agentType} 遇到问题`,
      message: data.errorMessage,
      technicalDetails: data.technicalDetails,
      suggestedActions: data.suggestedActions,
      onRetry: () => socket.emit('retry-agent', { agentId: data.agentId }),
      onSkip: () => socket.emit('skip-agent', { agentId: data.agentId }),
      onTerminate: () => socket.emit('terminate-session', { sessionId: data.sessionId }),
    });
  }
});
```

**完整示例数据（轻微错误）**:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "errorId": "error_001",
  "agentId": "agent_backend_001",
  "agentType": "BackendAgent",
  "errorType": "network_timeout",
  "errorCategory": "minor",
  "errorMessage": "连接外部API超时，正在自动重试",
  "technicalDetails": "HTTP request to https://api.example.com/v1/data timed out after 10 seconds",
  "retryStrategy": "auto_retry",
  "currentRetryCount": 1,
  "maxRetryCount": 3,
  "nextRetryDelay": 2,
  "suggestedActions": [
    "系统将自动重试，无需操作",
    "如果问题持续，请检查网络连接"
  ],
  "timestamp": "2025-10-27T10:35:15Z",
  "metadata": {
    "url": "https://api.example.com/v1/data",
    "timeout": 10000
  }
}
```

**完整示例数据（关键错误）**:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "errorId": "error_002",
  "agentId": "agent_db_001",
  "agentType": "DatabaseAgent",
  "errorType": "decision_generation_failed",
  "errorCategory": "critical",
  "errorMessage": "无法生成数据库schema设计，请检查输入需求是否清晰",
  "technicalDetails": "AI model returned incomplete response: missing table definitions",
  "stackTrace": "Error: Incomplete AI response\n  at DatabaseAgent.generateSchema (agent.ts:123)\n  ...",
  "retryStrategy": "manual_retry",
  "currentRetryCount": 3,
  "maxRetryCount": 3,
  "suggestedActions": [
    "重新审查项目需求描述",
    "手动重试该Agent",
    "跳过数据库设计步骤，稍后手动配置",
    "终止构建并重新开始"
  ],
  "timestamp": "2025-10-27T10:38:45Z",
  "metadata": {
    "affectedComponents": ["database_schema", "backend_api"],
    "aiModelUsed": "gpt-4"
  }
}
```

---

### 5. `session-completed`

构建会话完成时推送。

**推送时机**: 所有Agent完成任务或会话被终止

**事件数据**:

```typescript
interface SessionCompletedEvent {
  sessionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  startTime: string; // ISO 8601格式
  endTime: string; // ISO 8601格式
  totalDuration: number; // 总时长（秒）
  summary: {
    totalAgents: number;
    completedAgents: number;
    failedAgents: number;
    skippedAgents: number;
    totalDecisions: number;
    totalCollaborations: number;
    totalErrors: number;
  };
  artifacts?: {
    type: string;
    name: string;
    url: string;
  }[]; // 生成的工件（代码、配置文件等）
  nextSteps?: string[]; // 建议的下一步操作
  timestamp: string; // ISO 8601格式
  metadata?: {
    [key: string]: any;
  };
}
```

**示例**:

```typescript
socket.on('session-completed', (data: SessionCompletedEvent) => {
  console.log(`构建会话完成: ${data.status}`);
  console.log(`总时长: ${data.totalDuration}秒`);
  console.log(`决策数量: ${data.summary.totalDecisions}`);

  if (data.status === 'completed') {
    showSuccessModal({
      title: '构建完成！',
      duration: data.totalDuration,
      summary: data.summary,
      artifacts: data.artifacts,
      nextSteps: data.nextSteps,
    });
  } else if (data.status === 'failed') {
    showFailureModal({
      title: '构建失败',
      summary: data.summary,
      errorCount: data.summary.totalErrors,
    });
  }

  // 清理订阅
  socket.emit('unsubscribe-session', { sessionId: data.sessionId });
});
```

**完整示例数据（成功）**:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "startTime": "2025-10-27T10:30:00Z",
  "endTime": "2025-10-27T10:45:32Z",
  "totalDuration": 932,
  "summary": {
    "totalAgents": 5,
    "completedAgents": 5,
    "failedAgents": 0,
    "skippedAgents": 0,
    "totalDecisions": 12,
    "totalCollaborations": 8,
    "totalErrors": 2
  },
  "artifacts": [
    {
      "type": "code",
      "name": "前端组件代码",
      "url": "/api/artifacts/550e8400/frontend-components.zip"
    },
    {
      "type": "code",
      "name": "后端API代码",
      "url": "/api/artifacts/550e8400/backend-api.zip"
    },
    {
      "type": "config",
      "name": "数据库迁移脚本",
      "url": "/api/artifacts/550e8400/db-migrations.sql"
    }
  ],
  "nextSteps": [
    "下载生成的代码和配置文件",
    "运行数据库迁移脚本",
    "启动开发服务器测试应用",
    "查看决策记录了解设计思路"
  ],
  "timestamp": "2025-10-27T10:45:32Z",
  "metadata": {
    "projectName": "电商管理系统",
    "projectId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

## TypeScript类型定义

完整的TypeScript类型定义文件，可在前端项目中使用：

```typescript
// types/websocket-events.ts

// ============ 客户端发送事件 ============

export interface SubscribeSessionRequest {
  sessionId: string;
  includeDecisions?: boolean;
  includeCollaborations?: boolean;
  includeErrors?: boolean;
}

export interface UnsubscribeSessionRequest {
  sessionId: string;
}

export interface JoinProjectRequest {
  projectId: string;
}

export interface LeaveProjectRequest {
  projectId: string;
}

export interface RetryAgentRequest {
  agentId: string;
}

export interface SkipAgentRequest {
  agentId: string;
}

export interface TerminateSessionRequest {
  sessionId: string;
}

// ============ 服务器响应事件 ============

export interface SessionSubscribedResponse {
  success: boolean;
  sessionId: string;
  currentState: {
    status: SessionStatus;
    overallProgress: number;
    agents: AgentWorkStatusData[];
  };
}

export interface SessionUnsubscribedResponse {
  success: boolean;
  sessionId: string;
}

export interface JoinedProjectResponse {
  success: boolean;
  projectId: string;
}

export interface LeftProjectResponse {
  success: boolean;
  projectId: string;
}

// ============ 服务器推送事件 ============

export type SessionStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
export type AgentType = 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
export type DecisionImportance = 'high' | 'medium' | 'low';
export type CollaborationType = 'data_transfer' | 'dependency_trigger' | 'validation_request' | 'approval_request';
export type ErrorType = 'network_timeout' | 'api_rate_limit' | 'service_unavailable' | 'decision_generation_failed' | 'dependency_missing' | 'data_validation_error' | 'unknown';
export type ErrorCategory = 'minor' | 'critical';
export type RetryStrategy = 'auto_retry' | 'manual_retry' | 'no_retry';

export interface AgentWorkStatusData {
  agentId: string;
  agentType: AgentType;
  status: AgentStatus;
  currentTask: string;
  progress: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  retryCount: number;
}

export interface AgentStatusUpdateEvent extends AgentWorkStatusData {
  sessionId: string;
  previousStatus?: AgentStatus;
  timestamp: string;
  metadata?: {
    estimatedRemainingTime?: number;
    [key: string]: any;
  };
}

export interface DecisionAlternative {
  name: string;
  pros: string[];
  cons: string[];
}

export interface DecisionImpact {
  area: string;
  description: string;
  severity: 'positive' | 'neutral' | 'negative';
}

export interface DecisionCreatedEvent {
  sessionId: string;
  decisionId: string;
  agentId: string;
  agentType: AgentType;
  title: string;
  importance: DecisionImportance;
  reasoning: string;
  fullReasoning?: string;
  alternatives?: DecisionAlternative[];
  selectedReason?: string;
  impacts?: DecisionImpact[];
  timestamp: string;
  hasPreview: boolean;
  previewType?: 'image' | 'html' | 'json';
  previewUrl?: string;
  metadata?: {
    tags?: string[];
    relatedDecisions?: string[];
    [key: string]: any;
  };
}

export interface CollaborationEventData {
  sessionId: string;
  eventId: string;
  sourceAgentId: string;
  sourceAgentType: AgentType;
  targetAgentId: string;
  targetAgentType: AgentType;
  collaborationType: CollaborationType;
  dataType: string;
  dataSummary: string;
  dataSize?: number;
  timestamp: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface ErrorOccurredEvent {
  sessionId: string;
  errorId: string;
  agentId: string;
  agentType: AgentType;
  errorType: ErrorType;
  errorCategory: ErrorCategory;
  errorMessage: string;
  technicalDetails?: string;
  stackTrace?: string;
  retryStrategy: RetryStrategy;
  currentRetryCount: number;
  maxRetryCount: number;
  nextRetryDelay?: number;
  suggestedActions: string[];
  timestamp: string;
  metadata?: {
    affectedComponents?: string[];
    [key: string]: any;
  };
}

export interface Artifact {
  type: string;
  name: string;
  url: string;
}

export interface SessionCompletedEvent {
  sessionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime: string;
  totalDuration: number;
  summary: {
    totalAgents: number;
    completedAgents: number;
    failedAgents: number;
    skippedAgents: number;
    totalDecisions: number;
    totalCollaborations: number;
    totalErrors: number;
  };
  artifacts?: Artifact[];
  nextSteps?: string[];
  timestamp: string;
  metadata?: {
    [key: string]: any;
  };
}

// ============ 事件映射类型 ============

export interface ServerToClientEvents {
  // 连接管理
  'session-subscribed': (data: SessionSubscribedResponse) => void;
  'session-unsubscribed': (data: SessionUnsubscribedResponse) => void;
  'joined-project': (data: JoinedProjectResponse) => void;
  'left-project': (data: LeftProjectResponse) => void;

  // 实时推送
  'agent-status-update': (data: AgentStatusUpdateEvent) => void;
  'decision-created': (data: DecisionCreatedEvent) => void;
  'collaboration-event': (data: CollaborationEventData) => void;
  'error-occurred': (data: ErrorOccurredEvent) => void;
  'session-completed': (data: SessionCompletedEvent) => void;

  // 错误和警告
  'websocket-error': (error: WebSocketErrorEvent) => void;
  'rate-limit-warning': (warning: RateLimitWarningEvent) => void;
}

export interface ClientToServerEvents {
  'subscribe-session': (data: SubscribeSessionRequest) => void;
  'unsubscribe-session': (data: UnsubscribeSessionRequest) => void;
  'join-project': (data: JoinProjectRequest) => void;
  'leave-project': (data: LeaveProjectRequest) => void;
  'retry-agent': (data: RetryAgentRequest) => void;
  'skip-agent': (data: SkipAgentRequest) => void;
  'terminate-session': (data: TerminateSessionRequest) => void;
}

export interface WebSocketErrorEvent {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface RateLimitWarningEvent {
  message: string;
  currentRate: number;
  limit: number;
  resetIn: number; // 秒
  timestamp: string;
}
```

---

## 错误处理

### 服务器错误事件

服务器在发生错误时推送 `websocket-error` 事件：

```typescript
socket.on('websocket-error', (error: WebSocketErrorEvent) => {
  console.error('WebSocket错误:', error.message);

  switch (error.code) {
    case 'SESSION_NOT_FOUND':
      showErrorToast('会话不存在或已过期');
      break;
    case 'UNAUTHORIZED':
      showErrorToast('认证失败，请重新登录');
      redirectToLogin();
      break;
    case 'SUBSCRIPTION_FAILED':
      showErrorToast('订阅失败，请重试');
      break;
    default:
      showErrorToast('发生未知错误');
  }
});
```

### 速率限制警告

当客户端接近速率限制时，服务器推送警告：

```typescript
socket.on('rate-limit-warning', (warning: RateLimitWarningEvent) => {
  console.warn('接近速率限制:', warning);
  showWarningToast(`请求过于频繁，将在${warning.resetIn}秒后重置`);
});
```

---

## 重连策略

### 自动重连配置

Socket.IO客户端内置自动重连机制：

```typescript
const socket = io('http://localhost:3001', {
  reconnection: true, // 启用自动重连
  reconnectionAttempts: 5, // 最多尝试5次
  reconnectionDelay: 1000, // 初始延迟1秒
  reconnectionDelayMax: 5000, // 最大延迟5秒
  randomizationFactor: 0.5, // 延迟随机化因子
});
```

### 重连事件处理

```typescript
let reconnectAttempts = 0;

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`尝试重连 (${attemptNumber}/5)...`);
  reconnectAttempts = attemptNumber;
  showReconnectingStatus(attemptNumber);
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`重连成功 (尝试了${attemptNumber}次)`);
  reconnectAttempts = 0;
  hideReconnectingStatus();

  // 重新订阅之前的会话
  const activeSessionId = getActiveSessionId();
  if (activeSessionId) {
    socket.emit('subscribe-session', { sessionId: activeSessionId });
  }
});

socket.on('reconnect_failed', () => {
  console.error('重连失败，已达到最大重试次数');
  showErrorModal({
    title: '连接失败',
    message: '无法连接到服务器，请检查网络连接或刷新页面重试',
    actions: [
      { label: '刷新页面', onClick: () => window.location.reload() },
      { label: '稍后重试', onClick: () => closeModal() },
    ],
  });
});
```

### 手动重连

```typescript
function manualReconnect() {
  if (socket.disconnected) {
    socket.connect();
  }
}
```

---

## 性能优化

### 客户端节流处理

对高频更新事件进行节流，避免过度渲染：

```typescript
import { throttle } from 'lodash';

// 节流处理Agent状态更新（最多每300ms更新一次UI）
const handleAgentStatusUpdate = throttle(
  (data: AgentStatusUpdateEvent) => {
    updateAgentCard(data.agentId, data);
  },
  300,
  { leading: true, trailing: true }
);

socket.on('agent-status-update', handleAgentStatusUpdate);
```

### 批量更新

如果在短时间内收到多个更新，可以批量处理：

```typescript
const updateQueue: AgentStatusUpdateEvent[] = [];
let batchTimeout: NodeJS.Timeout | null = null;

socket.on('agent-status-update', (data: AgentStatusUpdateEvent) => {
  updateQueue.push(data);

  if (batchTimeout) clearTimeout(batchTimeout);

  batchTimeout = setTimeout(() => {
    // 批量更新UI
    batchUpdateAgentCards(updateQueue);
    updateQueue.length = 0;
  }, 200);
});
```

### 心跳检测

Socket.IO内置心跳检测（ping/pong），无需手动实现：

```typescript
socket.on('ping', () => {
  console.log('收到服务器心跳');
});

socket.on('pong', (latency) => {
  console.log(`延迟: ${latency}ms`);
  updateConnectionStatus(latency);
});
```

---

## 完整集成示例

```typescript
// src/services/websocket.service.ts

import { io, Socket } from 'socket.io-client';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  AgentStatusUpdateEvent,
  DecisionCreatedEvent,
  CollaborationEventData,
  ErrorOccurredEvent,
  SessionCompletedEvent,
} from '../types/websocket-events';

class WebSocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private activeSessionId: string | null = null;

  connect(token: string) {
    this.socket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeSession(sessionId: string) {
    if (!this.socket) throw new Error('WebSocket not connected');

    this.activeSessionId = sessionId;
    this.socket.emit('subscribe-session', { sessionId });
  }

  unsubscribeSession(sessionId: string) {
    if (!this.socket) return;

    this.socket.emit('unsubscribe-session', { sessionId });
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // 连接事件
    this.socket.on('connect', () => {
      console.log('WebSocket已连接');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('WebSocket已断开:', reason);
    });

    // 订阅响应
    this.socket.on('session-subscribed', (data) => {
      console.log('已订阅会话:', data.sessionId);
      // 触发状态更新
      this.handleInitialState(data.currentState);
    });

    // Agent状态更新
    this.socket.on('agent-status-update', this.handleAgentStatusUpdate);

    // 决策创建
    this.socket.on('decision-created', this.handleDecisionCreated);

    // 协作事件
    this.socket.on('collaboration-event', this.handleCollaborationEvent);

    // 错误事件
    this.socket.on('error-occurred', this.handleErrorOccurred);

    // 会话完成
    this.socket.on('session-completed', this.handleSessionCompleted);

    // WebSocket错误
    this.socket.on('websocket-error', (error) => {
      console.error('WebSocket错误:', error);
    });
  }

  private handleInitialState(state: any) {
    // 更新UI显示初始状态
    console.log('初始状态:', state);
  }

  private handleAgentStatusUpdate = (data: AgentStatusUpdateEvent) => {
    console.log('Agent状态更新:', data);
    // 触发UI更新
  };

  private handleDecisionCreated = (data: DecisionCreatedEvent) => {
    console.log('新决策:', data);
    // 根据重要性显示通知
  };

  private handleCollaborationEvent = (data: CollaborationEventData) => {
    console.log('协作事件:', data);
    // 显示协作动画
  };

  private handleErrorOccurred = (data: ErrorOccurredEvent) => {
    console.error('Agent错误:', data);
    // 显示错误处理UI
  };

  private handleSessionCompleted = (data: SessionCompletedEvent) => {
    console.log('会话完成:', data);
    // 显示完成摘要
  };
}

export const websocketService = new WebSocketService();
```

---

## 安全和认证

### JWT Token验证

服务器在握手时验证JWT token：

```typescript
// 服务器端（backend/src/index.ts）
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication token missing'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.userId = decoded.userId;
    next();
  } catch (err) {
    return next(new Error('Invalid authentication token'));
  }
});
```

### 房间隔离

用户只能订阅自己有权限的会话：

```typescript
// 服务器端
socket.on('subscribe-session', async (data) => {
  const { sessionId } = data;
  const userId = socket.data.userId;

  // 验证用户是否有权限访问该会话
  const hasPermission = await checkUserSessionPermission(userId, sessionId);

  if (!hasPermission) {
    socket.emit('websocket-error', {
      code: 'FORBIDDEN',
      message: '无权限访问该会话',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 加入会话房间
  socket.join(`session-${sessionId}`);

  // 发送当前状态
  const currentState = await getSessionState(sessionId);
  socket.emit('session-subscribed', {
    success: true,
    sessionId,
    currentState,
  });
});
```

---

## 总结

本WebSocket事件规范定义了AI思考过程可视化系统的完整实时通信协议，涵盖：

- **连接管理**: 建立连接、加入/离开房间、订阅/取消订阅
- **5种核心推送事件**: Agent状态更新、决策创建、协作事件、错误处理、会话完成
- **混合更新频率策略**: 200ms-2s根据Agent优先级动态调整
- **完整TypeScript类型定义**: 类型安全的前后端通信
- **错误处理和重连**: 自动重连、错误恢复、速率限制
- **性能优化**: 节流、批量更新、心跳检测
- **安全认证**: JWT验证、房间隔离

前端团队可直接使用此规范实现WebSocket客户端，后端团队可根据此规范实现服务器推送逻辑。
