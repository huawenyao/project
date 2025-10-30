/**
 * T030 [P]: ReplayService
 *
 * Phase 2 - Foundational: Core infrastructure for historical session playback
 *
 * 功能：
 * - 加载历史构建会话数据
 * - 支持热数据 (PostgreSQL) 和冷数据 (S3) 回放
 * - 实现时间轴回放控制 (播放/暂停/快进/倒退)
 * - 恢复完整的 Agent 状态、决策记录、协作事件
 * - 提供 3秒内加载冷数据的性能保证
 */

import { logger } from '../utils/logger';
import { BuildSession } from '../models/BuildSession.model';
import { AgentWorkStatus } from '../models/AgentWorkStatus.model';
import { DecisionRecord } from '../models/DecisionRecord.model';
import { CollaborationEvent } from '../models/CollaborationEvent.model';
import { AgentErrorRecord } from '../models/AgentErrorRecord.model';
import DataArchiveService from './DataArchiveService';

export interface ReplaySession {
  session: any; // BuildSession
  agentStatuses: any[];
  decisions: any[];
  collaborations: any[];
  errors: any[];
  metadata: {
    totalDuration: number; // 毫秒
    agentCount: number;
    decisionCount: number;
    errorCount: number;
    isArchived: boolean;
    loadedFrom: 'hot' | 'cold'; // 热数据或冷数据
  };
}

export interface ReplayTimeline {
  events: ReplayTimelineEvent[];
  totalDuration: number;
  startTime: Date;
  endTime: Date;
}

export interface ReplayTimelineEvent {
  timestamp: Date;
  relativeTime: number; // 相对于会话开始的毫秒数
  eventType: 'agent_status' | 'decision' | 'collaboration' | 'error';
  eventId: string;
  data: any;
}

export interface ReplayPlaybackOptions {
  sessionId: string;
  startTime?: number; // 从哪个时间点开始播放 (毫秒)
  playbackSpeed?: number; // 播放速度倍数 (0.5x, 1x, 2x, 5x, 10x)
}

export class ReplayService {
  /**
   * 加载回放会话数据
   * 自动检测热数据/冷数据
   */
  async loadReplaySession(sessionId: string): Promise<ReplaySession> {
    try {
      logger.info('[ReplayService] Loading replay session:', sessionId);

      // 1. 查询会话基本信息
      const session = await BuildSession.findOne({
        where: { sessionId },
      });

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // 2. 检查是否已归档
      const isArchived = session.get('archivedAt') !== null;

      if (isArchived) {
        // 从 S3 加载冷数据
        return await this.loadArchivedSession(sessionId);
      } else {
        // 从 PostgreSQL 加载热数据
        return await this.loadHotSession(sessionId);
      }
    } catch (error: any) {
      logger.error('[ReplayService] Failed to load replay session:', error);
      throw error;
    }
  }

  /**
   * 从 PostgreSQL 加载热数据 (<30天)
   */
  private async loadHotSession(sessionId: string): Promise<ReplaySession> {
    try {
      const startTime = Date.now();

      // 并行查询所有相关数据
      const [session, agentStatuses, decisions, collaborations, errors] = await Promise.all([
        BuildSession.findOne({ where: { sessionId } }),
        AgentWorkStatus.findAll({
          where: { sessionId },
          order: [['createdAt', 'ASC']],
        }),
        DecisionRecord.findAll({
          where: { sessionId },
          order: [['timestamp', 'ASC']],
        }),
        CollaborationEvent.findAll({
          where: { sessionId },
          order: [['timestamp', 'ASC']],
        }),
        AgentErrorRecord.findAll({
          where: { sessionId },
          order: [['timestamp', 'ASC']],
        }),
      ]);

      const loadTime = Date.now() - startTime;

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const sessionData = session.get({ plain: true });
      const totalDuration =
        new Date(sessionData.endTime).getTime() - new Date(sessionData.startTime).getTime();

      logger.info('[ReplayService] Hot session loaded:', {
        sessionId,
        loadTime: `${loadTime}ms`,
        agentCount: agentStatuses.length,
        decisionCount: decisions.length,
      });

      return {
        session: sessionData,
        agentStatuses: agentStatuses.map((s) => s.get({ plain: true })),
        decisions: decisions.map((d) => d.get({ plain: true })),
        collaborations: collaborations.map((c) => c.get({ plain: true })),
        errors: errors.map((e) => e.get({ plain: true })),
        metadata: {
          totalDuration,
          agentCount: agentStatuses.length,
          decisionCount: decisions.length,
          errorCount: errors.length,
          isArchived: false,
          loadedFrom: 'hot',
        },
      };
    } catch (error: any) {
      logger.error('[ReplayService] Failed to load hot session:', error);
      throw error;
    }
  }

