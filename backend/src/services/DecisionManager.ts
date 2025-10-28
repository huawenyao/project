/**
 * Decision Manager
 *
 * 管理 Agent 决策记录和通知
 * 负责决策重要性分类、通知路由
 */

import DecisionRecord from '../models/DecisionRecord.model';
import { visualizationEmitter } from '../websocket/visualizationEmitter';
import logger from '../utils/logger';

export type DecisionImportance = 'critical' | 'high' | 'medium' | 'low';
export type NotificationRoute = 'toast' | 'sidebar' | 'silent';

interface DecisionInput {
  sessionId: string;
  agentType: string;
  decisionTitle: string;
  decisionContent: string;
  reasoning: string;
  alternatives?: Array<{
    option: string;
    pros: string[];
    cons: string[];
  }>;
  tradeoffs?: string;
  impact?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class DecisionManager {
  /**
   * 记录新决策
   */
  async recordDecision(input: DecisionInput): Promise<ServiceResponse<DecisionRecord>> {
    try {
      // 自动分类决策重要性
      const importance = this.classifyImportance(input);

      logger.info(`[DecisionManager] Recording ${importance} decision: ${input.decisionTitle}`);

      // 创建决策记录
      const decision = await DecisionRecord.create({
        sessionId: input.sessionId,
        agentType: input.agentType as any,
        decisionTitle: input.decisionTitle,
        decisionContent: input.decisionContent,
        reasoning: input.reasoning,
        alternatives: input.alternatives || [],
        tradeoffs: input.tradeoffs || null,
        impact: input.impact || null,
        importance,
        tags: input.tags || [],
        metadata: input.metadata || {},
        isRead: false,
        timestamp: new Date(),
      });

      // 确定通知路由
      const route = this.determineNotificationRoute(importance);

      // 触发 WebSocket 事件（带优先级）
      this.emitDecisionCreated(decision, route);

      return {
        success: true,
        data: decision,
      };
    } catch (error: any) {
      logger.error('[DecisionManager] Error recording decision:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 分类决策重要性
   * 基于关键词、影响、备选方案数量等
   */
  private classifyImportance(input: DecisionInput): DecisionImportance {
    const { decisionTitle, decisionContent, alternatives, impact, tags } = input;

    // 关键词检测
    const criticalKeywords = [
      '架构', 'architecture', '数据库', 'database', '安全', 'security',
      '性能', 'performance', '重大', 'major', '关键', 'critical'
    ];

    const highKeywords = [
      '框架', 'framework', '库', 'library', '技术栈', 'stack',
      '设计', 'design', '方案', 'solution', '重要', 'important'
    ];

    const text = `${decisionTitle} ${decisionContent} ${tags?.join(' ')}`.toLowerCase();

    // Critical: 包含关键词 + 有影响描述 + 有多个备选方案
    if (criticalKeywords.some(keyword => text.includes(keyword.toLowerCase())) &&
        impact &&
        alternatives && alternatives.length >= 2) {
      return 'critical';
    }

    // High: 包含高重要性关键词 或 有3+个备选方案
    if (highKeywords.some(keyword => text.includes(keyword.toLowerCase())) ||
        (alternatives && alternatives.length >= 3)) {
      return 'high';
    }

    // Medium: 有备选方案 或 有影响描述
    if ((alternatives && alternatives.length > 0) || impact) {
      return 'medium';
    }

    // Low: 默认
    return 'low';
  }

  /**
   * 确定通知路由
   */
  private determineNotificationRoute(importance: DecisionImportance): NotificationRoute {
    switch (importance) {
      case 'critical':
      case 'high':
        return 'toast'; // 高重要性：弹出Toast
      case 'medium':
        return 'sidebar'; // 中等重要性：仅在侧边栏显示
      case 'low':
        return 'silent'; // 低重要性：静默记录，不主动通知
      default:
        return 'sidebar';
    }
  }

  /**
   * 触发决策创建事件
   */
  private emitDecisionCreated(decision: DecisionRecord, route: NotificationRoute): void {
    const priority = decision.importance === 'critical' ? 'critical' :
                     decision.importance === 'high' ? 'high' :
                     decision.importance === 'medium' ? 'medium' : 'low';

    visualizationEmitter.emitDecisionCreated(
      decision.sessionId,
      {
        decisionId: decision.decisionId,
        sessionId: decision.sessionId,
        agentType: decision.agentType,
        decisionTitle: decision.decisionTitle,
        decisionContent: decision.decisionContent,
        reasoning: decision.reasoning,
        alternatives: decision.alternatives,
        tradeoffs: decision.tradeoffs,
        impact: decision.impact,
        importance: decision.importance,
        tags: decision.tags,
        isRead: decision.isRead,
        route, // 告诉前端应该如何显示
        timestamp: decision.timestamp.toISOString(),
        createdAt: decision.createdAt.toISOString(),
      },
      priority as any
    );
  }

  /**
   * 标记决策为已读
   */
  async markAsRead(decisionId: string): Promise<ServiceResponse<DecisionRecord>> {
    try {
      const decision = await DecisionRecord.findByPk(decisionId);
      if (!decision) {
        return {
          success: false,
          error: 'Decision not found',
        };
      }

      decision.isRead = true;
      await decision.save();

      logger.debug(`[DecisionManager] Marked decision ${decisionId} as read`);

      return {
        success: true,
        data: decision,
      };
    } catch (error: any) {
      logger.error('[DecisionManager] Error marking decision as read:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 批量标记为已读
   */
  async markAllAsRead(sessionId: string): Promise<ServiceResponse<number>> {
    try {
      const [count] = await DecisionRecord.update(
        { isRead: true },
        {
          where: {
            sessionId,
            isRead: false,
          },
        }
      );

      logger.info(`[DecisionManager] Marked ${count} decisions as read for session ${sessionId}`);

      return {
        success: true,
        data: count,
      };
    } catch (error: any) {
      logger.error('[DecisionManager] Error marking all decisions as read:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取未读决策数量
   */
  async getUnreadCount(sessionId: string): Promise<ServiceResponse<number>> {
    try {
      const count = await DecisionRecord.count({
        where: {
          sessionId,
          isRead: false,
        },
      });

      return {
        success: true,
        data: count,
      };
    } catch (error: any) {
      logger.error('[DecisionManager] Error getting unread count:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 按重要性获取决策
   */
  async getDecisionsByImportance(
    sessionId: string,
    importance: DecisionImportance | 'all' = 'all'
  ): Promise<ServiceResponse<DecisionRecord[]>> {
    try {
      const where: any = { sessionId };

      if (importance !== 'all') {
        where.importance = importance;
      }

      const decisions = await DecisionRecord.findAll({
        where,
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: decisions,
      };
    } catch (error: any) {
      logger.error('[DecisionManager] Error getting decisions by importance:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取决策统计
   */
  async getDecisionStats(sessionId: string): Promise<ServiceResponse<any>> {
    try {
      const allDecisions = await DecisionRecord.findAll({
        where: { sessionId },
        attributes: ['importance', 'isRead'],
      });

      const stats = {
        total: allDecisions.length,
        unread: allDecisions.filter(d => !d.isRead).length,
        byImportance: {
          critical: allDecisions.filter(d => d.importance === 'critical').length,
          high: allDecisions.filter(d => d.importance === 'high').length,
          medium: allDecisions.filter(d => d.importance === 'medium').length,
          low: allDecisions.filter(d => d.importance === 'low').length,
        },
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      logger.error('[DecisionManager] Error getting decision stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// 导出单例
export const decisionManager = new DecisionManager();
export default decisionManager;
