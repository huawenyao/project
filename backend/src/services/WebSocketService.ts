import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';

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
      logger.info('WebSocket service closed');
    }
  }
}

export default WebSocketService;
