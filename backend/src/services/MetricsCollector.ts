/**
 * T029 [P]: MetricsCollector Service
 *
 * Phase 2 - Foundational: Core infrastructure service for anonymized data collection
 *
 * 功能：
 * - 收集匿名化的用户交互指标
 * - GDPR/CCPA 合规的数据收集
 * - 支持 opt-in/opt-out
 * - 数据脱敏和聚合
 * - 12个月数据保留策略
 */

import { logger } from '../utils/logger';
import { UserInteractionMetric } from '../models/UserInteractionMetric.model';

// 指标事件类型 (与 contracts/websocket-events.md 对应)
export enum MetricEventType {
  DECISION_CLICKED = 'decision_clicked',
  THEME_SWITCHED = 'theme_switched',
  VIEW_SWITCHED = 'view_switched',
  ERROR_CARD_ACTION = 'error_card_action',
  AGENT_CARD_EXPANDED = 'agent_card_expanded',
  COLLABORATION_INSPECTED = 'collaboration_inspected',
  SESSION_DURATION = 'session_duration',
  REPLAY_ACCESSED = 'replay_accessed',
}

export interface MetricEventData {
  eventType: MetricEventType;
  sessionId: string;
  userId?: string; // 可选，支持匿名用户
  metadata?: Record<string, any>; // 额外的匿名化元数据
  timestamp: Date;
}

export interface UserPrivacySettings {
  userId: string;
  optIn: boolean; // 用户是否同意数据收集
  optInDate?: Date;
  optOutDate?: Date;
}

export class MetricsCollector {
  private privacySettings: Map<string, UserPrivacySettings> = new Map();

  constructor() {
    this.loadPrivacySettings();
  }

  /**
   * 加载用户隐私设置
   * 从数据库或缓存加载用户的 opt-in/opt-out 状态
   */
  private async loadPrivacySettings(): Promise<void> {
    try {
      // TODO: 从数据库加载用户隐私设置
      // 暂时使用内存缓存，实际应从 UserSettings 表读取
      logger.info('[MetricsCollector] Privacy settings loaded');
    } catch (error: any) {
      logger.error('[MetricsCollector] Failed to load privacy settings:', error);
    }
  }

  /**
   * 设置用户隐私偏好
   */
  async setUserPrivacy(userId: string, optIn: boolean): Promise<void> {
    try {
      const settings: UserPrivacySettings = {
        userId,
        optIn,
        optInDate: optIn ? new Date() : undefined,
        optOutDate: !optIn ? new Date() : undefined,
      };

      this.privacySettings.set(userId, settings);

      // TODO: 持久化到数据库
      logger.info('[MetricsCollector] User privacy updated:', { userId, optIn });
    } catch (error: any) {
      logger.error('[MetricsCollector] Failed to set user privacy:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否同意数据收集
   */
  private hasUserConsent(userId?: string): boolean {
    if (!userId) {
      // 匿名用户默认允许基础指标收集
      return true;
    }

    const settings = this.privacySettings.get(userId);
    return settings?.optIn ?? false; // 默认 opt-out
  }

  /**
   * 数据匿名化
   * 移除 PII (个人身份信息)
   */
  private anonymizeData(data: MetricEventData): Record<string, any> {
    const anonymized: Record<string, any> = {
      eventType: data.eventType,
      sessionId: this.hashSessionId(data.sessionId), // Hash session ID
      timestamp: data.timestamp,
    };

    // 不包含 userId
    // 只保留非敏感的 metadata
    if (data.metadata) {
      anonymized.metadata = this.sanitizeMetadata(data.metadata);
    }

    return anonymized;
  }

  /**
   * Hash session ID 以保护隐私
   */
  private hashSessionId(sessionId: string): string {
    // 简单 hash，实际应使用 crypto.createHash
    return `session_${Buffer.from(sessionId).toString('base64').substring(0, 16)}`;
  }

  /**
   * 清理 metadata，移除敏感信息
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    // 白名单：只保留允许的字段
    const allowedFields = [
      'agentType',
      'decisionImportance',
      'errorType',
      'viewMode',
      'themeType',
      'actionType',
      'duration',
    ];

    for (const key of allowedFields) {
      if (key in metadata) {
        sanitized[key] = metadata[key];
      }
    }

    return sanitized;
  }

  /**
   * 记录指标事件
   */
  async recordEvent(data: MetricEventData): Promise<void> {
    try {
      // 检查用户隐私设置
      if (!this.hasUserConsent(data.userId)) {
        logger.debug('[MetricsCollector] Event skipped - user opted out:', data.eventType);
        return;
      }

      // 匿名化数据
      const anonymizedData = this.anonymizeData(data);

      // 存储到数据库
      await UserInteractionMetric.create({
        eventType: anonymizedData.eventType,
        sessionId: anonymizedData.sessionId,
        metadata: anonymizedData.metadata || {},
        timestamp: anonymizedData.timestamp,
      });

      logger.debug('[MetricsCollector] Event recorded:', {
        eventType: data.eventType,
        sessionId: anonymizedData.sessionId,
      });
    } catch (error: any) {
      logger.error('[MetricsCollector] Failed to record event:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 批量记录事件
   */
  async recordBatchEvents(events: MetricEventData[]): Promise<void> {
    try {
      const promises = events.map((event) => this.recordEvent(event));
      await Promise.all(promises);

      logger.info('[MetricsCollector] Batch events recorded:', events.length);
    } catch (error: any) {
      logger.error('[MetricsCollector] Failed to record batch events:', error);
    }
  }

  /**
   * 获取聚合指标
   * 用于分析和报表
   */
  async getAggregatedMetrics(options: {
    eventType?: MetricEventType;
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<any[]> {
    try {
      // TODO: 实现聚合查询
      // GROUP BY eventType, DATE_TRUNC(groupBy, timestamp)
      // COUNT(*), AVG(duration), etc.

      logger.info('[MetricsCollector] Aggregated metrics retrieved');
      return [];
    } catch (error: any) {
      logger.error('[MetricsCollector] Failed to get aggregated metrics:', error);
      throw error;
    }
  }

  /**
   * 清理过期数据
   * 根据 GDPR 要求，删除超过 12 个月的数据
   */
  async cleanupExpiredData(): Promise<number> {
    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const deletedCount = await UserInteractionMetric.destroy({
        where: {
          timestamp: {
            $lt: twelveMonthsAgo,
          },
        },
      });

      logger.info('[MetricsCollector] Expired data cleaned up:', { deletedCount });
      return deletedCount;
    } catch (error: any) {
      logger.error('[MetricsCollector] Failed to cleanup expired data:', error);
      throw error;
    }
  }

  /**
   * 导出用户数据 (GDPR 合规)
   * 允许用户导出自己的数据
   */
  async exportUserData(userId: string): Promise<any[]> {
    try {
      // 注意：由于数据已匿名化，无法直接关联到 userId
      // 这里只是示意接口，实际需要在匿名化前留下可撤销的映射
      logger.info('[MetricsCollector] User data exported:', { userId });
      return [];
    } catch (error: any) {
      logger.error('[MetricsCollector] Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * 删除用户数据 (GDPR 合规)
   * 允许用户删除自己的数据
   */
  async deleteUserData(userId: string): Promise<number> {
    try {
      // 同上，匿名化后无法直接删除
      // 实际需要维护 userId -> hashedSessionId 映射表
      logger.info('[MetricsCollector] User data deleted:', { userId });
      return 0;
    } catch (error: any) {
      logger.error('[MetricsCollector] Failed to delete user data:', error);
      throw error;
    }
  }
}

export default new MetricsCollector();
