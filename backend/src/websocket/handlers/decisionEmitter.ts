/**
 * Decision Emitter
 *
 * 决策通知路由器
 * 根据决策重要性路由到不同的通知方式：
 * - Critical/High: Toast（弹出通知）
 * - Medium: Sidebar（侧边栏）
 * - Low: Silent（静默）
 *
 * 高重要性决策保证 <100ms 延迟
 */

import { Server as SocketIOServer } from 'socket.io';
import logger from '../../utils/logger';

export type NotificationRoute = 'toast' | 'sidebar' | 'silent';
export type DecisionPriority = 'critical' | 'high' | 'medium' | 'low';

interface DecisionEvent {
  decisionId: string;
  sessionId: string;
  agentType: string;
  decisionTitle: string;
  decisionContent: string;
  reasoning: string;
  alternatives?: any[];
  tradeoffs?: string | null;
  impact?: string | null;
  importance: DecisionPriority;
  tags: string[];
  isRead: boolean;
  route: NotificationRoute;
  timestamp: string;
  createdAt: string;
}

interface QueuedDecision {
  event: DecisionEvent;
  priority: DecisionPriority;
  queuedAt: number;
}

class DecisionEmitter {
  private io: SocketIOServer | null = null;
  private queue: Map<string, QueuedDecision[]> = new Map(); // sessionId -> decisions
  private highPriorityThreshold = 100; // ms - 高优先级决策必须在100ms内发送
  private mediumPriorityDelay = 500; // ms - 中优先级可以延迟500ms
  private batchSize = 5; // 批处理大小

  /**
   * 初始化 Socket.IO 服务器
   */
  initialize(io: SocketIOServer): void {
    this.io = io;
    logger.info('[DecisionEmitter] Initialized');
  }

  /**
   * 发送决策创建事件
   */
  emitDecisionCreated(
    sessionId: string,
    event: DecisionEvent,
    priority: DecisionPriority = 'medium'
  ): void {
    if (!this.io) {
      logger.warn('[DecisionEmitter] Socket.IO not initialized');
      return;
    }

    const queuedDecision: QueuedDecision = {
      event,
      priority,
      queuedAt: Date.now(),
    };

    // Critical 和 High 优先级立即发送（<100ms）
    if (priority === 'critical' || priority === 'high') {
      this.sendImmediately(sessionId, queuedDecision);
      return;
    }

    // Medium 和 Low 优先级可以批处理
    this.enqueue(sessionId, queuedDecision);
  }

  /**
   * 立即发送高优先级决策
   */
  private sendImmediately(sessionId: string, decision: QueuedDecision): void {
    try {
      const room = `session-${sessionId}`;
      const { event, priority } = decision;
      const latency = Date.now() - decision.queuedAt;

      this.io!.to(room).emit('visualization:decision-created', {
        ...event,
        latency, // 用于监控延迟
      });

      logger.info(
        `[DecisionEmitter] High-priority decision sent to ${room} (${latency}ms) - ${event.decisionTitle}`
      );

      // 如果延迟超过100ms，记录警告
      if (latency > this.highPriorityThreshold) {
        logger.warn(
          `[DecisionEmitter] High-priority decision exceeded ${this.highPriorityThreshold}ms threshold: ${latency}ms`
        );
      }
    } catch (error) {
      logger.error('[DecisionEmitter] Error sending immediate decision:', error);
    }
  }

  /**
   * 将决策加入队列
   */
  private enqueue(sessionId: string, decision: QueuedDecision): void {
    if (!this.queue.has(sessionId)) {
      this.queue.set(sessionId, []);
    }

    const queue = this.queue.get(sessionId)!;
    queue.push(decision);

    // 如果达到批处理大小，立即刷新
    if (queue.length >= this.batchSize) {
      this.flushQueue(sessionId);
      return;
    }

    // 否则，设置延迟刷新
    setTimeout(() => {
      this.flushQueue(sessionId);
    }, this.mediumPriorityDelay);
  }

  /**
   * 刷新队列
   */
  private flushQueue(sessionId: string): void {
    const queue = this.queue.get(sessionId);
    if (!queue || queue.length === 0) {
      return;
    }

    try {
      const room = `session-${sessionId}`;

      // 按优先级分组
      const mediumDecisions = queue.filter(d => d.priority === 'medium');
      const lowDecisions = queue.filter(d => d.priority === 'low');

      // 发送 Medium 优先级决策（批量）
      if (mediumDecisions.length > 0) {
        this.io!.to(room).emit('visualization:decision-batch', {
          type: 'medium',
          count: mediumDecisions.length,
          decisions: mediumDecisions.map(d => d.event),
          timestamp: new Date().toISOString(),
        });

        logger.debug(
          `[DecisionEmitter] Sent ${mediumDecisions.length} medium-priority decisions to ${room}`
        );
      }

      // 发送 Low 优先级决策（静默，仅更新store）
      if (lowDecisions.length > 0) {
        this.io!.to(room).emit('visualization:decision-silent', {
          count: lowDecisions.length,
          decisions: lowDecisions.map(d => d.event),
          timestamp: new Date().toISOString(),
        });

        logger.debug(
          `[DecisionEmitter] Sent ${lowDecisions.length} low-priority decisions (silent) to ${room}`
        );
      }

      // 清空队列
      this.queue.delete(sessionId);
    } catch (error) {
      logger.error('[DecisionEmitter] Error flushing queue:', error);
    }
  }

  /**
   * 发送决策已读事件
   */
  emitDecisionRead(sessionId: string, decisionId: string): void {
    if (!this.io) {
      logger.warn('[DecisionEmitter] Socket.IO not initialized');
      return;
    }

    const room = `session-${sessionId}`;
    this.io.to(room).emit('visualization:decision-read', {
      decisionId,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`[DecisionEmitter] Decision ${decisionId} marked as read in ${room}`);
  }

  /**
   * 发送全部已读事件
   */
  emitAllDecisionsRead(sessionId: string, count: number): void {
    if (!this.io) {
      logger.warn('[DecisionEmitter] Socket.IO not initialized');
      return;
    }

    const room = `session-${sessionId}`;
    this.io.to(room).emit('visualization:all-decisions-read', {
      count,
      timestamp: new Date().toISOString(),
    });

    logger.info(`[DecisionEmitter] All ${count} decisions marked as read in ${room}`);
  }

  /**
   * 强制刷新所有队列
   */
  flushAll(): void {
    logger.info('[DecisionEmitter] Flushing all queues...');

    const sessions = Array.from(this.queue.keys());
    for (const sessionId of sessions) {
      this.flushQueue(sessionId);
    }

    logger.info('[DecisionEmitter] All queues flushed');
  }

  /**
   * 清空指定会话的队列
   */
  clearQueue(sessionId: string): void {
    this.queue.delete(sessionId);
    logger.debug(`[DecisionEmitter] Queue cleared for session ${sessionId}`);
  }

  /**
   * 获取队列统计信息
   */
  getStats(): Record<string, any> {
    const stats = {
      totalSessions: this.queue.size,
      totalQueuedDecisions: 0,
      sessionQueues: {} as Record<string, number>,
    };

    for (const [sessionId, queue] of this.queue.entries()) {
      stats.totalQueuedDecisions += queue.length;
      stats.sessionQueues[sessionId] = queue.length;
    }

    return stats;
  }
}

// 导出单例
export const decisionEmitter = new DecisionEmitter();
export default decisionEmitter;
