/**
 * Agent Status Service
 *
 * Agent 状态管理服务 - 跟踪和更新 Agent 工作状态
 */

import { AgentWorkStatus, AgentPersona } from '../models';
import {
  AgentWorkStatusCreationAttributes,
  AgentType,
  AgentStatus,
  ServiceResponse,
  Priority,
} from '../types/visualization.types';
import logger from '../utils/logger';
import { Op } from 'sequelize';

export class AgentStatusService {
  /**
   * 创建新的 Agent 状态记录
   */
  async createStatus(data: AgentWorkStatusCreationAttributes): Promise<ServiceResponse<AgentWorkStatus>> {
    try {
      const status = await AgentWorkStatus.create(data);
      logger.info(`Created agent status: ${status.statusId} for ${status.agentType}`);

      return {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to create agent status:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 更新 Agent 状态
   */
  async updateStatus(
    statusId: string,
    updates: {
      status?: AgentStatus;
      progressPercentage?: number;
      startTime?: Date;
      endTime?: Date;
      lastError?: string;
    }
  ): Promise<ServiceResponse<AgentWorkStatus>> {
    try {
      const agentStatus = await AgentWorkStatus.findByPk(statusId);
      if (!agentStatus) {
        return {
          success: false,
          error: 'Agent status not found',
          timestamp: new Date().toISOString(),
        };
      }

      // 更新字段
      if (updates.status !== undefined) {
        agentStatus.status = updates.status;

        // 自动设置开始/结束时间
        if (updates.status === 'in_progress' && !agentStatus.startTime) {
          agentStatus.startTime = new Date();
        }
        if (['completed', 'failed', 'skipped'].includes(updates.status) && !agentStatus.endTime) {
          agentStatus.endTime = new Date();
        }
      }

      if (updates.progressPercentage !== undefined) {
        agentStatus.progressPercentage = Math.min(100, Math.max(0, updates.progressPercentage));
      }

      if (updates.startTime !== undefined) {
        agentStatus.startTime = updates.startTime;
      }

      if (updates.endTime !== undefined) {
        agentStatus.endTime = updates.endTime;
      }

      if (updates.lastError !== undefined) {
        agentStatus.lastError = updates.lastError;
      }

      await agentStatus.save();

      logger.info(`Updated agent status ${statusId}: ${agentStatus.status} (${agentStatus.progressPercentage}%)`);

      return {
        success: true,
        data: agentStatus,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to update agent status ${statusId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 增加重试计数
   */
  async incrementRetry(statusId: string): Promise<ServiceResponse<AgentWorkStatus>> {
    try {
      const agentStatus = await AgentWorkStatus.findByPk(statusId);
      if (!agentStatus) {
        return {
          success: false,
          error: 'Agent status not found',
          timestamp: new Date().toISOString(),
        };
      }

      agentStatus.retryCount += 1;

      // 如果达到最大重试次数，标记为失败
      if (agentStatus.retryCount >= agentStatus.maxRetry) {
        agentStatus.status = 'failed';
        agentStatus.endTime = new Date();
      } else {
        agentStatus.status = 'retrying';
      }

      await agentStatus.save();

      logger.info(
        `Incremented retry count for ${statusId}: ${agentStatus.retryCount}/${agentStatus.maxRetry}`
      );

      return {
        success: true,
        data: agentStatus,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to increment retry for ${statusId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取会话的所有 Agent 状态
   */
  async getSessionStatuses(sessionId: string): Promise<ServiceResponse<AgentWorkStatus[]>> {
    try {
      const statuses = await AgentWorkStatus.findAll({
        where: { sessionId },
        order: [['createdAt', 'ASC']],
      });

      return {
        success: true,
        data: statuses,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get statuses for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取特定 Agent 的当前状态
   */
  async getAgentCurrentStatus(sessionId: string, agentType: AgentType): Promise<ServiceResponse<AgentWorkStatus | null>> {
    try {
      const status = await AgentWorkStatus.findOne({
        where: { sessionId, agentType },
        order: [['createdAt', 'DESC']],
      });

      return {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get current status for ${agentType} in session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取活跃的 Agent（正在工作或待处理）
   */
  async getActiveAgents(sessionId: string): Promise<ServiceResponse<AgentWorkStatus[]>> {
    try {
      const statuses = await AgentWorkStatus.findAll({
        where: {
          sessionId,
          status: { [Op.in]: ['pending', 'in_progress', 'retrying'] },
        },
        order: [['createdAt', 'ASC']],
      });

      return {
        success: true,
        data: statuses,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get active agents for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取失败的 Agent（需要用户干预）
   */
  async getFailedAgents(sessionId: string): Promise<ServiceResponse<AgentWorkStatus[]>> {
    try {
      const statuses = await AgentWorkStatus.findAll({
        where: {
          sessionId,
          status: 'failed',
        },
        order: [['createdAt', 'ASC']],
      });

      return {
        success: true,
        data: statuses,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get failed agents for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取 Agent 拟人化配置
   */
  async getAgentPersona(agentType: AgentType): Promise<ServiceResponse<AgentPersona | null>> {
    try {
      const persona = await AgentPersona.findByPk(agentType);

      return {
        success: true,
        data: persona,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get persona for ${agentType}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取所有 Agent 拟人化配置
   */
  async getAllAgentPersonas(): Promise<ServiceResponse<AgentPersona[]>> {
    try {
      const personas = await AgentPersona.findAll({
        order: [['priority', 'DESC']],
      });

      return {
        success: true,
        data: personas,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to get all agent personas:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取 Agent 的更新频率（用于 WebSocket 推送间隔）
   */
  async getAgentUpdateFrequency(agentType: AgentType): Promise<number> {
    try {
      const persona = await AgentPersona.findByPk(agentType);
      return persona?.updateFrequency || 1000; // 默认 1 秒
    } catch (error: any) {
      logger.error(`Failed to get update frequency for ${agentType}:`, error);
      return 1000; // 默认 1 秒
    }
  }

  /**
   * 按优先级获取 Agent（用于决定更新频率）
   */
  async getAgentsByPriority(priority: Priority): Promise<ServiceResponse<AgentPersona[]>> {
    try {
      const personas = await AgentPersona.findAll({
        where: { priority },
      });

      return {
        success: true,
        data: personas,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get agents by priority ${priority}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 计算会话的整体进度
   */
  async calculateSessionProgress(sessionId: string): Promise<ServiceResponse<number>> {
    try {
      const statuses = await AgentWorkStatus.findAll({
        where: { sessionId },
      });

      if (statuses.length === 0) {
        return {
          success: true,
          data: 0,
          timestamp: new Date().toISOString(),
        };
      }

      const totalProgress = statuses.reduce((sum, status) => sum + status.progressPercentage, 0);
      const averageProgress = Math.round(totalProgress / statuses.length);

      return {
        success: true,
        data: averageProgress,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to calculate session progress for ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default new AgentStatusService();
