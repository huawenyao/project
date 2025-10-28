/**
 * Agent Status Emitter
 *
 * 混合频率 WebSocket 推送策略：
 * - 高优先级（进度更新、完成、失败）: 200-500ms
 * - 中优先级（常规状态变更）: 500-1000ms
 * - 低优先级（背景信息）: 1000-2000ms
 */

import { Server as SocketIOServer } from 'socket.io';
import logger from '../../utils/logger';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

interface QueuedEvent {
  sessionId: string;
  eventType: string;
  data: any;
  priority: Priority;
  timestamp: number;
}

interface EmitterConfig {
  criticalDelay: number;    // 立即发送
  highPriorityDelay: number; // 200-500ms
  mediumPriorityDelay: number; // 500-1000ms
  lowPriorityDelay: number;  // 1000-2000ms
  batchSize: number;         // 批处理大小
}

class AgentStatusEmitter {
  private io: SocketIOServer | null = null;
  private eventQueue: Map<string, QueuedEvent[]> = new Map(); // sessionId -> events
  private timers: Map<string, NodeJS.Timeout> = new Map(); // sessionId -> timer
  private config: EmitterConfig = {
    criticalDelay: 0,           // 立即发送
    highPriorityDelay: 300,     // 300ms
    mediumPriorityDelay: 750,   // 750ms
    lowPriorityDelay: 1500,     // 1500ms
    batchSize: 10,
  };

  /**
   * 初始化 Socket.IO 服务器
   */
  initialize(io: SocketIOServer): void {
    this.io = io;
    logger.info('[AgentStatusEmitter] Initialized');
  }

  /**
   * 配置发送延迟
   */
  configure(config: Partial<EmitterConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('[AgentStatusEmitter] Configuration updated:', this.config);
  }

  /**
   * 发送 Agent 状态更新
   */
  emitAgentStatus(
    sessionId: string,
    data: any,
    priority: Priority = 'medium'
  ): void {
    if (!this.io) {
      logger.warn('[AgentStatusEmitter] Socket.IO not initialized');
      return;
    }

    const event: QueuedEvent = {
      sessionId,
      eventType: 'visualization:agent-status-update',
      data,
      priority,
      timestamp: Date.now(),
    };

    // 关键事件立即发送
    if (priority === 'critical') {
      this.sendImmediately(event);
      return;
    }

    // 其他事件加入队列
    this.enqueue(event);
  }

  /**
   * 发送批量 Agent 状态更新
   */
  emitBatchAgentStatuses(
    sessionId: string,
    statuses: any[],
    priority: Priority = 'medium'
  ): void {
    if (!this.io) {
      logger.warn('[AgentStatusEmitter] Socket.IO not initialized');
      return;
    }

    const event: QueuedEvent = {
      sessionId,
      eventType: 'visualization:agent-status-batch',
      data: { statuses },
      priority,
      timestamp: Date.now(),
    };

    this.enqueue(event);
  }

  /**
   * 发送进度更新（高频）
   */
  emitProgressUpdate(
    sessionId: string,
    agentType: string,
    progress: number,
    currentOperation?: string
  ): void {
    this.emitAgentStatus(
      sessionId,
      {
        agentType,
        progressPercentage: progress,
        currentOperation,
        timestamp: new Date().toISOString(),
      },
      'high'
    );
  }

  /**
   * 立即发送事件（关键事件）
   */
  private sendImmediately(event: QueuedEvent): void {
    try {
      const room = `session-${event.sessionId}`;
      this.io!.to(room).emit(event.eventType, {
        timestamp: new Date(event.timestamp).toISOString(),
        priority: event.priority,
        data: event.data,
      });

      logger.debug(`[AgentStatusEmitter] Critical event sent immediately to ${room}`);
    } catch (error) {
      logger.error('[AgentStatusEmitter] Error sending immediate event:', error);
    }
  }

