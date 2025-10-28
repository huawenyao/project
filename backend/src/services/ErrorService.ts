/**
 * Error Service
 *
 * 错误管理服务 - 跟踪和管理 Agent 执行过程中的错误
 */

import { AgentErrorRecord } from '../models';
import {
  ErrorRecordCreationAttributes,
  AgentType,
  ErrorSeverity,
  ErrorResolution,
  ServiceResponse,
} from '../types/visualization.types';
import logger from '../utils/logger';
import { Op } from 'sequelize';

export class ErrorService {
  /**
   * 记录错误
   */
  async recordError(data: ErrorRecordCreationAttributes): Promise<ServiceResponse<AgentErrorRecord>> {
    try {
      const error = await AgentErrorRecord.create(data);
      logger.error(`Recorded error: ${error.errorId} - ${error.errorCode}: ${error.errorMessage}`);

      return {
        success: true,
        data: error,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to record error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 更新错误解决状态
   */
  async updateErrorResolution(
    errorId: string,
    resolution: ErrorResolution,
    resolutionNotes?: string
  ): Promise<ServiceResponse<AgentErrorRecord>> {
    try {
      const error = await AgentErrorRecord.findByPk(errorId);
      if (!error) {
        return {
          success: false,
          error: 'Error record not found',
          timestamp: new Date().toISOString(),
        };
      }

      error.resolution = resolution;
      if (resolutionNotes) {
        error.resolutionNotes = resolutionNotes;
      }
      await error.save();

      logger.info(`Updated error ${errorId} resolution to ${resolution}`);

      return {
        success: true,
        data: error,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to update error resolution for ${errorId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取会话的所有错误
   */
  async getSessionErrors(sessionId: string): Promise<ServiceResponse<AgentErrorRecord[]>> {
    try {
      const errors = await AgentErrorRecord.findAll({
        where: { sessionId },
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get errors for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取未解决的错误
   */
  async getUnresolvedErrors(sessionId: string): Promise<ServiceResponse<AgentErrorRecord[]>> {
    try {
      const errors = await AgentErrorRecord.findAll({
        where: {
          sessionId,
          resolution: { [Op.in]: ['unresolved', 'retrying', 'user_intervention_required'] },
        },
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get unresolved errors for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取关键错误
   */
  async getCriticalErrors(sessionId: string): Promise<ServiceResponse<AgentErrorRecord[]>> {
    try {
      const errors = await AgentErrorRecord.findAll({
        where: {
          sessionId,
          severity: { [Op.in]: ['critical', 'high'] },
        },
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get critical errors for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 按 Agent 类型获取错误
   */
  async getErrorsByAgent(
    sessionId: string,
    agentType: AgentType
  ): Promise<ServiceResponse<AgentErrorRecord[]>> {
    try {
      const errors = await AgentErrorRecord.findAll({
        where: { sessionId, agentType },
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get errors for ${agentType} in session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取错误统计
   */
  async getErrorStats(sessionId: string): Promise<ServiceResponse<any>> {
    try {
      const errors = await AgentErrorRecord.findAll({
        where: { sessionId },
      });

      const stats = {
        total: errors.length,
        bySeverity: {} as Record<ErrorSeverity, number>,
        byResolution: {} as Record<ErrorResolution, number>,
        byAgent: {} as Record<AgentType, number>,
        unresolvedCount: 0,
        criticalCount: 0,
      };

      errors.forEach((error) => {
        // 按严重程度统计
        stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

        // 按解决状态统计
        stats.byResolution[error.resolution] = (stats.byResolution[error.resolution] || 0) + 1;

        // 按 Agent 统计
        stats.byAgent[error.agentType] = (stats.byAgent[error.agentType] || 0) + 1;

        // 未解决数量
        if (['unresolved', 'retrying', 'user_intervention_required'].includes(error.resolution)) {
          stats.unresolvedCount++;
        }

        // 关键错误数量
        if (['critical', 'high'].includes(error.severity)) {
          stats.criticalCount++;
        }
      });

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get error stats for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 批量解决错误
   */
  async resolveMultipleErrors(
    errorIds: string[],
    resolution: ErrorResolution,
    resolutionNotes?: string
  ): Promise<ServiceResponse<number>> {
    try {
      const [updatedCount] = await AgentErrorRecord.update(
        {
          resolution,
          resolutionNotes,
        },
        {
          where: { errorId: { [Op.in]: errorIds } },
        }
      );

      logger.info(`Batch resolved ${updatedCount} errors with status ${resolution}`);

      return {
        success: true,
        data: updatedCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to batch resolve errors:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default new ErrorService();
