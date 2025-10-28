/**
 * WebSocket Service
 *
 * WebSocket 客户端服务 - 处理实时通信
 */

import { io, Socket } from 'socket.io-client';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface WebSocketConfig {
  url: string;
  token?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  reconnectionAttempts?: number;
}

export type EventHandler = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();

  /**
   * 初始化 WebSocket 连接
   */
  initialize(config: WebSocketConfig): void {
    if (this.socket) {
      this.disconnect();
    }

    this.config = config;

    this.socket = io(config.url, {
      auth: {
        token: config.token,
      },
      autoConnect: config.autoConnect !== false,
      reconnection: config.reconnection !== false,
      reconnectionDelay: config.reconnectionDelay || 1000,
      reconnectionDelayMax: config.reconnectionDelayMax || 5000,
      reconnectionAttempts: config.reconnectionAttempts || Infinity,
    });

    this.setupListeners();
  }

  /**
   * 设置内部事件监听器
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.updateStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.updateStatus('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.updateStatus('error');
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      this.updateStatus('connected');
    });

    this.socket.on('reconnecting', (attemptNumber) => {
      console.log('[WebSocket] Reconnecting attempt', attemptNumber);
      this.updateStatus('reconnecting');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('[WebSocket] Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      this.updateStatus('error');
    });
  }

  /**
   * 连接到服务器
   */
  connect(): void {
    if (!this.socket) {
      throw new Error('WebSocket not initialized. Call initialize() first.');
    }

    if (!this.socket.connected) {
      this.updateStatus('connecting');
      this.socket.connect();
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.updateStatus('disconnected');
  }

  /**
   * 发送事件
   */
  emit(event: string, data?: any): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('[WebSocket] Cannot emit event - not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * 监听事件
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());

      // 注册到 socket
      if (this.socket) {
        this.socket.on(event, (data: any) => {
          const handlers = this.eventHandlers.get(event);
          if (handlers) {
            handlers.forEach((h) => h(data));
          }
        });
      }
    }

    this.eventHandlers.get(event)!.add(handler);

    // 返回取消监听函数
    return () => this.off(event, handler);
  }

  /**
   * 取消事件监听
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);

      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
        if (this.socket) {
          this.socket.off(event);
        }
      }
    }
  }

  /**
   * 监听一次事件
   */
  once(event: string, handler: EventHandler): void {
    const wrappedHandler = (data: any) => {
      handler(data);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }

  /**
   * 监听连接状态变化
   */
  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    // 立即通知当前状态
    listener(this.connectionStatus);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * 更新连接状态
   */
  private updateStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.statusListeners.forEach((listener) => listener(status));
    }
  }

  /**
   * 获取当前连接状态
   */
  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 获取 socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export default new WebSocketService();
