/**
 * LangGraph Service
 *
 * 前端服务 - 与 LangGraph Server 通过 WebSocket 通信
 */

import { EventEmitter } from 'events';
import webSocketService from './WebSocketService';

export interface LangGraphAgentRequest {
  agentName: 'builder_agent' | 'ui_agent' | 'database_agent';
  request: string;
  context?: any;
  sessionId?: string;
}

export interface LangGraphAgentResponse {
  agentName: string;
  sessionId?: string;
  result?: any;
  messages?: Array<{
    type: string;
    content: string;
    role?: string;
  }>;
  timestamp: number;
}

export interface LangGraphChunk {
  type: string;
  data: any;
}

export interface LangGraphError {
  agentName: string;
  sessionId?: string;
  error: string;
  timestamp: number;
}

/**
 * LangGraph 服务类
 * 提供与 LangGraph Server 的通信接口
 */
class LangGraphService extends EventEmitter {
  private activeRequests: Map<string, any> = new Map();

  constructor() {
    super();
    this.setupEventListeners();
  }

  /**
   * 设置 WebSocket 事件监听器
   */
  private setupEventListeners(): void {
    // Agent 开始
    webSocketService.on('langgraph:agent:start', (data: any) => {
      console.log('[LangGraph] Agent started:', data);
      this.emit('agent:start', data);
    });

    // Agent 完成
    webSocketService.on('langgraph:agent:complete', (data: LangGraphAgentResponse) => {
      console.log('[LangGraph] Agent completed:', data);
      this.emit('agent:complete', data);

      // 清理活跃请求
      if (data.sessionId) {
        this.activeRequests.delete(data.sessionId);
      }
    });

    // Agent 流式数据块
    webSocketService.on('langgraph:agent:chunk', (data: { chunk: LangGraphChunk }) => {
      console.log('[LangGraph] Agent chunk:', data);
      this.emit('agent:chunk', data);
    });

    // Agent 错误
    webSocketService.on('langgraph:agent:error', (data: LangGraphError) => {
      console.error('[LangGraph] Agent error:', data);
      this.emit('agent:error', data);

      // 清理活跃请求
      if (data.sessionId) {
        this.activeRequests.delete(data.sessionId);
      }
    });

    // Agent 状态更新
    webSocketService.on('langgraph:agent:update', (data: any) => {
      console.log('[LangGraph] Agent update:', data);
      this.emit('agent:update', data);
    });
  }

  /**
   * 运行 Agent（非流式）
   */
  runAgent(request: LangGraphAgentRequest): string {
    const sessionId = request.sessionId || this.generateSessionId();

    console.log('[LangGraph] Running agent:', request.agentName);

    // 保存活跃请求
    this.activeRequests.set(sessionId, {
      agentName: request.agentName,
      startTime: Date.now(),
    });

    // 通过 WebSocket 发送请求
    webSocketService.emit('langgraph:agent:run', {
      ...request,
      sessionId,
    });

    return sessionId;
  }

  /**
   * 流式运行 Agent
   */
  streamAgent(request: LangGraphAgentRequest): string {
    const sessionId = request.sessionId || this.generateSessionId();

    console.log('[LangGraph] Streaming agent:', request.agentName);

    // 保存活跃请求
    this.activeRequests.set(sessionId, {
      agentName: request.agentName,
      startTime: Date.now(),
      streaming: true,
    });

    // 通过 WebSocket 发送流式请求
    webSocketService.emit('langgraph:agent:stream', {
      ...request,
      sessionId,
    });

    return sessionId;
  }

  /**
   * 运行 Builder Agent
   */
  runBuilderAgent(request: string, context?: any, streaming: boolean = false): string {
    return streaming
      ? this.streamAgent({
          agentName: 'builder_agent',
          request,
          context,
        })
      : this.runAgent({
          agentName: 'builder_agent',
          request,
          context,
        });
  }

  /**
   * 运行 UI Agent
   */
  runUIAgent(request: string, context?: any, streaming: boolean = false): string {
    return streaming
      ? this.streamAgent({
          agentName: 'ui_agent',
          request,
          context,
        })
      : this.runAgent({
          agentName: 'ui_agent',
          request,
          context,
        });
  }

  /**
   * 运行 Database Agent
   */
  runDatabaseAgent(request: string, context?: any, streaming: boolean = false): string {
    return streaming
      ? this.streamAgent({
          agentName: 'database_agent',
          request,
          context,
        })
      : this.runAgent({
          agentName: 'database_agent',
          request,
          context,
        });
  }

  /**
   * 取消 Agent 请求
   */
  cancelAgent(sessionId: string): void {
    console.log('[LangGraph] Canceling agent:', sessionId);

    // 从活跃请求中移除
    this.activeRequests.delete(sessionId);

    // TODO: 通知后端取消请求
    // webSocketService.emit('langgraph:agent:cancel', { sessionId });
  }

  /**
   * 获取活跃请求列表
   */
  getActiveRequests(): Map<string, any> {
    return this.activeRequests;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.activeRequests.clear();
    this.removeAllListeners();
  }
}

// 导出单例
const langGraphService = new LangGraphService();
export default langGraphService;