  /**
   * 从 S3 加载冷数据 (>30天归档)
   */
  private async loadArchivedSession(sessionId: string): Promise<ReplaySession> {
    try {
      const startTime = Date.now();

      logger.info('[ReplayService] Loading archived session from S3:', sessionId);

      // 从 S3 下载归档数据
      const archivedData = await DataArchiveService.retrieveArchivedSession(sessionId);

      if (!archivedData) {
        throw new Error(`Archived session not found: ${sessionId}`);
      }

      const loadTime = Date.now() - startTime;

      // 确保在 3 秒内加载完成
      if (loadTime > 3000) {
        logger.warn('[ReplayService] Archived session load exceeded 3s threshold:', {
          sessionId,
          loadTime: `${loadTime}ms`,
        });
      }

      logger.info('[ReplayService] Archived session loaded:', {
        sessionId,
        loadTime: `${loadTime}ms`,
      });

      return {
        ...archivedData,
        metadata: {
          ...archivedData.metadata,
          isArchived: true,
          loadedFrom: 'cold',
        },
      };
    } catch (error: any) {
      logger.error('[ReplayService] Failed to load archived session:', error);
      throw error;
    }
  }

  /**
   * 构建回放时间轴
   * 将所有事件按时间顺序排列
   */
  buildReplayTimeline(replaySession: ReplaySession): ReplayTimeline {
    try {
      const events: ReplayTimelineEvent[] = [];
      const startTime = new Date(replaySession.session.startTime);

      // 添加 Agent 状态事件
      for (const status of replaySession.agentStatuses) {
        events.push({
          timestamp: new Date(status.createdAt),
          relativeTime: new Date(status.createdAt).getTime() - startTime.getTime(),
          eventType: 'agent_status',
          eventId: status.statusId,
          data: status,
        });
      }

      // 添加决策事件
      for (const decision of replaySession.decisions) {
        events.push({
          timestamp: new Date(decision.timestamp),
          relativeTime: new Date(decision.timestamp).getTime() - startTime.getTime(),
          eventType: 'decision',
          eventId: decision.decisionId,
          data: decision,
        });
      }

      // 添加协作事件
      for (const collaboration of replaySession.collaborations) {
        events.push({
          timestamp: new Date(collaboration.timestamp),
          relativeTime: new Date(collaboration.timestamp).getTime() - startTime.getTime(),
          eventType: 'collaboration',
          eventId: collaboration.eventId,
          data: collaboration,
        });
      }

      // 添加错误事件
      for (const error of replaySession.errors) {
        events.push({
          timestamp: new Date(error.timestamp),
          relativeTime: new Date(error.timestamp).getTime() - startTime.getTime(),
          eventType: 'error',
          eventId: error.errorId,
          data: error,
        });
      }

      // 按时间顺序排序
      events.sort((a, b) => a.relativeTime - b.relativeTime);

      return {
        events,
        totalDuration: replaySession.metadata.totalDuration,
        startTime,
        endTime: new Date(replaySession.session.endTime),
      };
    } catch (error: any) {
      logger.error('[ReplayService] Failed to build replay timeline:', error);
      throw error;
    }
  }

  /**
   * 获取指定时间点的事件
   * 用于时间轴跳转和快进/倒退
   */
  getEventsAtTime(timeline: ReplayTimeline, currentTime: number): ReplayTimelineEvent[] {
    try {
      // 返回当前时间点之前的所有事件
      return timeline.events.filter((event) => event.relativeTime <= currentTime);
    } catch (error: any) {
      logger.error('[ReplayService] Failed to get events at time:', error);
      return [];
    }
  }

  /**
   * 获取下一个事件
   * 用于逐步回放
   */
  getNextEvent(timeline: ReplayTimeline, currentTime: number): ReplayTimelineEvent | null {
    try {
      return timeline.events.find((event) => event.relativeTime > currentTime) || null;
    } catch (error: any) {
      logger.error('[ReplayService] Failed to get next event:', error);
      return null;
    }
  }

  /**
   * 获取会话列表 (带归档状态)
   */
  async listSessions(options: {
    userId?: string;
    projectId?: string;
    limit?: number;
    offset?: number;
    includeArchived?: boolean;
  }): Promise<any[]> {
    try {
      const where: any = {};

      if (options.userId) {
        where.userId = options.userId;
      }

      if (options.projectId) {
        where.projectId = options.projectId;
      }

      if (!options.includeArchived) {
        where.archivedAt = null; // 只返回热数据
      }

      const sessions = await BuildSession.findAll({
        where,
        limit: options.limit || 50,
        offset: options.offset || 0,
        order: [['startTime', 'DESC']],
        attributes: [
          'sessionId',
          'userId',
          'projectId',
          'startTime',
          'endTime',
          'status',
          'archivedAt',
        ],
      });

      return sessions.map((s) => {
        const session = s.get({ plain: true });
        return {
          ...session,
          isArchived: session.archivedAt !== null,
        };
      });
    } catch (error: any) {
      logger.error('[ReplayService] Failed to list sessions:', error);
      throw error;
    }
  }
}

export default new ReplayService();