  /**
   * 将事件加入队列
   */
  private enqueue(event: QueuedEvent): void {
    const { sessionId } = event;

    // 初始化队列
    if (!this.eventQueue.has(sessionId)) {
      this.eventQueue.set(sessionId, []);
    }

    const queue = this.eventQueue.get(sessionId)!;
    queue.push(event);

    // 如果队列达到批处理大小，立即刷新
    if (queue.length >= this.config.batchSize) {
      this.flushQueue(sessionId);
      return;
    }

    // 否则，设置定时器
    if (!this.timers.has(sessionId)) {
      const delay = this.getDelayForPriority(event.priority);
      const timer = setTimeout(() => {
        this.flushQueue(sessionId);
      }, delay);

      this.timers.set(sessionId, timer);
    }
  }

  /**
   * 刷新队列，发送所有待发送事件
   */
  private flushQueue(sessionId: string): void {
    const queue = this.eventQueue.get(sessionId);
    if (!queue || queue.length === 0) {
      return;
    }

    try {
      const room = `session-${sessionId}`;

      // 按优先级分组
      const groupedEvents = this.groupByPriority(queue);

      // 发送分组事件
      for (const [priority, events] of Object.entries(groupedEvents)) {
        if (events.length === 1) {
          // 单个事件直接发送
          this.io!.to(room).emit(events[0].eventType, {
            timestamp: new Date(events[0].timestamp).toISOString(),
            priority: events[0].priority,
            data: events[0].data,
          });
        } else {
          // 多个事件批量发送
          this.io!.to(room).emit('visualization:agent-status-batch', {
            timestamp: new Date().toISOString(),
            priority,
            count: events.length,
            events: events.map(e => ({
              type: e.eventType,
              timestamp: new Date(e.timestamp).toISOString(),
              data: e.data,
            })),
          });
        }
      }

      logger.debug(`[AgentStatusEmitter] Flushed ${queue.length} events to ${room}`);

      // 清空队列和定时器
      this.eventQueue.delete(sessionId);
      const timer = this.timers.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(sessionId);
      }
    } catch (error) {
      logger.error('[AgentStatusEmitter] Error flushing queue:', error);
    }
  }

  /**
   * 按优先级分组事件
   */
  private groupByPriority(events: QueuedEvent[]): Record<Priority, QueuedEvent[]> {
    const groups: Record<Priority, QueuedEvent[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const event of events) {
      groups[event.priority].push(event);
    }

    return groups;
  }

  /**
   * 根据优先级获取延迟时间
   */
  private getDelayForPriority(priority: Priority): number {
    switch (priority) {
      case 'critical':
        return this.config.criticalDelay;
      case 'high':
        return this.config.highPriorityDelay;
      case 'medium':
        return this.config.mediumPriorityDelay;
      case 'low':
        return this.config.lowPriorityDelay;
      default:
        return this.config.mediumPriorityDelay;
    }
  }

  /**
   * 强制刷新所有队列（用于关闭服务器前）
   */
  flushAll(): void {
    logger.info('[AgentStatusEmitter] Flushing all queues...');

    const sessions = Array.from(this.eventQueue.keys());
    for (const sessionId of sessions) {
      this.flushQueue(sessionId);
    }

    logger.info('[AgentStatusEmitter] All queues flushed');
  }

  /**
   * 清空指定会话的队列
   */
  clearQueue(sessionId: string): void {
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(sessionId);
    }

    this.eventQueue.delete(sessionId);
    logger.debug(`[AgentStatusEmitter] Queue cleared for session ${sessionId}`);
  }

  /**
   * 获取队列统计信息
   */
  getStats(): Record<string, any> {
    const stats = {
      totalSessions: this.eventQueue.size,
      totalQueuedEvents: 0,
      sessionQueues: {} as Record<string, number>,
    };

    for (const [sessionId, queue] of this.eventQueue.entries()) {
      stats.totalQueuedEvents += queue.length;
      stats.sessionQueues[sessionId] = queue.length;
    }

    return stats;
  }
}

// 导出单例
export const agentStatusEmitter = new AgentStatusEmitter();
export default agentStatusEmitter;
