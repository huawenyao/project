/**
 * Decision Service
 *
 * 决策记录服务 - 管理 Agent 的决策记录和推理过程
 */

import { DecisionRecord, PreviewData } from '../models';
import {
  DecisionRecordCreationAttributes,
  PreviewDataCreationAttributes,
  AgentType,
  DecisionType,
  DecisionImpact,
  ServiceResponse,
  PaginatedResponse,
} from '../types/visualization.types';
import logger from '../utils/logger';
import { Op } from 'sequelize';

export class DecisionService {
  /**
   * 创建决策记录
   */
  async createDecision(data: DecisionRecordCreationAttributes): Promise<ServiceResponse<DecisionRecord>> {
    try {
      const decision = await DecisionRecord.create(data);
      logger.info(`Created decision record: ${decision.decisionId} for ${decision.agentType}`);

      return {
        success: true,
        data: decision,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to create decision record:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 创建预览数据（与决策关联）
   */
  async createPreview(data: PreviewDataCreationAttributes): Promise<ServiceResponse<PreviewData>> {
    try {
      const preview = await PreviewData.create(data);
      logger.info(`Created preview data: ${preview.previewId} for ${preview.agentType}`);

      return {
        success: true,
        data: preview,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to create preview data:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 创建决策及其预览数据（事务操作）
   */
  async createDecisionWithPreview(
    decisionData: DecisionRecordCreationAttributes,
    previewData: Omit<PreviewDataCreationAttributes, 'decisionId'>
  ): Promise<ServiceResponse<{ decision: DecisionRecord; preview: PreviewData }>> {
    try {
      // 创建决策记录
      const decision = await DecisionRecord.create(decisionData);

      // 创建关联的预览数据
      const preview = await PreviewData.create({
        ...previewData,
        decisionId: decision.decisionId,
      });

      logger.info(`Created decision with preview: ${decision.decisionId}`);

      return {
        success: true,
        data: { decision, preview },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to create decision with preview:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取会话的所有决策记录
   */
  async getSessionDecisions(
    sessionId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<ServiceResponse<PaginatedResponse<DecisionRecord>>> {
    try {
      const offset = (page - 1) * pageSize;

      const { count, rows } = await DecisionRecord.findAndCountAll({
        where: { sessionId },
        limit: pageSize,
        offset,
        order: [['timestamp', 'DESC']],
        include: [{ model: PreviewData, as: 'previews' }],
      });

      return {
        success: true,
        data: {
          data: rows,
          total: count,
          page,
          pageSize,
          hasMore: offset + rows.length < count,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get decisions for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 按 Agent 类型获取决策
   */
  async getDecisionsByAgent(
    sessionId: string,
    agentType: AgentType
  ): Promise<ServiceResponse<DecisionRecord[]>> {
    try {
      const decisions = await DecisionRecord.findAll({
        where: { sessionId, agentType },
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: decisions,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get decisions for ${agentType} in session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 按决策类型获取决策
   */
  async getDecisionsByType(
    sessionId: string,
    decisionType: DecisionType
  ): Promise<ServiceResponse<DecisionRecord[]>> {
    try {
      const decisions = await DecisionRecord.findAll({
        where: { sessionId, decisionType },
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: decisions,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get decisions of type ${decisionType} in session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取高影响决策
   */
  async getHighImpactDecisions(sessionId: string): Promise<ServiceResponse<DecisionRecord[]>> {
    try {
      const decisions = await DecisionRecord.findAll({
        where: { sessionId, impact: 'high' },
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: decisions,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get high impact decisions for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取决策详情（包含预览数据）
   */
  async getDecisionDetails(decisionId: string): Promise<ServiceResponse<any>> {
    try {
      const decision = await DecisionRecord.findByPk(decisionId, {
        include: [{ model: PreviewData, as: 'previews' }],
      });

      if (!decision) {
        return {
          success: false,
          error: 'Decision not found',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: decision,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get decision details for ${decisionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取会话的预览数据列表
   */
  async getSessionPreviews(sessionId: string): Promise<ServiceResponse<PreviewData[]>> {
    try {
      const previews = await PreviewData.findAll({
        where: { sessionId },
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: previews,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get previews for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 按 Agent 类型获取预览数据
   */
  async getPreviewsByAgent(
    sessionId: string,
    agentType: AgentType
  ): Promise<ServiceResponse<PreviewData[]>> {
    try {
      const previews = await PreviewData.findAll({
        where: { sessionId, agentType },
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: previews,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get previews for ${agentType} in session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取决策统计
   */
  async getDecisionStats(sessionId: string): Promise<ServiceResponse<any>> {
    try {
      const decisions = await DecisionRecord.findAll({
        where: { sessionId },
      });

      const stats = {
        total: decisions.length,
        byType: {} as Record<DecisionType, number>,
        byImpact: {} as Record<DecisionImpact, number>,
        byAgent: {} as Record<AgentType, number>,
      };

      decisions.forEach((decision) => {
        // 按类型统计
        stats.byType[decision.decisionType] = (stats.byType[decision.decisionType] || 0) + 1;

        // 按影响统计
        stats.byImpact[decision.impact] = (stats.byImpact[decision.impact] || 0) + 1;

        // 按 Agent 统计
        stats.byAgent[decision.agentType] = (stats.byAgent[decision.agentType] || 0) + 1;
      });

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get decision stats for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 搜索决策（按标题或组件）
   */
  async searchDecisions(
    sessionId: string,
    query: string
  ): Promise<ServiceResponse<DecisionRecord[]>> {
    try {
      const decisions = await DecisionRecord.findAll({
        where: {
          sessionId,
          [Op.or]: [
            { decisionTitle: { [Op.iLike]: `%${query}%` } },
            { affectedComponents: { [Op.contains]: [query] } },
          ],
        },
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: decisions,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to search decisions for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default new DecisionService();
