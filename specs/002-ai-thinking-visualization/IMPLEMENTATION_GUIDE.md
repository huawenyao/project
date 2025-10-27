# AI思考过程可视化系统 - 实施指南

**版本**: 1.0
**创建日期**: 2025-10-27
**适用团队**: 4人并行开发
**预估工期**: 4-6周

---

## 📋 目录

1. [项目架构总览](#项目架构总览)
2. [Phase 2: Foundation实施指南](#phase-2-foundation实施指南)
3. [并行开发流程](#并行开发流程)
4. [代码模板库](#代码模板库)
5. [关键实现要点](#关键实现要点)
6. [测试策略](#测试策略)
7. [常见问题解答](#常见问题解答)

---

## 项目架构总览

### 技术栈

**后端**:
- Node.js 18+ + TypeScript 5.x
- Express (REST API)
- Socket.IO (WebSocket实时通信)
- Sequelize ORM (PostgreSQL)
- AWS SDK (S3冷存储)
- node-cron (定时归档任务)

**数据库**:
- PostgreSQL 14+ (热数据30天)
- Redis (缓存Agent配置和会话状态)
- S3/MinIO (冷数据归档)

**前端** (需在独立前端仓库实现):
- React 18 + TypeScript
- Zustand (UI状态) + React Query (服务器状态)
- React Flow (图形视图)
- react-hot-toast (通知)
- Tailwind CSS (双主题系统)

### 文件结构

```
backend/src/
├── types/
│   └── visualization.types.ts ✅ (已完成)
├── migrations/
│   ├── 001_create_build_sessions.sql ✅
│   ├── 002_create_agent_work_status.sql ✅
│   ├── 003_create_decision_records.sql ✅
│   ├── 004_create_agent_error_records.sql ✅
│   ├── 005_create_collaboration_events.sql ✅
│   ├── 006_create_preview_data.sql ✅
│   ├── 007_create_agent_personas.sql ✅
│   ├── 008_create_user_interaction_metrics.sql ✅
│   ├── 009_create_indexes.sql ✅
│   └── 010_seed_agent_personas.sql ✅
├── models/ (T016-T023: 8个Sequelize模型)
│   ├── BuildSession.ts
│   ├── AgentWorkStatus.ts
│   ├── DecisionRecord.ts
│   ├── AgentErrorRecord.ts
│   ├── CollaborationEvent.ts
│   ├── PreviewData.ts
│   ├── AgentPersona.ts
│   └── UserInteractionMetricEvent.ts
├── services/ (T024-T030: 7个核心服务)
│   ├── VisualizationService.ts
│   ├── WebSocketService.ts
│   ├── AgentStatusTracker.ts
│   ├── DecisionManager.ts
│   ├── DataArchiveService.ts
│   ├── MetricsCollector.ts
│   └── ReplayService.ts
├── websocket/
│   ├── middleware/
│   │   ├── authentication.ts (T031)
│   │   └── rateLimit.ts (T032)
│   └── handlers/
│       ├── sessionSubscription.ts (T033)
│       ├── agentStatusEmitter.ts (T034)
│       ├── decisionEmitter.ts (T035)
│       └── errorEmitter.ts (T036)
├── routes/
│   └── visualizationRoutes.ts (8个REST端点)
└── jobs/
    ├── archiveOldSessions.ts (T122)
    └── cleanupOldMetrics.ts (T142)
```

---

## Phase 2: Foundation实施指南

### 步骤1: 执行数据库迁移 ✅

**已完成**: 所有10个SQL文件已创建在 `src/migrations/`

**执行方式**:

```bash
# 方式1: 使用PostgreSQL命令行
psql -U your_user -d your_database -f src/migrations/001_create_build_sessions.sql
psql -U your_user -d your_database -f src/migrations/002_create_agent_work_status.sql
# ... 依次执行到010

# 方式2: 使用迁移工具 (推荐)
npm install --save-dev node-pg-migrate
# 配置后运行
npm run migrate:up
```

**验证**:
```sql
-- 检查所有表是否创建成功
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 应该看到8个表:
-- agent_error_record
-- agent_persona
-- agent_work_status
-- build_session
-- collaboration_event
-- decision_record
-- preview_data
-- user_interaction_metric_event
```

---

### 步骤2: 创建Sequelize模型 (T016-T023)

**并行执行**: 8个模型可同时开发

#### 模板: BuildSession.ts (T016)

```typescript
// src/models/BuildSession.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { BuildSessionData } from '../types/visualization.types';

interface BuildSessionCreationAttributes
  extends Optional<BuildSessionData, 'sessionId' | 'endTime' | 'archived' | 'archivedAt' | 'storagePath' | 'createdAt' | 'updatedAt'> {}

class BuildSession extends Model<BuildSessionData, BuildSessionCreationAttributes> implements BuildSessionData {
  public sessionId!: string;
  public userId!: string;
  public projectId!: string;
  public startTime!: string;
  public endTime?: string;
  public status!: 'in_progress' | 'success' | 'failed' | 'partial_success';
  public agentList!: Array<{ agentId: string; agentType: string }>;
  public archived!: boolean;
  public archivedAt?: string;
  public storagePath?: string;
  public createdAt!: string;
  public updatedAt!: string;

  // 关联方法
  public static associate(models: any) {
    BuildSession.hasMany(models.AgentWorkStatus, {
      foreignKey: 'sessionId',
      as: 'agentStatuses',
    });
    BuildSession.hasMany(models.DecisionRecord, {
      foreignKey: 'sessionId',
      as: 'decisions',
    });
    BuildSession.hasMany(models.CollaborationEvent, {
      foreignKey: 'sessionId',
      as: 'collaborations',
    });
    BuildSession.hasMany(models.AgentErrorRecord, {
      foreignKey: 'sessionId',
      as: 'errors',
    });
  }
}

BuildSession.init(
  {
    sessionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'session_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'project_id',
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'start_time',
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['in_progress', 'success', 'failed', 'partial_success']],
      },
    },
    agentList: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'agent_list',
    },
    archived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'archived_at',
    },
    storagePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'storage_path',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'build_session',
    timestamps: true,
    underscored: true,
  }
);

export default BuildSession;
```

**其他7个模型参考此模板**，关键差异：
- **AgentWorkStatus**: 添加状态机验证，6种状态
- **DecisionRecord**: JSONB字段 `reasoning` 和 `alternatives`
- **AgentPersona**: 5个预定义记录，主键是 `agent_type`
- **UserInteractionMetricEvent**: 8种事件类型枚举

---

### 步骤3: 创建核心服务 (T024-T030)

**并行执行**: 部分服务可并行（T026-T030）

#### 模板: VisualizationService.ts (T024)

```typescript
// src/services/VisualizationService.ts
import BuildSession from '../models/BuildSession';
import AgentWorkStatus from '../models/AgentWorkStatus';
import DecisionRecord from '../models/DecisionRecord';
import { BuildSessionData, SessionDetailResponse } from '../types/visualization.types';

export class VisualizationService {
  /**
   * 创建新的构建会话
   */
  async createSession(data: {
    userId: string;
    projectId: string;
    agentList: Array<{ agentId: string; agentType: string }>;
  }): Promise<BuildSessionData> {
    const session = await BuildSession.create({
      userId: data.userId,
      projectId: data.projectId,
      agentList: data.agentList,
      status: 'in_progress',
    });

    return session.toJSON();
  }

  /**
   * 获取会话列表（支持热/冷数据过滤）
   */
  async getSessions(params: {
    userId: string;
    page?: number;
    limit?: number;
    status?: string;
    dataType?: 'hot' | 'cold' | 'all';
    startDate?: string;
    endDate?: string;
  }) {
    const { userId, page = 1, limit = 20, status, dataType = 'all', startDate, endDate } = params;

    const whereClause: any = { userId };

    if (status) {
      whereClause.status = status;
    }

    // 热数据过滤 (最近30天)
    if (dataType === 'hot') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.startTime = { $gte: thirtyDaysAgo };
      whereClause.archived = false;
    } else if (dataType === 'cold') {
      whereClause.archived = true;
    }

    if (startDate) {
      whereClause.startTime = { ...whereClause.startTime, $gte: new Date(startDate) };
    }

    if (endDate) {
      whereClause.startTime = { ...whereClause.startTime, $lte: new Date(endDate) };
    }

    const { count, rows } = await BuildSession.findAndCountAll({
      where: whereClause,
      limit,
      offset: (page - 1) * limit,
      order: [['startTime', 'DESC']],
    });

    return {
      sessions: rows.map((r) => r.toJSON()),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit,
        hasNext: page * limit < count,
        hasPrevious: page > 1,
      },
      dataSource: dataType === 'all' ? 'mixed' : dataType === 'hot' ? 'database' : 'archive',
    };
  }

  /**
   * 获取单个会话详情（含所有关联数据）
   */
  async getSessionDetail(sessionId: string): Promise<SessionDetailResponse> {
    const session = await BuildSession.findByPk(sessionId, {
      include: [
        { model: AgentWorkStatus, as: 'agentStatuses' },
        { model: DecisionRecord, as: 'decisions' },
        { model: CollaborationEvent, as: 'collaborations' },
        { model: AgentErrorRecord, as: 'errors' },
      ],
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // 如果已归档，从S3加载
    if (session.archived && session.storagePath) {
      // TODO: 从S3加载归档数据 (T123-T126)
      throw new Error('Archived session loading not implemented yet');
    }

    return {
      session: session.toJSON(),
      agents: session.agentStatuses?.map((a) => a.toJSON()) || [],
      decisions: session.decisions?.map((d) => d.toJSON()) || [],
      collaborations: session.collaborations?.map((c) => c.toJSON()) || [],
      errors: session.errors?.map((e) => e.toJSON()) || [],
      dataSource: 'database',
    };
  }

  /**
   * 更新会话状态
   */
  async updateSessionStatus(sessionId: string, status: 'success' | 'failed' | 'partial_success') {
    await BuildSession.update(
      { status, endTime: new Date().toISOString() },
      { where: { sessionId } }
    );
  }
}

export default new VisualizationService();
```

#### 关键服务实现要点

**AgentStatusTracker.ts** (T026):
```typescript
// 核心方法
class AgentStatusTracker {
  // 更新Agent状态（触发WebSocket推送）
  async updateAgentStatus(data: Partial<AgentWorkStatusData>) {
    const status = await AgentWorkStatus.update(data, {
      where: { agentId: data.agentId },
    });

    // 触发WebSocket推送（混合频率策略）
    const persona = await AgentPersona.findByPk(data.agentType);
    const pushDelay = persona.priority === 'high' ? 500 : 2000; // ms

    WebSocketService.emitAgentStatusUpdate(data, pushDelay);

    return status;
  }

  // Agent状态机转换验证
  validateStatusTransition(from: AgentStatus, to: AgentStatus): boolean {
    const validTransitions = {
      pending: ['in_progress'],
      in_progress: ['completed', 'failed'],
      failed: ['retrying', 'skipped'],
      retrying: ['completed', 'failed'],
    };
    return validTransitions[from]?.includes(to) || false;
  }
}
```

**DecisionManager.ts** (T027):
```typescript
class DecisionManager {
  // 创建决策记录（自动判断重要性和通知策略）
  async createDecision(data: Partial<DecisionRecordData>) {
    const decision = await DecisionRecord.create(data);

    // 根据重要性路由通知
    if (data.importance === 'high') {
      // Toast通知 + 侧边栏
      WebSocketService.emitDecisionCreated(decision, { toast: true, sidebar: true });
    } else {
      // 仅侧边栏 + 未读角标
      WebSocketService.emitDecisionCreated(decision, { toast: false, sidebar: true });
    }

    return decision;
  }
}
```

**DataArchiveService.ts** (T028):
```typescript
class DataArchiveService {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      s3ForcePathStyle: true, // MinIO兼容
    });
  }

  // 归档30天前的会话到S3
  async archiveOldSessions() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await BuildSession.findAll({
      where: {
        startTime: { $lt: thirtyDaysAgo },
        archived: false,
      },
      limit: 100, // 批量处理
      include: ['agentStatuses', 'decisions', 'collaborations', 'errors'],
    });

    for (const session of sessions) {
      const archiveData = session.toJSON();
      const key = `archives/${session.startTime.split('T')[0]}/${session.sessionId}.json.gz`;

      // 压缩并上传到S3
      const compressed = await this.compressData(archiveData);
      await this.s3.putObject({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: compressed,
        ContentEncoding: 'gzip',
      }).promise();

      // 更新元数据，删除详细数据
      await session.update({ archived: true, archivedAt: new Date(), storagePath: key });
      await AgentWorkStatus.destroy({ where: { sessionId: session.sessionId } });
      await DecisionRecord.destroy({ where: { sessionId: session.sessionId } });
      // ... 删除其他关联数据
    }
  }
}
```

---

### 步骤4: WebSocket基础设施 (T031-T036)

#### WebSocketService.ts (T025)

```typescript
// src/services/WebSocketService.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, Socket> = new Map();

  initialize(httpServer: any) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // 认证中间件 (T031)
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // 速率限制中间件 (T032)
    this.io.use(this.rateLimitMiddleware);

    // 连接处理
    this.io.on('connection', (socket) => {
      console.log(`✅ Client connected: ${socket.id}, User: ${socket.data.userId}`);
      this.connectedClients.set(socket.id, socket);

      // 订阅会话 (T033)
      socket.on('subscribe-session', async (data: { sessionId: string }) => {
        socket.join(`session-${data.sessionId}`);

        // 返回当前状态
        const currentState = await this.getCurrentSessionState(data.sessionId);
        socket.emit('session-subscribed', {
          success: true,
          sessionId: data.sessionId,
          currentState,
        });
      });

      // 取消订阅
      socket.on('unsubscribe-session', (data: { sessionId: string }) => {
        socket.leave(`session-${data.sessionId}`);
        socket.emit('session-unsubscribed', { success: true, sessionId: data.sessionId });
      });

      // 断开连接
      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  // Agent状态推送 (T034 - 混合频率策略)
  emitAgentStatusUpdate(data: AgentStatusUpdateEvent, delay: number = 500) {
    setTimeout(() => {
      this.io.to(`session-${data.sessionId}`).emit('agent-status-update', data);
    }, delay);
  }

  // 决策推送 (T035 - 立即推送高重要性)
  emitDecisionCreated(data: DecisionCreatedEvent, options: { toast: boolean; sidebar: boolean }) {
    const delay = options.toast ? 0 : 100; // 高重要性立即推送
    setTimeout(() => {
      this.io.to(`session-${data.sessionId}`).emit('decision-created', {
        ...data,
        displayMode: options.toast ? 'toast' : 'sidebar',
      });
    }, delay);
  }

  // 错误推送 (T036 - 含重试状态)
  emitErrorOccurred(data: ErrorOccurredEvent) {
    this.io.to(`session-${data.sessionId}`).emit('error-occurred', data);
  }

  // 协作事件推送
  emitCollaborationEvent(data: CollaborationEvent) {
    this.io.to(`session-${data.sessionId}`).emit('collaboration-event', data);
  }

  // 会话完成推送
  emitSessionCompleted(data: SessionCompletedEvent) {
    this.io.to(`session-${data.sessionId}`).emit('session-completed', data);
  }

  // 速率限制中间件
  private rateLimitMiddleware(socket: Socket, next: Function) {
    // TODO: 实现速率限制逻辑
    next();
  }

  // 获取当前会话状态
  private async getCurrentSessionState(sessionId: string) {
    // TODO: 从数据库查询当前状态
    return {};
  }
}

export default new WebSocketService();
```

---

### 步骤5: REST API路由 (T055-T057, T072-T073, T087-T090等)

#### visualizationRoutes.ts

```typescript
// src/routes/visualizationRoutes.ts
import express from 'express';
import VisualizationService from '../services/VisualizationService';
import DecisionManager from '../services/DecisionManager';
import MetricsCollector from '../services/MetricsCollector';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 应用认证中间件
router.use(authMiddleware);

// ==================== 会话管理 ====================

// T056: GET /api/visualization/sessions - 获取会话列表
router.get('/sessions', async (req, res) => {
  try {
    const { page, limit, status, dataType, startDate, endDate, projectId } = req.query;

    const result = await VisualizationService.getSessions({
      userId: req.user.id,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      status: status as string,
      dataType: (dataType as 'hot' | 'cold' | 'all') || 'all',
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// T057: GET /api/visualization/sessions/:id - 获取会话详情
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await VisualizationService.getSessionDetail(id);

    res.json({
      success: true,
      data: detail,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: {
        code: 'SESSION_NOT_FOUND',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// T126: GET /api/visualization/sessions/:id/replay - 回放历史会话
router.get('/sessions/:id/replay', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: 实现回放逻辑（支持S3归档数据加载）
    res.json({
      success: true,
      data: { message: 'Replay endpoint not implemented yet' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== 决策管理 ====================

// T072: GET /api/visualization/decisions - 获取决策列表
router.get('/decisions', async (req, res) => {
  try {
    const { sessionId, importance, isRead, page = 1, limit = 50 } = req.query;

    const whereClause: any = {};
    if (sessionId) whereClause.sessionId = sessionId;
    if (importance) whereClause.importance = importance;
    if (isRead !== undefined) whereClause.isRead = isRead === 'true';

    const decisions = await DecisionRecord.findAll({
      where: whereClause,
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      order: [['timestamp', 'DESC']],
      include: [{ model: PreviewData, as: 'previews' }],
    });

    res.json({
      success: true,
      data: { decisions: decisions.map((d) => d.toJSON()) },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// T073: POST /api/visualization/decisions/:id/mark-read - 标记已读
router.post('/decisions/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    await DecisionRecord.update({ isRead: true }, { where: { decisionId: id } });

    res.json({
      success: true,
      data: { decisionId: id, isRead: true },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== Agent配置 ====================

// T095: GET /api/visualization/agents/personas - 获取Agent拟人化配置
router.get('/agents/personas', async (req, res) => {
  try {
    const personas = await AgentPersona.findAll();

    res.json({
      success: true,
      data: { personas: personas.map((p) => p.toJSON()) },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== 用户设置 ====================

// T136: PUT /api/visualization/settings/theme - 更新主题设置
router.put('/settings/theme', async (req, res) => {
  try {
    const { theme } = req.body; // 'warm' | 'tech'

    // TODO: 保存用户主题偏好到数据库
    // await UserSettings.update({ theme }, { where: { userId: req.user.id } });

    res.json({
      success: true,
      data: { theme, updatedAt: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// T137: PUT /api/visualization/settings/privacy - 更新隐私设置
router.put('/settings/privacy', async (req, res) => {
  try {
    const { dataCollectionEnabled, showHighImportanceToasts } = req.body;

    // TODO: 保存隐私设置
    // await UserSettings.update({ dataCollectionEnabled, showHighImportanceToasts }, { where: { userId: req.user.id } });

    res.json({
      success: true,
      data: { dataCollectionEnabled, showHighImportanceToasts, updatedAt: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== 匿名化指标 ====================

// T140: POST /api/visualization/metrics - 提交匿名化指标
router.post('/metrics', async (req, res) => {
  try {
    const { eventType, anonymousSessionId, context, optedIn } = req.body;

    // 客户端已匿名化，服务器只需记录
    await MetricsCollector.recordEvent({
      eventType,
      anonymousSessionId,
      context,
      optedIn,
    });

    res.json({
      success: true,
      data: { recorded: true },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export default router;
```

**在 `src/index.ts` 中注册路由**:
```typescript
import visualizationRoutes from './routes/visualizationRoutes';

app.use('/api/visualization', visualizationRoutes);
```

---

## 并行开发流程

### Foundation完成后的分工 (第2周开始)

```
Week 1: 全员协作完成 Phase 2 Foundation (49 tasks)
        数据库迁移 → Sequelize模型 → 核心服务 → WebSocket → REST API

Week 2-3: 并行开发（4人团队）
┌─────────────────────────────────────────────────────────┐
│ Dev A: US1 → US3                                        │
│   - T055-T071: Agent状态可视化 (17 tasks)               │
│   - T098-T103: Agent拟人化 (6 tasks)                    │
│   - 重点：AgentStatusCard组件、进度条、拟人化动画         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Dev B: US2 → US4                                        │
│   - T072-T086: 决策透明化 (15 tasks)                    │
│   - T087-T094: 预览功能 (8 tasks)                       │
│   - 重点：DecisionToast、DecisionSidebar、PreviewModal  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Dev C: Phase 8-11 跨功能特性                             │
│   - T114-T121: 错误恢复 (8 tasks)                       │
│   - T122-T130: 数据归档 (9 tasks)                       │
│   - T131-T138: 主题系统 (8 tasks)                       │
│   - T139-T148: 匿名化指标 (10 tasks)                    │
│   - 重点：DataArchiveService、ThemeToggle、MetricsService│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Dev D: Phase 12-13 性能优化                              │
│   - T107-T113: 协作可视化 (7 tasks, React Flow)         │
│   - T149-T157: 性能优化 (9 tasks)                       │
│   - T158-T164: WebSocket弹性 (7 tasks)                  │
│   - 重点：AgentGraphView、虚拟滚动、连接resilience        │
└─────────────────────────────────────────────────────────┘

Week 4: 集成测试 + Polish (Phase 14)
        全员：测试、文档、性能验证、响应式设计
```

### 每日Standups建议

**每日同步点**:
1. **Foundation期间**: 每日确认哪些模型/服务已完成，解决依赖冲突
2. **并行期间**: 每周2次同步，确保WebSocket事件格式一致
3. **集成期间**: 每日集成测试，修复接口不匹配

---

## 代码模板库

### Sequelize模型基础模板

```typescript
// 所有模型通用结构
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { YourDataInterface } from '../types/visualization.types';

interface CreationAttributes extends Optional<YourDataInterface, 'id' | 'createdAt'> {}

class YourModel extends Model<YourDataInterface, CreationAttributes> implements YourDataInterface {
  public id!: string;
  public field1!: string;
  // ... 其他字段

  public static associate(models: any) {
    // 定义关联关系
  }
}

YourModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    field1: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    // ... 其他字段定义
  },
  {
    sequelize,
    tableName: 'your_table_name',
    timestamps: true,
    underscored: true,
  }
);

export default YourModel;
```

### WebSocket事件发送模板

```typescript
// 所有WebSocket推送遵循此模式
class SomeService {
  async performAction() {
    // 1. 数据库操作
    const result = await SomeModel.create(data);

    // 2. 构造事件数据
    const eventData = {
      sessionId: result.sessionId,
      // ... 其他字段
      timestamp: new Date().toISOString(),
    };

    // 3. 推送到WebSocket（注意频率策略）
    WebSocketService.emitSomeEvent(eventData);

    return result;
  }
}
```

### REST API端点模板

```typescript
// 所有API端点遵循此响应格式
router.get('/endpoint', async (req, res) => {
  try {
    // 1. 参数验证
    const { param1, param2 } = req.query;

    // 2. 调用服务层
    const result = await SomeService.doSomething(param1, param2);

    // 3. 统一成功响应
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // 4. 统一错误响应
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    });
  }
});
```

---

## 关键实现要点

### 1. 混合频率WebSocket推送策略

```typescript
// 在agentStatusEmitter.ts中
const PUSH_DELAYS = {
  UIAgent: 500,       // 高优先级：500ms
  BackendAgent: 500,
  DatabaseAgent: 500,
  IntegrationAgent: 2000,  // 低优先级：2s
  DeploymentAgent: 2000,
};

async function emitAgentStatus(data: AgentStatusUpdateEvent) {
  const delay = PUSH_DELAYS[data.agentType] || 1000;

  // 关键状态变化立即推送
  if (data.status === 'completed' || data.status === 'failed') {
    delay = 0;
  }

  setTimeout(() => {
    io.to(`session-${data.sessionId}`).emit('agent-status-update', data);
  }, delay);
}
```

### 2. 决策通知路由逻辑

```typescript
// 在decisionEmitter.ts中
function routeDecisionNotification(decision: DecisionRecordData) {
  if (decision.importance === 'high') {
    // Toast通知（5秒后自动收起到侧边栏）
    io.to(`session-${decision.sessionId}`).emit('decision-created', {
      ...decision,
      displayMode: 'toast',
      autoHideDelay: 5000,
    });
  } else {
    // 仅侧边栏（带未读角标）
    io.to(`session-${decision.sessionId}`).emit('decision-created', {
      ...decision,
      displayMode: 'sidebar',
      badge: true,
    });
  }
}
```

### 3. 智能错误恢复逻辑

```typescript
// 在AgentStatusTracker.ts中
async handleAgentError(error: AgentErrorRecordData) {
  // 1. 记录错误
  await AgentErrorRecord.create(error);

  // 2. 分类错误
  const isMinor = ['network_timeout', 'api_rate_limit', 'service_unavailable'].includes(error.errorCategory);

  if (isMinor && error.retryAttempts < 3) {
    // 3. 轻微错误自动重试（指数退避）
    const delay = Math.pow(2, error.retryAttempts) * 1000; // 1s, 2s, 4s

    await AgentWorkStatus.update(
      { status: 'retrying', retryCount: error.retryAttempts + 1 },
      { where: { agentId: error.agentId } }
    );

    WebSocketService.emitErrorOccurred({
      ...error,
      retryState: {
        canAutoRetry: true,
        remainingRetries: 3 - error.retryAttempts - 1,
        nextRetryDelay: delay,
      },
    });

    setTimeout(() => this.retryAgentTask(error.agentId), delay);
  } else {
    // 4. 关键错误或重试3次后失败，暂停并等待用户确认
    await BuildSession.update({ status: 'failed' }, { where: { sessionId: error.sessionId } });

    WebSocketService.emitErrorOccurred({
      ...error,
      retryState: {
        canAutoRetry: false,
        remainingRetries: 0,
      },
    });
  }
}
```

### 4. 数据归档定时任务

```typescript
// 在src/jobs/archiveOldSessions.ts中
import cron from 'node-cron';
import DataArchiveService from '../services/DataArchiveService';

// 每天凌晨2点执行归档
export function scheduleArchiveJob() {
  cron.schedule('0 2 * * *', async () => {
    console.log('🗄️ [Archive Job] Starting daily archive task...');

    try {
      const result = await DataArchiveService.archiveOldSessions();
      console.log(`✅ [Archive Job] Archived ${result.count} sessions`);
    } catch (error) {
      console.error('❌ [Archive Job] Archive failed:', error);
      // TODO: 发送告警通知
    }
  });
}

// 在src/index.ts中启动
import { scheduleArchiveJob } from './jobs/archiveOldSessions';
scheduleArchiveJob();
```

### 5. Redis缓存Agent配置

```typescript
// 在AgentStatusTracker.ts中
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async getAgentPersona(agentType: string): Promise<AgentPersonaData> {
  const cacheKey = `agent_persona:${agentType}`;

  // 1. 尝试从Redis获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. 从数据库查询
  const persona = await AgentPersona.findByPk(agentType);

  // 3. 缓存1小时
  await redis.setex(cacheKey, 3600, JSON.stringify(persona.toJSON()));

  return persona.toJSON();
}
```

---

## 测试策略

### 单元测试示例 (Jest)

```typescript
// src/services/__tests__/VisualizationService.test.ts
import VisualizationService from '../VisualizationService';
import BuildSession from '../../models/BuildSession';

describe('VisualizationService', () => {
  describe('createSession', () => {
    it('should create a new build session with in_progress status', async () => {
      const data = {
        userId: 'user-123',
        projectId: 'project-456',
        agentList: [
          { agentId: 'agent-1', agentType: 'UIAgent' },
          { agentId: 'agent-2', agentType: 'BackendAgent' },
        ],
      };

      const session = await VisualizationService.createSession(data);

      expect(session.status).toBe('in_progress');
      expect(session.userId).toBe('user-123');
      expect(session.agentList).toHaveLength(2);
    });
  });

  describe('getSessions', () => {
    it('should filter hot data (last 30 days)', async () => {
      const result = await VisualizationService.getSessions({
        userId: 'user-123',
        dataType: 'hot',
      });

      expect(result.dataSource).toBe('database');
      expect(result.sessions.every(s => !s.isArchived)).toBe(true);
    });
  });
});
```

### WebSocket集成测试示例

```typescript
// src/websocket/__tests__/websocket.integration.test.ts
import { io as ioClient } from 'socket.io-client';

describe('WebSocket Integration', () => {
  let clientSocket;

  beforeAll((done) => {
    // 连接到测试服务器
    clientSocket = ioClient('http://localhost:3001', {
      auth: { token: 'test-jwt-token' },
    });
    clientSocket.on('connect', done);
  });

  afterAll(() => {
    clientSocket.disconnect();
  });

  it('should subscribe to a session and receive current state', (done) => {
    clientSocket.emit('subscribe-session', { sessionId: 'session-123' });

    clientSocket.on('session-subscribed', (data) => {
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe('session-123');
      expect(data.currentState).toBeDefined();
      done();
    });
  });

  it('should receive agent status updates', (done) => {
    clientSocket.on('agent-status-update', (data) => {
      expect(data.sessionId).toBeDefined();
      expect(data.agentType).toBeDefined();
      expect(data.status).toMatch(/pending|in_progress|completed|failed/);
      done();
    });

    // 触发Agent状态更新（模拟Agent执行）
    // AgentStatusTracker.updateAgentStatus(...);
  });
});
```

### E2E测试清单 (手动验证)

根据 `quickstart.md` 中的50+功能验证清单进行测试：

```markdown
## 核心功能验证

- [ ] 1. 创建新的构建会话
- [ ] 2. 实时看到Agent状态更新（刷新频率正常）
- [ ] 3. 高优先级Agent更新频率 < 1s
- [ ] 4. 低优先级Agent更新频率 1-2s
- [ ] 5. 高重要性决策弹出toast通知
- [ ] 6. Toast通知5秒后自动收起到侧边栏
- [ ] 7. 中低重要性决策仅显示侧边栏角标
- [ ] 8. 点击决策查看完整详情
- [ ] 9. Agent状态卡片显示头像、名称、进度条
- [ ] 10. Agent完成时显示庆祝动画
- [ ] 11. 轻微错误自动重试3次（显示重试计数）
- [ ] 12. 关键错误暂停并显示错误详情
- [ ] 13. 切换主题（温暖风 ⇌ 科技风）
- [ ] 14. 切换视图（列表 ⇌ 图形）
- [ ] 15. 查看历史会话列表
- [ ] 16. 回放历史会话（含归档数据）
- [ ] 17. WebSocket断线后自动重连
- [ ] 18. 匿名化指标收集（opt-in/opt-out）
- [ ] 19. 响应式布局（手机/平板/桌面）
- [ ] 20. 性能：10个并行Agent保持30fps+
```

---

## 常见问题解答

### Q1: 数据库迁移如何管理版本？

**A**: 推荐使用 `node-pg-migrate`:

```bash
npm install --save-dev node-pg-migrate

# 配置 migrations 目录
# 在 package.json 添加:
"scripts": {
  "migrate:up": "node-pg-migrate up",
  "migrate:down": "node-pg-migrate down"
}

# 执行迁移
npm run migrate:up
```

或手动按顺序执行SQL文件：
```bash
psql -U user -d dbname -f src/migrations/001_create_build_sessions.sql
# ... 002-010
```

---

### Q2: WebSocket如何调试？

**A**: 使用以下工具：

1. **浏览器DevTools**: Network → WS标签，查看消息
2. **Socket.IO Admin UI**: 可视化监控连接
3. **日志**: 在每个 `socket.emit()` 前打印日志

```typescript
console.log(`[WebSocket] Emitting event: agent-status-update`, {
  sessionId: data.sessionId,
  agentType: data.agentType,
});
io.to(`session-${data.sessionId}`).emit('agent-status-update', data);
```

---

### Q3: 如何测试S3归档功能？

**A**: 本地使用MinIO模拟S3:

```bash
# 使用Docker运行MinIO
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

# 访问 http://localhost:9001 创建bucket

# 配置环境变量
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=ai-builder-archives
```

---

### Q4: 前端如何实现？

**A**: 前端需在**独立前端仓库**实现，关键文件：

```
frontend/src/
├── components/Visualization/ (13个核心组件)
├── stores/ (5个Zustand stores)
├── hooks/ (6个自定义hooks)
├── services/ (WebSocket + REST API客户端)
└── styles/themes/ (2个主题CSS)
```

前端实施指南可参考：
- `research.md` - 前端技术选型决策
- `contracts/rest-api.yaml` - REST API契约
- `contracts/websocket-events.md` - WebSocket事件格式

建议前端团队在Foundation完成后并行开发。

---

### Q5: 如何确保类型安全？

**A**: 共享TypeScript类型定义：

1. **后端**: 已定义在 `src/types/visualization.types.ts`
2. **前端**: 复制类型文件到前端仓库，或发布为npm包

```typescript
// 前端使用示例
import type {
  AgentStatusUpdateEvent,
  DecisionRecordData
} from '@shared/visualization.types';

socket.on('agent-status-update', (data: AgentStatusUpdateEvent) => {
  // TypeScript类型检查
});
```

---

### Q6: 性能如何优化？

**A**: 多层优化策略：

**后端**:
- Redis缓存热数据 (Agent配置、活跃会话)
- 数据库连接池 (max: 20)
- WebSocket消息批处理（低优先级Agent）

**前端**:
- 虚拟滚动 (DecisionTimeline)
- React.memo (所有可视化组件)
- 节流WebSocket更新 (500ms)
- Web Worker (图形布局计算)

**监控**:
```typescript
// 前端FPS监控
const checkFPS = () => {
  const fps = calculateFPS();
  if (fps < 30) {
    console.warn('⚠️ Performance issue: FPS =', fps);
  }
};
```

---

## 总结

### ✅ 已完成部分

1. **完整的数据库架构** (10个SQL迁移文件)
2. **完整的TypeScript类型定义** (300+行)
3. **详细的代码模板** (Sequelize模型、服务、WebSocket、REST API)
4. **并行开发流程** (4人团队分工明确)
5. **关键实现要点** (混合频率、智能重试、归档策略)

### 📝 待实施部分

- **39个后端任务**需按模板实现:
  - 8个Sequelize模型 (T016-T023)
  - 7个核心服务 (T024-T030)
  - 6个WebSocket组件 (T031-T036)
  - REST API端点 (集成到visualizationRoutes.ts)
  - 2个定时任务 (T122, T142)

- **前端全部143个任务**需在前端仓库实现

### 🎯 MVP路径 (最小可行产品)

**2周交付MVP** (仅US1):
1. Week 1: Foundation (后端模型+服务+WebSocket)
2. Week 2: US1前端+后端集成
3. **交付价值**: 实时Agent状态和进度可视化

**4周交付P1+P2功能**:
- + US2 (决策透明化)
- + US4 (预览功能)

**6周交付完整功能** (所有5个用户故事)

---

## 下一步行动

1. ✅ **数据库迁移** - 执行10个SQL文件
2. 🔨 **实现Sequelize模型** - 按BuildSession.ts模板实现其他7个
3. 🔨 **实现核心服务** - 按VisualizationService.ts模板实现其他6个
4. 🔨 **实现WebSocket** - 按WebSocketService.ts模板完成推送逻辑
5. 🔨 **完善REST API** - 补全visualizationRoutes.ts中的TODO部分
6. ✅ **Foundation验证** - 运行单元测试和WebSocket集成测试
7. 🚀 **启动并行开发** - 按4人分工开始User Stories实现

---

**文档版本**: 1.0
**最后更新**: 2025-10-27
**维护者**: AI Builder Studio Team
**联系方式**: 如有问题请参考 `tasks.md` 或 `spec.md`
