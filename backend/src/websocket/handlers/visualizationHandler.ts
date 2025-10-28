/**
 * Visualization WebSocket Handler
 *
 * 处理可视化系统的 WebSocket 事件
 */

import { Socket } from 'socket.io';
import visualizationService from '../../services/VisualizationService';
import agentStatusService from '../../services/AgentStatusService';
import decisionService from '../../services/DecisionService';
import errorService from '../../services/ErrorService';
import collaborationService from '../../services/CollaborationService';
import logger from '../../utils/logger';
import { AgentType } from '../../types/visualization.types';

/**
 * 注册可视化相关的 WebSocket 事件处理器
 */
export function registerVisualizationHandlers(socket: Socket): void {
  logger.info(`Registering visualization handlers for socket ${socket.id}`);

  // 加入会话房间
  socket.on('visualization:join-session', async (data: { sessionId: string }) => {
    try {
      const { sessionId } = data;

      // 加入会话专属房间
      await socket.join(`session-${sessionId}`);

      logger.info(`Socket ${socket.id} joined session room: ${sessionId}`);

      // 发送初始会话数据
      const snapshotResult = await visualizationService.getSessionSnapshot(sessionId);

      if (snapshotResult.success) {
        socket.emit('visualization:session-snapshot', snapshotResult.data);
      } else {
        socket.emit('visualization:error', {
          message: snapshotResult.error,
          type: 'join_session_error',
        });
      }
    } catch (error: any) {
      logger.error('Error joining session:', error);
      socket.emit('visualization:error', {
        message: error.message,
        type: 'join_session_error',
      });
    }
  });

  // 离开会话房间
  socket.on('visualization:leave-session', async (data: { sessionId: string }) => {
    try {
      const { sessionId } = data;
      await socket.leave(`session-${sessionId}`);
      logger.info(`Socket ${socket.id} left session room: ${sessionId}`);
    } catch (error: any) {
      logger.error('Error leaving session:', error);
    }
  });

  // 获取会话详情
  socket.on('visualization:get-session-details', async (data: { sessionId: string }) => {
    try {
      const { sessionId } = data;
      const result = await visualizationService.getSessionDetails(sessionId);

      socket.emit('visualization:session-details', result);
    } catch (error: any) {
      logger.error('Error getting session details:', error);
      socket.emit('visualization:error', {
        message: error.message,
        type: 'get_session_error',
      });
    }
  });

  // 获取 Agent 状态
  socket.on('visualization:get-agent-statuses', async (data: { sessionId: string }) => {
    try {
      const { sessionId } = data;
      const result = await agentStatusService.getSessionStatuses(sessionId);

      socket.emit('visualization:agent-statuses', result);
    } catch (error: any) {
      logger.error('Error getting agent statuses:', error);
      socket.emit('visualization:error', {
        message: error.message,
        type: 'get_agent_statuses_error',
      });
    }
  });

  // 获取决策记录
  socket.on('visualization:get-decisions', async (data: { sessionId: string; page?: number; pageSize?: number }) => {
    try {
      const { sessionId, page = 1, pageSize = 50 } = data;
      const result = await decisionService.getSessionDecisions(sessionId, page, pageSize);

      socket.emit('visualization:decisions', result);
    } catch (error: any) {
      logger.error('Error getting decisions:', error);
      socket.emit('visualization:error', {
        message: error.message,
        type: 'get_decisions_error',
      });
    }
  });

  // 获取错误记录
  socket.on('visualization:get-errors', async (data: { sessionId: string }) => {
    try {
      const { sessionId } = data;
      const result = await errorService.getSessionErrors(sessionId);

      socket.emit('visualization:errors', result);
    } catch (error: any) {
      logger.error('Error getting errors:', error);
      socket.emit('visualization:error', {
        message: error.message,
        type: 'get_errors_error',
      });
    }
  });

  // 获取协作事件
  socket.on('visualization:get-collaborations', async (data: { sessionId: string }) => {
    try {
      const { sessionId } = data;
      const result = await collaborationService.getSessionCollaborations(sessionId);

      socket.emit('visualization:collaborations', result);
    } catch (error: any) {
      logger.error('Error getting collaborations:', error);
      socket.emit('visualization:error', {
        message: error.message,
        type: 'get_collaborations_error',
      });
    }
  });

  // 获取预览数据
  socket.on('visualization:get-previews', async (data: { sessionId: string; agentType?: AgentType }) => {
    try {
      const { sessionId, agentType } = data;
      let result;

      if (agentType) {
        result = await decisionService.getPreviewsByAgent(sessionId, agentType);
      } else {
        result = await decisionService.getSessionPreviews(sessionId);
      }

      socket.emit('visualization:previews', result);
    } catch (error: any) {
      logger.error('Error getting previews:', error);
      socket.emit('visualization:error', {
        message: error.message,
        type: 'get_previews_error',
      });
    }
  });

  // 获取统计数据
  socket.on('visualization:get-stats', async (data: { sessionId: string }) => {
    try {
      const { sessionId } = data;

      const [
        progressResult,
        decisionStatsResult,
        errorStatsResult,
        collaborationStatsResult,
      ] = await Promise.all([
        agentStatusService.calculateSessionProgress(sessionId),
        decisionService.getDecisionStats(sessionId),
        errorService.getErrorStats(sessionId),
        collaborationService.getCollaborationStats(sessionId),
      ]);

      socket.emit('visualization:stats', {
        progress: progressResult.data,
        decisions: decisionStatsResult.data,
        errors: errorStatsResult.data,
        collaborations: collaborationStatsResult.data,
      });
    } catch (error: any) {
      logger.error('Error getting stats:', error);
      socket.emit('visualization:error', {
        message: error.message,
        type: 'get_stats_error',
      });
    }
  });

  // 获取协作流程图
  socket.on('visualization:get-collaboration-flow', async (data: { sessionId: string }) => {
    try {
      const { sessionId } = data;
      const result = await collaborationService.getCollaborationFlow(sessionId);

      socket.emit('visualization:collaboration-flow', result);
    } catch (error: any) {
      logger.error('Error getting collaboration flow:', error);
      socket.emit('visualization:error', {
        message: error.message,
        type: 'get_collaboration_flow_error',
      });
    }
  });

  // 搜索决策
  socket.on('visualization:search-decisions', async (data: { sessionId: string; query: string }) => {
    try {
      const { sessionId, query } = data;
      const result = await decisionService.searchDecisions(sessionId, query);

      socket.emit('visualization:search-results', result);
    } catch (error: any) {
      logger.error('Error searching decisions:', error);
      socket.emit('visualization:error', {
        message: error.message,
        type: 'search_decisions_error',
      });
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    logger.info(`Socket ${socket.id} disconnected from visualization`);
  });
}
