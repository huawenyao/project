/**
 * Agent Status Tracker
 *
 * 追踪和更新 Agent 工作状态，与 AgentOrchestrator 集成
 * 负责状态变更检测和 WebSocket 事件触发
 * T096: [US3] Add persona data to agent status updates
 */

import AgentWorkStatus from '../models/AgentWorkStatus.model';
import { AgentPersona } from '../models/AgentPersona.model';
import { visualizationEmitter } from '../websocket/visualizationEmitter';
import logger from '../utils/logger';

export type AgentType = 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
export type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying' | 'skipped';

interface StatusUpdate {
  sessionId: string;
  agentType: AgentType;
  status: AgentStatus;
  taskDescription?: string;
  progressPercentage?: number;
  currentOperation?: string;
  estimatedTimeRemaining?: number;
  retryCount?: number;
  errorMessage?: string;
}

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class AgentStatusTracker {
  /**
   * 追踪 Agent 开始工作
   */
  async startAgent(params: {
    sessionId: string;
    agentType: AgentType;
    taskDescription: string;
    estimatedDuration?: number;
  }): Promise<ServiceResponse<AgentWorkStatus>> {
    try {
      const { sessionId, agentType, taskDescription, estimatedDuration } = params;

      logger.info(`[AgentStatusTracker] Starting ${agentType} for session ${sessionId}`);

      // 创建新的状态记录
      const status = await AgentWorkStatus.create({
        sessionId,
        agentType,
        status: 'in_progress',
        taskDescription,
        progressPercentage: 0,
        currentOperation: 'Initializing...',
        estimatedDuration: estimatedDuration || null,
        retryCount: 0,
        maxRetry: 3,
        startTime: new Date(),
      });

      // T096: 获取 Agent 的 persona 数据
      const persona = await AgentPersona.findByPk(agentType);

      // 触发 WebSocket 事件（包含 persona 数据）
      visualizationEmitter.emitAgentStatusUpdate(sessionId, {
        statusId: status.statusId,
        sessionId: status.sessionId,
        agentType: status.agentType,
        status: status.status,
        taskDescription: status.taskDescription,
        progressPercentage: status.progressPercentage,
        currentOperation: status.currentOperation,
        startTime: status.startTime?.toISOString(),
        retryCount: status.retryCount,
        maxRetry: status.maxRetry,
        createdAt: status.createdAt.toISOString(),
        updatedAt: status.updatedAt.toISOString(),
        // 添加 persona 数据
        persona: persona ? {
          displayName: persona.displayName,
          avatarUrl: persona.avatarUrl,
          personalityTone: persona.personalityTone,
          description: persona.description,
        } : undefined,
      });

      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      logger.error('[AgentStatusTracker] Error starting agent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 更新 Agent 进度
   */
  async updateProgress(params: {
    statusId: string;
    progressPercentage: number;
    currentOperation?: string;
    estimatedTimeRemaining?: number;
  }): Promise<ServiceResponse<AgentWorkStatus>> {
    try {
      const { statusId, progressPercentage, currentOperation, estimatedTimeRemaining } = params;

      const status = await AgentWorkStatus.findByPk(statusId);
      if (!status) {
        return {
          success: false,
          error: 'Agent status not found',
        };
      }

      // 更新进度
      await status.update({
        progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
        currentOperation: currentOperation || status.currentOperation,
        estimatedTimeRemaining: estimatedTimeRemaining !== undefined ? estimatedTimeRemaining : status.estimatedTimeRemaining,
        updatedAt: new Date(),
      });

      logger.debug(`[AgentStatusTracker] Progress update: ${status.agentType} - ${progressPercentage}%`);

      // 触发 WebSocket 事件（高频）
      visualizationEmitter.emitAgentStatusUpdate(
        status.sessionId,
        {
          statusId: status.statusId,
          sessionId: status.sessionId,
          agentType: status.agentType,
          status: status.status,
          taskDescription: status.taskDescription,
          progressPercentage: status.progressPercentage,
          currentOperation: status.currentOperation,
          estimatedTimeRemaining: status.estimatedTimeRemaining,
          startTime: status.startTime?.toISOString(),
          retryCount: status.retryCount,
          maxRetry: status.maxRetry,
          createdAt: status.createdAt.toISOString(),
          updatedAt: status.updatedAt.toISOString(),
        },
        'high' // 高优先级，快速推送
      );

      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      logger.error('[AgentStatusTracker] Error updating progress:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 完成 Agent 工作
   */
  async completeAgent(params: {
    statusId: string;
    resultSummary?: string;
  }): Promise<ServiceResponse<AgentWorkStatus>> {
    try {
      const { statusId, resultSummary } = params;

      const status = await AgentWorkStatus.findByPk(statusId);
      if (!status) {
        return {
          success: false,
          error: 'Agent status not found',
        };
      }

      await status.update({
        status: 'completed',
        progressPercentage: 100,
        currentOperation: 'Completed',
        resultSummary: resultSummary || null,
        endTime: new Date(),
        updatedAt: new Date(),
      });

      logger.info(`[AgentStatusTracker] ${status.agentType} completed for session ${status.sessionId}`);

      // 触发 WebSocket 事件
      visualizationEmitter.emitAgentStatusUpdate(
        status.sessionId,
        {
          statusId: status.statusId,
          sessionId: status.sessionId,
          agentType: status.agentType,
          status: status.status,
          taskDescription: status.taskDescription,
          progressPercentage: status.progressPercentage,
          currentOperation: status.currentOperation,
          resultSummary: status.resultSummary,
          startTime: status.startTime?.toISOString(),
          endTime: status.endTime?.toISOString(),
          retryCount: status.retryCount,
          maxRetry: status.maxRetry,
          createdAt: status.createdAt.toISOString(),
          updatedAt: status.updatedAt.toISOString(),
        },
        'high' // 完成事件高优先级
      );

      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      logger.error('[AgentStatusTracker] Error completing agent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Agent 失败
   */
  async failAgent(params: {
    statusId: string;
    errorMessage: string;
    canRetry?: boolean;
  }): Promise<ServiceResponse<AgentWorkStatus>> {
    try {
      const { statusId, errorMessage, canRetry = true } = params;

      const status = await AgentWorkStatus.findByPk(statusId);
      if (!status) {
        return {
          success: false,
          error: 'Agent status not found',
        };
      }

      const newRetryCount = status.retryCount + 1;
      const shouldRetry = canRetry && newRetryCount < (status.maxRetry || 3);

      await status.update({
        status: shouldRetry ? 'retrying' : 'failed',
        errorMessage,
        retryCount: newRetryCount,
        currentOperation: shouldRetry ? `Retrying (${newRetryCount}/${status.maxRetry})...` : 'Failed',
        endTime: shouldRetry ? null : new Date(),
        updatedAt: new Date(),
      });

      logger.warn(`[AgentStatusTracker] ${status.agentType} ${shouldRetry ? 'retrying' : 'failed'}: ${errorMessage}`);

      // 触发 WebSocket 事件
      visualizationEmitter.emitAgentStatusUpdate(
        status.sessionId,
        {
          statusId: status.statusId,
          sessionId: status.sessionId,
          agentType: status.agentType,
          status: status.status,
          taskDescription: status.taskDescription,
          progressPercentage: status.progressPercentage,
          currentOperation: status.currentOperation,
          errorMessage: status.errorMessage,
          retryCount: status.retryCount,
          maxRetry: status.maxRetry,
          startTime: status.startTime?.toISOString(),
          endTime: status.endTime?.toISOString(),
          createdAt: status.createdAt.toISOString(),
          updatedAt: status.updatedAt.toISOString(),
        },
        'critical' // 错误事件最高优先级
      );

      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      logger.error('[AgentStatusTracker] Error failing agent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 跳过 Agent
   */
  async skipAgent(params: {
    sessionId: string;
    agentType: AgentType;
    reason: string;
  }): Promise<ServiceResponse<AgentWorkStatus>> {
    try {
      const { sessionId, agentType, reason } = params;

      const status = await AgentWorkStatus.create({
        sessionId,
        agentType,
        status: 'skipped',
        taskDescription: reason,
        progressPercentage: 0,
        currentOperation: 'Skipped',
        retryCount: 0,
        maxRetry: 0,
        startTime: new Date(),
        endTime: new Date(),
      });

      logger.info(`[AgentStatusTracker] ${agentType} skipped: ${reason}`);

      // 触发 WebSocket 事件（低优先级）
      visualizationEmitter.emitAgentStatusUpdate(
        sessionId,
        {
          statusId: status.statusId,
          sessionId: status.sessionId,
          agentType: status.agentType,
          status: status.status,
          taskDescription: status.taskDescription,
          progressPercentage: status.progressPercentage,
          currentOperation: status.currentOperation,
          startTime: status.startTime?.toISOString(),
          endTime: status.endTime?.toISOString(),
          retryCount: status.retryCount,
          maxRetry: status.maxRetry,
          createdAt: status.createdAt.toISOString(),
          updatedAt: status.updatedAt.toISOString(),
        },
        'low'
      );

      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      logger.error('[AgentStatusTracker] Error skipping agent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 批量更新多个 Agent 状态
   */
  async batchUpdateStatuses(updates: StatusUpdate[]): Promise<ServiceResponse<AgentWorkStatus[]>> {
    try {
      const results: AgentWorkStatus[] = [];

      for (const update of updates) {
        const status = await AgentWorkStatus.findOne({
          where: {
            sessionId: update.sessionId,
            agentType: update.agentType,
          },
          order: [['createdAt', 'DESC']],
        });

        if (status) {
          await status.update({
            status: update.status,
            taskDescription: update.taskDescription || status.taskDescription,
            progressPercentage: update.progressPercentage !== undefined ? update.progressPercentage : status.progressPercentage,
            currentOperation: update.currentOperation || status.currentOperation,
            estimatedTimeRemaining: update.estimatedTimeRemaining !== undefined ? update.estimatedTimeRemaining : status.estimatedTimeRemaining,
            retryCount: update.retryCount !== undefined ? update.retryCount : status.retryCount,
            errorMessage: update.errorMessage || status.errorMessage,
            updatedAt: new Date(),
          });

          results.push(status);

          // 触发 WebSocket 事件
          visualizationEmitter.emitAgentStatusUpdate(status.sessionId, {
            statusId: status.statusId,
            sessionId: status.sessionId,
            agentType: status.agentType,
            status: status.status,
            taskDescription: status.taskDescription,
            progressPercentage: status.progressPercentage,
            currentOperation: status.currentOperation,
            estimatedTimeRemaining: status.estimatedTimeRemaining,
            errorMessage: status.errorMessage,
            retryCount: status.retryCount,
            maxRetry: status.maxRetry,
            createdAt: status.createdAt.toISOString(),
            updatedAt: status.updatedAt.toISOString(),
          });
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      logger.error('[AgentStatusTracker] Error batch updating statuses:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取当前活跃的 Agent
   */
  async getActiveAgents(sessionId: string): Promise<ServiceResponse<AgentWorkStatus[]>> {
    try {
      const activeStatuses = await AgentWorkStatus.findAll({
        where: {
          sessionId,
          status: ['in_progress', 'retrying'],
        },
        order: [['updatedAt', 'DESC']],
      });

      return {
        success: true,
        data: activeStatuses,
      };
    } catch (error: any) {
      logger.error('[AgentStatusTracker] Error getting active agents:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// 导出单例
export const agentStatusTracker = new AgentStatusTracker();
export default agentStatusTracker;
