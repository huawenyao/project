/**
 * Visualization Emitter
 *
 * 用于从服务层向客户端推送可视化更新
 */

import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger';
import {
  VisualizationUpdateEvent,
  AgentStatusUpdate,
  DecisionMadeEvent,
  ErrorOccurredEvent,
  AgentType,
  AgentStatus,
  DecisionImpact,
  ErrorSeverity,
} from '../types/visualization.types';

export class VisualizationEmitter {
  private io: SocketIOServer | null = null;

  /**
   * 初始化 Socket.IO 服务器实例
   */
  initialize(io: SocketIOServer): void {
    this.io = io;
    logger.info('VisualizationEmitter initialized');
  }

  /**
   * 检查是否已初始化
   */
  private checkInitialized(): void {
    if (!this.io) {
      throw new Error('VisualizationEmitter not initialized. Call initialize() first.');
    }
  }

  /**
   * 向会话房间发送事件
   */
  private emitToSession(sessionId: string, event: string, data: any): void {
    this.checkInitialized();
    this.io!.to(`session-${sessionId}`).emit(event, data);
  }

  /**
   * 推送 Agent 状态更新
   * T037-T039: Agent 状态更新事件
   */
  emitAgentStatusUpdate(sessionId: string, update: AgentStatusUpdate | any): void {
    try {
      const event: VisualizationUpdateEvent = {
        type: 'agent_status_update',
        sessionId,
        data: update,
        timestamp: new Date().toISOString(),
      };

      // 发送到 session 房间
      this.emitToSession(sessionId, 'visualization:agent-status-update', event);

      // 同时发送到 project 房间（兼容性）
      this.io!.to(`project:${sessionId}`).emit('agent:status:update', {
        ...update,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Emitted agent status update for ${update.agentType} in session ${sessionId}`);
    } catch (error: any) {
      logger.error('Error emitting agent status update:', error);
    }
  }

  /**
   * T040: 推送 Agent 输出
   */
  emitAgentOutput(sessionId: string, output: {
    agentType: string;
    type: string;
    content: any;
    metadata?: any;
    timestamp?: string;
  }): void {
    try {
      const event = {
        ...output,
        timestamp: output.timestamp || new Date().toISOString(),
      };

      // 发送到 session 房间
      this.emitToSession(sessionId, 'visualization:agent-output', event);

      // 同时发送到 project 房间（兼容性）
      this.io!.to(`project:${sessionId}`).emit('agent:output', event);

      logger.debug(`Emitted agent output for ${output.agentType} in session ${sessionId}`);
    } catch (error: any) {
      logger.error('Error emitting agent output:', error);
    }
  }

  /**
   * 推送决策记录
   */
  emitDecisionMade(sessionId: string, decision: DecisionMadeEvent): void {
    try {
      const event: VisualizationUpdateEvent = {
        type: 'decision_made',
        sessionId,
        data: decision,
        timestamp: new Date().toISOString(),
      };

      this.emitToSession(sessionId, 'visualization:decision-made', event);

      logger.debug(`Emitted decision made for ${decision.agentType} in session ${sessionId}`);
    } catch (error: any) {
      logger.error('Error emitting decision made:', error);
    }
  }

  /**
   * 推送错误发生事件
   */
  emitErrorOccurred(sessionId: string, error: ErrorOccurredEvent): void {
    try {
      const event: VisualizationUpdateEvent = {
        type: 'error_occurred',
        sessionId,
        data: error,
        timestamp: new Date().toISOString(),
      };

      this.emitToSession(sessionId, 'visualization:error-occurred', event);

      logger.debug(`Emitted error occurred for ${error.agentType} in session ${sessionId}`);
    } catch (error: any) {
      logger.error('Error emitting error occurred:', error);
    }
  }

  /**
   * 推送协作事件
   */
  emitCollaborationEvent(sessionId: string, collaboration: {
    sourceAgent: AgentType;
    targetAgent: AgentType;
    collaborationType: string;
    payload: any;
  }): void {
    try {
      const event: VisualizationUpdateEvent = {
        type: 'collaboration_event',
        sessionId,
        data: collaboration,
        timestamp: new Date().toISOString(),
      };

      this.emitToSession(sessionId, 'visualization:collaboration-event', event);

      logger.debug(`Emitted collaboration event: ${collaboration.sourceAgent} -> ${collaboration.targetAgent}`);
    } catch (error: any) {
      logger.error('Error emitting collaboration event:', error);
    }
  }

  /**
   * 推送预览数据生成事件
   */
  emitPreviewGenerated(sessionId: string, preview: {
    previewId: string;
    agentType: AgentType;
    previewType: string;
    decisionId?: string;
  }): void {
    try {
      const event: VisualizationUpdateEvent = {
        type: 'preview_generated',
        sessionId,
        data: preview,
        timestamp: new Date().toISOString(),
      };

      this.emitToSession(sessionId, 'visualization:preview-generated', event);

      logger.debug(`Emitted preview generated for ${preview.agentType} in session ${sessionId}`);
    } catch (error: any) {
      logger.error('Error emitting preview generated:', error);
    }
  }

  /**
   * 推送会话状态更新
   */
  emitSessionStatusUpdate(sessionId: string, status: 'in_progress' | 'success' | 'failed' | 'partial_success'): void {
    try {
      this.emitToSession(sessionId, 'visualization:session-status-update', {
        sessionId,
        status,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Emitted session status update: ${sessionId} -> ${status}`);
    } catch (error: any) {
      logger.error('Error emitting session status update:', error);
    }
  }

  /**
   * 推送进度更新
   */
  emitProgressUpdate(sessionId: string, progress: number): void {
    try {
      this.emitToSession(sessionId, 'visualization:progress-update', {
        sessionId,
        progress,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Emitted progress update: ${sessionId} -> ${progress}%`);
    } catch (error: any) {
      logger.error('Error emitting progress update:', error);
    }
  }

  /**
   * 批量推送多个更新（优化性能）
   */
  emitBatchUpdates(sessionId: string, updates: {
    agentStatuses?: AgentStatusUpdate[];
    decisions?: DecisionMadeEvent[];
    errors?: ErrorOccurredEvent[];
    collaborations?: any[];
    previews?: any[];
  }): void {
    try {
      this.emitToSession(sessionId, 'visualization:batch-update', {
        sessionId,
        updates,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Emitted batch update for session ${sessionId}`);
    } catch (error: any) {
      logger.error('Error emitting batch update:', error);
    }
  }

  /**
   * 向所有连接的客户端广播消息
   */
  broadcast(event: string, data: any): void {
    try {
      this.checkInitialized();
      this.io!.emit(event, data);

      logger.debug(`Broadcasted event: ${event}`);
    } catch (error: any) {
      logger.error('Error broadcasting event:', error);
    }
  }

  /**
   * 获取会话房间的客户端数量
   */
  async getSessionClientCount(sessionId: string): Promise<number> {
    try {
      this.checkInitialized();
      const room = this.io!.sockets.adapter.rooms.get(`session-${sessionId}`);
      return room ? room.size : 0;
    } catch (error: any) {
      logger.error('Error getting session client count:', error);
      return 0;
    }
  }

  /**
   * 检查会话是否有活跃客户端
   */
  async hasActiveClients(sessionId: string): Promise<boolean> {
    const count = await this.getSessionClientCount(sessionId);
    return count > 0;
  }
}

// 导出单例
export default new VisualizationEmitter();
