/**
 * Decision Manager
 *
 * 管理 Agent 决策记录和通知
 * 负责决策重要性分类、通知路由、预览数据生成
 */

import { DecisionRecord } from '../models/DecisionRecord.model';
import { PreviewData } from '../models/PreviewData.model';
import visualizationEmitter from '../websocket/visualizationEmitter';
import logger from '../utils/logger';
import { PreviewType } from '../types/visualization.types';

export type DecisionImportance = 'critical' | 'high' | 'medium' | 'low';
export type NotificationRoute = 'toast' | 'sidebar' | 'silent';

interface PreviewDataInput {
  type: PreviewType;
  content: any; // URL for image, HTML string, JSON object, etc.
  description?: string;
  metadata?: Record<string, any>;
}

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
  previewData?: PreviewDataInput; // 可选的预览数据
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
        decisionType: 'other' as any,
        decisionTitle: input.decisionTitle,
        decisionContent: input.decisionContent,
        reasoning: input.reasoning as any,
        alternatives: input.alternatives || [],
        tradeoffs: input.tradeoffs || null,
        impact: (input.impact || 'medium') as any,
        importance,
        tags: input.tags || [],
        metadata: input.metadata || {},
        affectedComponents: [],
        isRead: false,
        timestamp: new Date().toISOString(),
      });

      // 如果有预览数据，创建关联的预览记录
      let previewData: PreviewData | null = null;
      if (input.previewData) {
        previewData = await this.createPreviewData(
          input.sessionId,
          input.agentType,
          decision.decisionId,
          input.previewData
        );
      }

      // 确定通知路由
      const route = this.determineNotificationRoute(importance);

      // 触发 WebSocket 事件（带优先级和预览数据）
      this.emitDecisionMade(decision, route, previewData);

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
  private emitDecisionMade(
    decision: DecisionRecord,
    route: NotificationRoute,
    previewData?: PreviewData | null
  ): void {
    const priority = decision.importance === 'critical' ? 'critical' :
                     decision.importance === 'high' ? 'high' :
                     decision.importance === 'medium' ? 'medium' : 'low';

    const eventData: any = {
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
    };

    // 如果有预览数据，添加到事件中
    if (previewData) {
      eventData.preview = {
        previewId: previewData.previewId,
        type: (previewData.previewContent as any).type,
        content: (previewData.previewContent as any).content,
        description: (previewData.previewContent as any).description,
        metadata: (previewData.previewContent as any).metadata,
      };
    }

    visualizationEmitter.emitDecisionMade(
      decision.sessionId,
      eventData,
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

  /**
   * 创建预览数据记录
   * T087: Preview data association to decision records
   */
  private async createPreviewData(
    sessionId: string,
    agentType: string,
    decisionId: string,
    previewInput: PreviewDataInput
  ): Promise<PreviewData> {
    try {
      logger.info(`[DecisionManager] Creating preview data for decision ${decisionId}, type: ${previewInput.type}`);

      const previewData = await PreviewData.create({
        sessionId,
        agentType: agentType as any,
        decisionId,
        previewContent: {
          type: previewInput.type,
          content: previewInput.content,
          description: previewInput.description,
          metadata: previewInput.metadata || {},
        },
        timestamp: new Date().toISOString(),
      });

      return previewData;
    } catch (error: any) {
      logger.error('[DecisionManager] Error creating preview data:', error);
      throw error;
    }
  }

  /**
   * 生成 UI 决策的预览数据
   * T088: Preview generation for UI decisions (static images)
   *
   * 为 UIAgent 的决策生成预览，例如组件截图、布局预览等
   */
  generateUIPreview(componentName: string, props?: Record<string, any>): PreviewDataInput {
    // 在实际实现中，这里可以：
    // 1. 调用无头浏览器（Puppeteer）渲染组件截图
    // 2. 生成组件的 HTML 预览
    // 3. 返回组件库中的预设截图 URL

    logger.info(`[DecisionManager] Generating UI preview for component: ${componentName}`);

    // 示例实现：返回预设的组件预览数据
    return {
      type: 'html',
      content: this.generateComponentHTML(componentName, props),
      description: `${componentName} 组件预览`,
      metadata: {
        componentName,
        props: props || {},
        library: 'custom',
      },
    };
  }

  /**
   * 生成 API 决策的预览数据
   * T089: Preview generation for API decisions (JSON examples)
   *
   * 为 BackendAgent 的决策生成 API 预览，例如请求/响应示例
   */
  generateAPIPreview(
    endpoint: string,
    method: string,
    requestExample?: any,
    responseExample?: any
  ): PreviewDataInput {
    logger.info(`[DecisionManager] Generating API preview for ${method} ${endpoint}`);

    const apiDoc = {
      endpoint,
      method,
      request: requestExample || { example: 'Request data here' },
      response: responseExample || { example: 'Response data here' },
      status: 200,
    };

    return {
      type: 'json',
      content: apiDoc,
      description: `${method} ${endpoint} API 预览`,
      metadata: {
        endpoint,
        method,
        protocol: 'REST',
      },
    };
  }

  /**
   * 生成数据库 schema 的预览
   * 为 DatabaseAgent 的决策生成预览
   */
  generateDatabasePreview(tableName: string, schema: any): PreviewDataInput {
    logger.info(`[DecisionManager] Generating database preview for table: ${tableName}`);

    return {
      type: 'code',
      content: this.generateSchemaSQL(tableName, schema),
      description: `${tableName} 表结构预览`,
      metadata: {
        tableName,
        columns: Object.keys(schema),
        database: 'PostgreSQL',
      },
    };
  }

  /**
   * 辅助方法：生成组件 HTML
   */
  private generateComponentHTML(componentName: string, props?: Record<string, any>): string {
    // 简化版 HTML 生成，实际应用中可以更复杂
    const propsStr = props ? JSON.stringify(props, null, 2) : '{}';

    return `
      <div class="component-preview" style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
        <div class="component-header" style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
          ${componentName}
        </div>
        <div class="component-body" style="padding: 15px; background: white; border-radius: 4px;">
          <p style="color: #666;">这是 ${componentName} 组件的预览</p>
          <div style="margin-top: 10px; font-size: 12px; color: #999;">
            <strong>Props:</strong>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${propsStr}</pre>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 辅助方法：生成 SQL schema
   */
  private generateSchemaSQL(tableName: string, schema: any): string {
    const columns = Object.entries(schema)
      .map(([name, type]) => `  ${name} ${type}`)
      .join(',\n');

    return `
CREATE TABLE ${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
${columns},
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at);
    `.trim();
  }
}

// 导出单例
export const decisionManager = new DecisionManager();
export default decisionManager;
