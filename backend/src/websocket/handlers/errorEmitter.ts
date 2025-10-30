/**
 * T117: Error Emitter - WebSocket事件推送
 *
 * Phase 8 - Error Recovery & Resilience
 *
 * 功能：
 * - 推送 agent-error 事件到前端
 * - 包含错误分类、重试状态、错误详情
 * - 支持重试进度更新
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { ErrorClassification } from '../../services/ErrorClassifier';

export interface AgentErrorEvent {
  sessionId: string;
  agentType: string;
  error: string;
  classification: ErrorClassification;
  retryCount: number;
  maxRetries: number;
  retrying: boolean;
  delay?: number; // Retry delay in ms
  critical?: boolean;
  timestamp?: Date;
}

export class ErrorEmitter {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * 发送错误事件到指定会话房间
   */
  emitError(errorEvent: AgentErrorEvent): void {
    try {
      const roomName = `session-${errorEvent.sessionId}`;

      // 添加时间戳
      const eventWithTimestamp = {
        ...errorEvent,
        timestamp: new Date(),
      };

      // 发送到会话房间
      this.io.to(roomName).emit('error-occurred', eventWithTimestamp);

      // 日志记录
      if (errorEvent.retrying) {
        logger.info(
          `[ErrorEmitter] Retry event sent for ${errorEvent.agentType} in session ${errorEvent.sessionId} (${errorEvent.retryCount}/${errorEvent.maxRetries})`
        );
      } else {
        logger.warn(
          `[ErrorEmitter] Error event sent for ${errorEvent.agentType} in session ${errorEvent.sessionId}: ${errorEvent.error}`
        );
      }
    } catch (error) {
      logger.error('[ErrorEmitter] Failed to emit error event:', error);
    }
  }

  /**
   * 批量发送多个错误事件
   */
  emitBatch(errorEvents: AgentErrorEvent[]): void {
    for (const event of errorEvents) {
      this.emitError(event);
    }
  }

  /**
   * 发送错误恢复成功事件
   */
  emitRecovery(sessionId: string, agentType: string, retryCount: number): void {
    try {
      const roomName = `session-${sessionId}`;

      this.io.to(roomName).emit('error-recovered', {
        sessionId,
        agentType,
        retryCount,
        message: `${agentType} 已在第 ${retryCount} 次重试后恢复正常`,
        timestamp: new Date(),
      });

      logger.info(
        `[ErrorEmitter] Recovery event sent for ${agentType} in session ${sessionId} after ${retryCount} retries`
      );
    } catch (error) {
      logger.error('[ErrorEmitter] Failed to emit recovery event:', error);
    }
  }

  /**
   * 发送致命错误事件（需要用户干预）
   */
  emitCriticalError(
    sessionId: string,
    agentType: string,
    errorMessage: string,
    classification: ErrorClassification
  ): void {
    try {
      const roomName = `session-${sessionId}`;

      this.io.to(roomName).emit('critical-error', {
        sessionId,
        agentType,
        error: errorMessage,
        classification,
        requiresUserAction: true,
        suggestedActions: this.getSuggestedActions(classification),
        timestamp: new Date(),
      });

      logger.error(
        `[ErrorEmitter] Critical error event sent for ${agentType} in session ${sessionId}: ${errorMessage}`
      );
    } catch (error) {
      logger.error('[ErrorEmitter] Failed to emit critical error event:', error);
    }
  }

  /**
   * 根据错误分类生成建议操作
   */
  private getSuggestedActions(classification: ErrorClassification): string[] {
    const actions: string[] = [];

    switch (classification.suggestedAction) {
      case 'retry':
        actions.push('系统正在自动重试');
        actions.push('请稍候...');
        break;
      case 'skip':
        actions.push('跳过当前任务');
        actions.push('继续执行其他任务');
        break;
      case 'abort':
        actions.push('终止构建流程');
        actions.push('检查错误详情');
        actions.push('联系技术支持');
        break;
      case 'manual':
        actions.push('检查输入参数');
        actions.push('修正后重新提交');
        actions.push('或联系技术支持');
        break;
    }

    return actions;
  }

  /**
   * 发送错误统计信息
   */
  emitErrorStats(sessionId: string, stats: {
    totalErrors: number;
    resolvedErrors: number;
    pendingRetries: number;
    criticalErrors: number;
  }): void {
    try {
      const roomName = `session-${sessionId}`;

      this.io.to(roomName).emit('error-stats', {
        sessionId,
        stats,
        timestamp: new Date(),
      });

      logger.debug(`[ErrorEmitter] Error stats sent for session ${sessionId}`);
    } catch (error) {
      logger.error('[ErrorEmitter] Failed to emit error stats:', error);
    }
  }
}

// 单例实例
let errorEmitterInstance: ErrorEmitter | null = null;

/**
 * 初始化 ErrorEmitter
 */
export function initializeErrorEmitter(io: SocketIOServer): ErrorEmitter {
  if (!errorEmitterInstance) {
    errorEmitterInstance = new ErrorEmitter(io);
    logger.info('[ErrorEmitter] Initialized');
  }
  return errorEmitterInstance;
}

/**
 * 获取 ErrorEmitter 实例
 */
export function getErrorEmitter(): ErrorEmitter {
  if (!errorEmitterInstance) {
    throw new Error('[ErrorEmitter] Not initialized. Call initializeErrorEmitter first.');
  }
  return errorEmitterInstance;
}

export default {
  initializeErrorEmitter,
  getErrorEmitter,
};
