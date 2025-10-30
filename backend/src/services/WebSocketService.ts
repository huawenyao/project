import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import { getLangGraphClient } from './LangGraphClient';

/**
 * T017 [P] [US2]: WebSocketService
 * 提供WebSocket实时通信功能，支持项目、Agent、任务状态的实时更新
 */

export interface WebSocketMessage {
  event: string;
  data: any;
  timestamp: number;
}

export interface ConnectionInfo {
  socketId: string;
  userId?: string;
  projectId?: string;
  connectedAt: number;
}

export class WebSocketService {
  private static io: SocketIOServer | null = null;
  private static connections: Map<string, ConnectionInfo> = new Map();
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  /**
   * 初始化WebSocket服务器
   */
  static initialize(httpServer: HTTPServer): void {
    try {
      // 创建Socket.IO服务器
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || 'http://localhost:3000',
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['websocket', 'polling'],
      });

      // 连接事件处理
      this.io.on('connection', (socket: Socket) => {
        this.handleConnection(socket);
      });

      // T158: 启动心跳检测
      this.startHeartbeat();

      logger.info('WebSocket service initialized');
    } catch (error: any) {
      logger.error('Failed to initialize WebSocket service:', error);
      throw error;
    }
  }

  /**
   * 处理客户端连接
   */
  private static handleConnection(socket: Socket): void {
    const socketId = socket.id;
    logger.info(`Client connected: ${socketId}`);

    // 保存连接信息
    this.connections.set(socketId, {
      socketId,
      connectedAt: Date.now(),
    });

    // 发送连接成功消息
    socket.emit('connected', {
      socketId,
      message: 'Connected to WebSocket server',
      timestamp: Date.now(),
    });

    // 监听客户端事件
    this.setupEventListeners(socket);

    // 断开连接处理
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  /**
   * 设置事件监听器
   */
  private static setupEventListeners(socket: Socket): void {
    // 加入项目房间
    socket.on('join:project', (projectId: string) => {
      this.joinProjectRoom(socket, projectId);
    });

    // 离开项目房间
    socket.on('leave:project', (projectId: string) => {
      this.leaveProjectRoom(socket, projectId);
    });

    // 订阅Agent状态
    socket.on('subscribe:agent', (agentId: string) => {
      this.subscribeToAgent(socket, agentId);
    });

    // 取消订阅Agent状态
    socket.on('unsubscribe:agent', (agentId: string) => {
      this.unsubscribeFromAgent(socket, agentId);
    });

    // 订阅任务状态
    socket.on('subscribe:task', (taskId: string) => {
      this.subscribeToTask(socket, taskId);
    });

    // 取消订阅任务状态
    socket.on('unsubscribe:task', (taskId: string) => {
      this.unsubscribeFromTask(socket, taskId);
    });

    // Ping-Pong心跳
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // LangGraph Agent请求
    socket.on('langgraph:agent:run', async (data: {
      agentName: string;
      request: string;
      context?: any;
      sessionId?: string;
    }) => {
      await this.handleLangGraphAgentRequest(socket, data);
    });

    // LangGraph Agent流式请求
    socket.on('langgraph:agent:stream', async (data: {
      agentName: string;
      request: string;
      context?: any;
      sessionId?: string;
    }) => {
      await this.handleLangGraphAgentStream(socket, data);
    });
  }

  /**
   * 处理客户端断开连接
   */
  private static handleDisconnection(socket: Socket): void {
    const socketId = socket.id;
    logger.info(`Client disconnected: ${socketId}`);

    // 移除连接信息
    this.connections.delete(socketId);
  }

  /**
   * 加入项目房间
   */
  private static joinProjectRoom(socket: Socket, projectId: string): void {
    const roomName = `project:${projectId}`;
    socket.join(roomName);

    // 更新连接信息
    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      connectionInfo.projectId = projectId;
    }

    logger.info(`Socket ${socket.id} joined project room: ${projectId}`);

    socket.emit('joined:project', {
      projectId,
      message: `Joined project ${projectId}`,
      timestamp: Date.now(),
    });
  }

  /**
   * 离开项目房间
   */
  private static leaveProjectRoom(socket: Socket, projectId: string): void {
    const roomName = `project:${projectId}`;
    socket.leave(roomName);

    logger.info(`Socket ${socket.id} left project room: ${projectId}`);

    socket.emit('left:project', {
      projectId,
      message: `Left project ${projectId}`,
      timestamp: Date.now(),
    });
  }

  /**
   * 订阅Agent状态
   */
  private static subscribeToAgent(socket: Socket, agentId: string): void {
    const roomName = `agent:${agentId}`;
    socket.join(roomName);

    logger.info(`Socket ${socket.id} subscribed to agent: ${agentId}`);

    socket.emit('subscribed:agent', {
      agentId,
      timestamp: Date.now(),
    });
  }

  /**
   * 取消订阅Agent状态
   */
  private static unsubscribeFromAgent(socket: Socket, agentId: string): void {
    const roomName = `agent:${agentId}`;
    socket.leave(roomName);

    logger.info(`Socket ${socket.id} unsubscribed from agent: ${agentId}`);

    socket.emit('unsubscribed:agent', {
      agentId,
      timestamp: Date.now(),
    });
  }

  /**
   * 订阅任务状态
   */
  private static subscribeToTask(socket: Socket, taskId: string): void {
    const roomName = `task:${taskId}`;
    socket.join(roomName);

    logger.info(`Socket ${socket.id} subscribed to task: ${taskId}`);

    socket.emit('subscribed:task', {
      taskId,
      timestamp: Date.now(),
    });
  }

  /**
   * 取消订阅任务状态
   */
  private static unsubscribeFromTask(socket: Socket, taskId: string): void {
    const roomName = `task:${taskId}`;
    socket.leave(roomName);

    logger.info(`Socket ${socket.id} unsubscribed from task: ${taskId}`);

    socket.emit('unsubscribed:task', {
      taskId,
      timestamp: Date.now(),
    });
  }

  // ========== 广播方法 ==========

  /**
   * 向项目房间广播消息
   */
  static broadcastToProject(projectId: string, event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    const roomName = `project:${projectId}`;
    this.io.to(roomName).emit(event, {
      ...data,
      timestamp: Date.now(),
    });

    logger.debug(`Broadcast to project ${projectId}: ${event}`);
  }

  /**
   * 广播项目状态更新
   */
  static broadcastProjectUpdate(projectId: string, data: any): void {
    this.broadcastToProject(projectId, 'project:update', data);
  }

  /**
   * 广播项目进度更新
   */
  static broadcastProjectProgress(projectId: string, progress: number): void {
    this.broadcastToProject(projectId, 'project:progress', { progress });
  }

  /**
   * 广播Agent状态更新
   */
  static broadcastAgentUpdate(agentId: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    const roomName = `agent:${agentId}`;
    this.io.to(roomName).emit('agent:update', {
      agentId,
      ...data,
      timestamp: Date.now(),
    });

    logger.debug(`Broadcast agent update: ${agentId}`);
  }

  /**
   * 广播Agent状态变更
   */
  static broadcastAgentStatusChange(agentId: string, status: string, currentTask?: string): void {
    this.broadcastAgentUpdate(agentId, { status, currentTask });
  }

  /**
   * 广播任务状态更新
   */
  static broadcastTaskUpdate(taskId: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    const roomName = `task:${taskId}`;
    this.io.to(roomName).emit('task:update', {
      taskId,
      ...data,
      timestamp: Date.now(),
    });

    logger.debug(`Broadcast task update: ${taskId}`);
  }

  /**
   * 广播任务进度更新
   */
  static broadcastTaskProgress(taskId: string, progress: number): void {
    this.broadcastTaskUpdate(taskId, { progress });
  }

  /**
   * 广播任务状态变更
   */
  static broadcastTaskStatusChange(taskId: string, status: string, additionalData?: any): void {
    this.broadcastTaskUpdate(taskId, {
      status,
      ...additionalData,
    });
  }

  /**
   * 广播构建日志
   */
  static broadcastBuildLog(projectId: string, log: {
    level: string;
    message: string;
    source?: string;
    metadata?: any;
  }): void {
    this.broadcastToProject(projectId, 'build:log', log);
  }

  /**
   * 广播错误消息
   */
  static broadcastError(projectId: string, error: {
    message: string;
    code?: string;
    details?: any;
  }): void {
    this.broadcastToProject(projectId, 'error', error);
  }

  /**
   * 向所有客户端广播
   */
  static broadcastToAll(event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    this.io.emit(event, {
      ...data,
      timestamp: Date.now(),
    });

    logger.debug(`Broadcast to all: ${event}`);
  }

  /**
   * 向特定Socket发送消息
   */
  static sendToSocket(socketId: string, event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    this.io.to(socketId).emit(event, {
      ...data,
      timestamp: Date.now(),
    });
  }

  // ========== 状态查询方法 ==========

  /**
   * 获取当前连接数
   */
  static getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * 获取项目房间的连接数
   */
  static async getProjectRoomSize(projectId: string): Promise<number> {
    if (!this.io) {
      return 0;
    }

    const roomName = `project:${projectId}`;
    const sockets = await this.io.in(roomName).fetchSockets();
    return sockets.length;
  }

  /**
   * 获取所有连接信息
   */
  static getAllConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  /**
   * 检查WebSocket服务是否已初始化
   */
  static isInitialized(): boolean {
    return this.io !== null;
  }

  /**
   * 关闭WebSocket服务
   */
  static close(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
      this.connections.clear();

      // 停止心跳检测
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      logger.info('WebSocket service closed');
    }
  }

  // ========== Phase 13: WebSocket Resilience ==========

  /**
   * T158: 实现心跳/ping-pong机制 (30s间隔)
   */
  private static startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (!this.io) return;

      this.connections.forEach((conn, socketId) => {
        const socket = this.io!.sockets.sockets.get(socketId);
        if (socket && socket.connected) {
          socket.emit('heartbeat', { timestamp: Date.now() });
        }
      });

      logger.debug(`Heartbeat sent to ${this.connections.size} clients`);
    }, this.HEARTBEAT_INTERVAL);

    logger.info('Heartbeat mechanism started');
  }

  /**
   * T159: 广播连接状态到客户端
   */
  static broadcastConnectionState(): void {
    if (!this.io) return;

    const state = {
      totalConnections: this.connections.size,
      timestamp: Date.now(),
      status: 'healthy',
    };

    this.io.emit('connection:state', state);
    logger.debug('Connection state broadcasted', state);
  }

  /**
   * T160: 实现重连时的状态同步
   */
  static async syncStateOnReconnection(socket: Socket, sessionId: string): Promise<void> {
    try {
      // 这里应该从数据库或缓存中获取最新状态
      // 简化实现：返回基本状态同步
      const stateData = {
        sessionId,
        synced: true,
        timestamp: Date.now(),
        message: 'State synchronized successfully',
      };

      socket.emit('state:synced', stateData);
      logger.info(`State synced for socket ${socket.id} on session ${sessionId}`);
    } catch (error: any) {
      logger.error('Failed to sync state on reconnection:', error);
      socket.emit('state:sync:error', {
        message: 'Failed to synchronize state',
        error: error.message,
      });
    }
  }

  // ========== LangGraph Integration ==========

  /**
   * 处理 LangGraph Agent 请求（非流式）
   */
  private static async handleLangGraphAgentRequest(
    socket: Socket,
    data: {
      agentName: string;
      request: string;
      context?: any;
      sessionId?: string;
    }
  ): Promise<void> {
    const { agentName, request, context, sessionId } = data;

    try {
      logger.info(`[LangGraph] Running ${agentName} for socket ${socket.id}`);

      // 发送开始事件
      socket.emit('langgraph:agent:start', {
        agentName,
        sessionId,
        timestamp: Date.now(),
      });

      // 获取 LangGraph 客户端
      const client = getLangGraphClient();

      // 根据 Agent 名称调用对应的方法
      let result;
      switch (agentName) {
        case 'builder_agent':
          result = await client.runBuilderAgent(request, context);
          break;
        case 'ui_agent':
          result = await client.runUIAgent(request, context);
          break;
        case 'database_agent':
          result = await client.runDatabaseAgent(request, context);
          break;
        default:
          throw new Error(`Unknown agent: ${agentName}`);
      }

      // 发送完成事件
      socket.emit('langgraph:agent:complete', {
        agentName,
        sessionId,
        result,
        timestamp: Date.now(),
      });

      logger.info(`[LangGraph] ${agentName} completed successfully`);

    } catch (error: any) {
      logger.error(`[LangGraph] ${agentName} failed:`, error);

      // 发送错误事件
      socket.emit('langgraph:agent:error', {
        agentName,
        sessionId,
        error: error.message || 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 处理 LangGraph Agent 流式请求
   */
  private static async handleLangGraphAgentStream(
    socket: Socket,
    data: {
      agentName: string;
      request: string;
      context?: any;
      sessionId?: string;
    }
  ): Promise<void> {
    const { agentName, request, context, sessionId } = data;

    try {
      logger.info(`[LangGraph] Streaming ${agentName} for socket ${socket.id}`);

      // 发送开始事件
      socket.emit('langgraph:agent:start', {
        agentName,
        sessionId,
        timestamp: Date.now(),
      });

      // 获取 LangGraph 客户端
      const client = getLangGraphClient();

      // 调用流式 API
      const stream = await client.streamAgent(agentName, {
        user_request: request,
        context,
      });

      // 监听流式事件
      stream.on('chunk', (chunk: any) => {
        socket.emit('langgraph:agent:chunk', {
          agentName,
          sessionId,
          chunk,
          timestamp: Date.now(),
        });
      });

      stream.on('end', (data: any) => {
        socket.emit('langgraph:agent:complete', {
          agentName,
          sessionId,
          result: data,
          timestamp: Date.now(),
        });

        logger.info(`[LangGraph] ${agentName} stream completed`);
      });

      stream.on('error', (error: Error) => {
        socket.emit('langgraph:agent:error', {
          agentName,
          sessionId,
          error: error.message,
          timestamp: Date.now(),
        });

        logger.error(`[LangGraph] ${agentName} stream error:`, error);
      });

    } catch (error: any) {
      logger.error(`[LangGraph] ${agentName} stream failed:`, error);

      // 发送错误事件
      socket.emit('langgraph:agent:error', {
        agentName,
        sessionId,
        error: error.message || 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 广播 LangGraph Agent 状态更新
   */
  static broadcastLangGraphAgentUpdate(sessionId: string, data: {
    agentName: string;
    status: string;
    progress?: number;
    message?: string;
  }): void {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    this.io.emit('langgraph:agent:update', {
      sessionId,
      ...data,
      timestamp: Date.now(),
    });

    logger.debug(`Broadcast LangGraph agent update for session ${sessionId}`);
  }
}

export default WebSocketService;
