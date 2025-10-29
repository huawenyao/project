/**
 * Agent Handler for WebSocket
 *
 * T038-T040: WebSocket 事件处理
 * - agent:status:update - Agent 状态更新
 * - agent:output - Agent 输出结果
 * - agent:error - Agent 错误
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { AgentOrchestrator } from '../../services/AgentOrchestrator';

export interface AgentStatusUpdate {
  agentType: string;
  status: 'idle' | 'working' | 'waiting' | 'completed' | 'failed';
  currentTask?: string;
  progress?: number;
  message?: string;
  output?: any;
}

export interface AgentOutput {
  agentType: string;
  type: string;
  content: any;
  metadata?: any;
  timestamp: string;
}

export interface AgentError {
  agentType: string;
  error: string;
  taskId?: string;
  canRetry: boolean;
  timestamp: string;
}

/**
 * 初始化 Agent WebSocket 处理器
 */
export function initializeAgentHandler(io: SocketIOServer): void {
  const orchestrator = AgentOrchestrator.getInstance();

  io.on('connection', (socket: Socket) => {
    logger.info(`[AgentHandler] Client connected: ${socket.id}`);

    /**
     * 加入项目房间
     * 客户端加入特定项目的房间以接收该项目的 Agent 更新
     */
    socket.on('agent:join-project', (data: { projectId: string }) => {
      const { projectId } = data;

      if (!projectId) {
        socket.emit('agent:error', {
          error: 'Missing projectId',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      socket.join(`project:${projectId}`);
      logger.info(`[AgentHandler] Client ${socket.id} joined project room: ${projectId}`);

      // 发送当前 Agent 状态
      const agentStatus = orchestrator.getAgentStatus();
      socket.emit('agent:status:initial', agentStatus);
    });

    /**
     * 离开项目房间
     */
    socket.on('agent:leave-project', (data: { projectId: string }) => {
      const { projectId } = data;

      if (!projectId) {
        return;
      }

      socket.leave(`project:${projectId}`);
      logger.info(`[AgentHandler] Client ${socket.id} left project room: ${projectId}`);
    });

    /**
     * 获取所有 Agent 状态
     */
    socket.on('agent:get-status', (callback?: (status: any) => void) => {
      try {
        const status = orchestrator.getAgentStatus();
        if (callback) {
          callback({ success: true, data: status });
        } else {
          socket.emit('agent:status', status);
        }
      } catch (error) {
        logger.error('[AgentHandler] Error getting agent status:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to get agent status' });
        }
      }
    });

    /**
     * 获取活跃请求列表
     */
    socket.on('agent:get-active-requests', (callback?: (requests: any) => void) => {
      try {
        const requests = orchestrator.getActiveRequests();
        if (callback) {
          callback({ success: true, data: requests });
        } else {
          socket.emit('agent:active-requests', requests);
        }
      } catch (error) {
        logger.error('[AgentHandler] Error getting active requests:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to get active requests' });
        }
      }
    });

    /**
     * 取消请求
     */
    socket.on('agent:cancel-request', (data: { requestId: string }, callback?: (result: any) => void) => {
      try {
        const { requestId } = data;

        if (!requestId) {
          if (callback) {
            callback({ success: false, error: 'Missing requestId' });
          }
          return;
        }

        const cancelled = orchestrator.cancelRequest(requestId);

        if (callback) {
          callback({ success: cancelled });
        }

        if (cancelled) {
          // 通知所有相关客户端
          io.emit('agent:request-cancelled', { requestId });
        }
      } catch (error) {
        logger.error('[AgentHandler] Error cancelling request:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to cancel request' });
        }
      }
    });

    /**
     * 客户端断开连接
     */
    socket.on('disconnect', () => {
      logger.info(`[AgentHandler] Client disconnected: ${socket.id}`);
    });
  });

  // 监听 Orchestrator 事件并广播到客户端
  setupOrchestratorListeners(io, orchestrator);

  logger.info('[AgentHandler] Agent WebSocket handler initialized');
}

/**
 * 设置 Orchestrator 事件监听
 * 将内部事件转发到 WebSocket 客户端
 */
function setupOrchestratorListeners(io: SocketIOServer, orchestrator: AgentOrchestrator): void {
  // 步骤开始
  orchestrator.on('step_started', (data: { requestId: string; step: any }) => {
    const { requestId, step } = data;
    io.to(`project:${requestId}`).emit('agent:step:started', step);
  });

  // 步骤完成
  orchestrator.on('step_completed', (data: { requestId: string; step: any; progress: number }) => {
    const { requestId, step, progress } = data;
    io.to(`project:${requestId}`).emit('agent:step:completed', { step, progress });
  });

  // 步骤失败
  orchestrator.on('step_failed', (data: { requestId: string; step: any; error: any }) => {
    const { requestId, step, error } = data;
    io.to(`project:${requestId}`).emit('agent:step:failed', { step, error });
  });

  // 请求完成
  orchestrator.on('request_completed', (response: any) => {
    io.to(`project:${response.requestId}`).emit('agent:request:completed', response);
  });

  // 请求失败
  orchestrator.on('request_failed', (response: any) => {
    io.to(`project:${response.requestId}`).emit('agent:request:failed', response);
  });

  // 请求取消
  orchestrator.on('request_cancelled', (data: { requestId: string }) => {
    io.to(`project:${data.requestId}`).emit('agent:request:cancelled', data);
  });
}

/**
 * T039: 发送 Agent 状态更新到特定项目房间
 */
export function emitAgentStatusUpdate(
  io: SocketIOServer,
  projectId: string,
  status: AgentStatusUpdate
): void {
  io.to(`project:${projectId}`).emit('agent:status:update', {
    ...status,
    timestamp: new Date().toISOString(),
  });
}

/**
 * T040: 发送 Agent 输出到特定项目房间
 */
export function emitAgentOutput(
  io: SocketIOServer,
  projectId: string,
  output: AgentOutput
): void {
  io.to(`project:${projectId}`).emit('agent:output', {
    ...output,
    timestamp: output.timestamp || new Date().toISOString(),
  });
}

/**
 * 发送 Agent 错误到特定项目房间
 */
export function emitAgentError(
  io: SocketIOServer,
  projectId: string,
  error: AgentError
): void {
  io.to(`project:${projectId}`).emit('agent:error', {
    ...error,
    timestamp: error.timestamp || new Date().toISOString(),
  });
}

export default {
  initializeAgentHandler,
  emitAgentStatusUpdate,
  emitAgentOutput,
  emitAgentError,
};
