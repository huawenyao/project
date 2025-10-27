/**
 * Visualization Service
 *
 * 核心可视化服务 - 管理构建会话和整体可视化数据流
 */

import { BuildSession, AgentWorkStatus, DecisionRecord, AgentErrorRecord, CollaborationEvent, PreviewData, UserInteractionMetric } from '../models';
import { BuildSessionCreationAttributes, AgentType, ServiceResponse, PaginatedResponse } from '../types/visualization.types';
import logger from '../utils/logger';
import { Op } from 'sequelize';

export class VisualizationService {
  /**
   * 创建新的构建会话
   */
  async createSession(data: BuildSessionCreationAttributes): Promise<ServiceResponse<BuildSession>> {
    try {
      const session = await BuildSession.create(data);
      logger.info(`Created build session: ${session.sessionId}`);

      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to create build session:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取会话详情（包含所有关联数据）
   */
  async getSessionDetails(sessionId: string): Promise<ServiceResponse<any>> {
    try {
      const session = await BuildSession.findByPk(sessionId, {
        include: [
          { model: AgentWorkStatus, as: 'agentStatuses' },
          { model: DecisionRecord, as: 'decisions' },
          { model: AgentErrorRecord, as: 'errors' },
          { model: CollaborationEvent, as: 'collaborationEvents' },
          { model: PreviewData, as: 'previews' },
        ],
      });

      if (!session) {
        return {
          success: false,
          error: 'Session not found',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get session details for ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 更新会话状态
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'in_progress' | 'success' | 'failed' | 'partial_success',
    endTime?: Date
  ): Promise<ServiceResponse<BuildSession>> {
    try {
      const session = await BuildSession.findByPk(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found',
          timestamp: new Date().toISOString(),
        };
      }

      session.status = status;
      if (endTime) {
        session.endTime = endTime;
      }
      await session.save();

      logger.info(`Updated session ${sessionId} status to ${status}`);

      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to update session status for ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 归档会话（热数据转冷数据）
   */
  async archiveSession(sessionId: string, storagePath: string): Promise<ServiceResponse<BuildSession>> {
    try {
      const session = await BuildSession.findByPk(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found',
          timestamp: new Date().toISOString(),
        };
      }

      session.archived = true;
      session.archivedAt = new Date();
      session.storagePath = storagePath;
      await session.save();

      logger.info(`Archived session ${sessionId} to ${storagePath}`);

      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to archive session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取用户的会话列表（分页）
   */
  async getUserSessions(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    includeArchived: boolean = false
  ): Promise<ServiceResponse<PaginatedResponse<BuildSession>>> {
    try {
      const offset = (page - 1) * pageSize;
      const where: any = { userId };

      if (!includeArchived) {
        where.archived = false;
      }

      const { count, rows } = await BuildSession.findAndCountAll({
        where,
        limit: pageSize,
        offset,
        order: [['startTime', 'DESC']],
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
      logger.error(`Failed to get sessions for user ${userId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取项目的会话列表
   */
  async getProjectSessions(
    projectId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ServiceResponse<PaginatedResponse<BuildSession>>> {
    try {
      const offset = (page - 1) * pageSize;

      const { count, rows } = await BuildSession.findAndCountAll({
        where: { projectId, archived: false },
        limit: pageSize,
        offset,
        order: [['startTime', 'DESC']],
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
      logger.error(`Failed to get sessions for project ${projectId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取待归档的会话（超过30天的成功会话）
   */
  async getSessionsToArchive(): Promise<ServiceResponse<BuildSession[]>> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sessions = await BuildSession.findAll({
        where: {
          archived: false,
          status: { [Op.in]: ['success', 'partial_success'] },
          endTime: { [Op.lt]: thirtyDaysAgo },
        },
        limit: 100, // 每次批量处理100个
      });

      return {
        success: true,
        data: sessions,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to get sessions to archive:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取会话的实时快照（用于 WebSocket 推送）
   */
  async getSessionSnapshot(sessionId: string): Promise<ServiceResponse<any>> {
    try {
      const session = await BuildSession.findByPk(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found',
          timestamp: new Date().toISOString(),
        };
      }

      // 获取最新的 Agent 状态
      const agentStatuses = await AgentWorkStatus.findAll({
        where: { sessionId },
        order: [['updatedAt', 'DESC']],
      });

      // 获取最近的决策（最多5条）
      const recentDecisions = await DecisionRecord.findAll({
        where: { sessionId },
        order: [['timestamp', 'DESC']],
        limit: 5,
      });

      // 获取未解决的错误
      const unresolvedErrors = await AgentErrorRecord.findAll({
        where: {
          sessionId,
          resolution: { [Op.in]: ['unresolved', 'retrying', 'user_intervention_required'] },
        },
        order: [['timestamp', 'DESC']],
      });

      // 获取最近的协作事件（最多10条）
      const recentCollaborations = await CollaborationEvent.findAll({
        where: { sessionId },
        order: [['timestamp', 'DESC']],
        limit: 10,
      });

      const snapshot = {
        session,
        agentStatuses,
        recentDecisions,
        unresolvedErrors,
        recentCollaborations,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        data: snapshot,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get session snapshot for ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 删除会话及其所有关联数据
   */
  async deleteSession(sessionId: string): Promise<ServiceResponse<void>> {
    try {
      const session = await BuildSession.findByPk(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Sequelize 会通过 ON DELETE CASCADE 自动删除关联数据
      await session.destroy();

      logger.info(`Deleted session ${sessionId}`);

      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to delete session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default new VisualizationService();
