/**
 * Visualization Scheduler
 *
 * 定时任务调度器 - 根据 Agent 优先级动态调整可视化更新频率
 */

import cron from 'node-cron';
import visualizationService from '../services/VisualizationService';
import agentStatusService from '../services/AgentStatusService';
import visualizationEmitter from '../websocket/visualizationEmitter';
import logger from '../utils/logger';
import { AgentType } from '../types/visualization.types';

export class VisualizationScheduler {
  private highPriorityInterval: NodeJS.Timeout | null = null;
  private lowPriorityInterval: NodeJS.Timeout | null = null;
  private archiveJob: cron.ScheduledTask | null = null;
  private activeSessions: Set<string> = new Set();

  /**
   * 启动调度器
   */
  start(): void {
    logger.info('Starting Visualization Scheduler...');

    // 高优先级 Agent 更新（200-500ms）
    this.startHighPriorityUpdates();

    // 低优先级 Agent 更新（1-2s）
    this.startLowPriorityUpdates();

    // 归档任务（每天凌晨 2 点执行）
    this.startArchiveJob();

    logger.info('Visualization Scheduler started successfully');
  }

  /**
   * 停止调度器
   */
  stop(): void {
    logger.info('Stopping Visualization Scheduler...');

    if (this.highPriorityInterval) {
      clearInterval(this.highPriorityInterval);
      this.highPriorityInterval = null;
    }

    if (this.lowPriorityInterval) {
      clearInterval(this.lowPriorityInterval);
      this.lowPriorityInterval = null;
    }

    if (this.archiveJob) {
      this.archiveJob.stop();
      this.archiveJob = null;
    }

    this.activeSessions.clear();

    logger.info('Visualization Scheduler stopped');
  }

  /**
   * 注册活跃会话
   */
  registerSession(sessionId: string): void {
    this.activeSessions.add(sessionId);
    logger.info(`Session ${sessionId} registered for real-time updates`);
  }

  /**
   * 注销活跃会话
   */
  unregisterSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    logger.info(`Session ${sessionId} unregistered from real-time updates`);
  }

  /**
   * 启动高优先级 Agent 更新（300ms 间隔）
   */
  private startHighPriorityUpdates(): void {
    this.highPriorityInterval = setInterval(async () => {
      try {
        const highPriorityAgents: AgentType[] = ['UIAgent', 'BackendAgent', 'DatabaseAgent'];

        for (const sessionId of this.activeSessions) {
          // 检查会话是否有活跃客户端
          const hasClients = await visualizationEmitter.hasActiveClients(sessionId);
          if (!hasClients) {
            continue;
          }

          // 获取高优先级 Agent 的状态
          for (const agentType of highPriorityAgents) {
            const result = await agentStatusService.getAgentCurrentStatus(sessionId, agentType);
            if (result.success && result.data) {
              const status = result.data;

              // 只推送正在进行或重试中的 Agent
              if (['in_progress', 'retrying'].includes(status.status)) {
                visualizationEmitter.emitAgentStatusUpdate(sessionId, {
                  statusId: status.statusId,
                  agentType: status.agentType,
                  status: status.status,
                  progressPercentage: status.progressPercentage,
                  taskDescription: status.taskDescription,
                });
              }
            }
          }

          // 推送整体进度
          const progressResult = await agentStatusService.calculateSessionProgress(sessionId);
          if (progressResult.success && progressResult.data !== undefined) {
            visualizationEmitter.emitProgressUpdate(sessionId, progressResult.data);
          }
        }
      } catch (error: any) {
        logger.error('Error in high priority update:', error);
      }
    }, 300); // 300ms

    logger.info('High priority updates started (300ms interval)');
  }

  /**
   * 启动低优先级 Agent 更新（1.5s 间隔）
   */
  private startLowPriorityUpdates(): void {
    this.lowPriorityInterval = setInterval(async () => {
      try {
        const lowPriorityAgents: AgentType[] = ['IntegrationAgent', 'DeploymentAgent'];

        for (const sessionId of this.activeSessions) {
          // 检查会话是否有活跃客户端
          const hasClients = await visualizationEmitter.hasActiveClients(sessionId);
          if (!hasClients) {
            continue;
          }

          // 获取低优先级 Agent 的状态
          for (const agentType of lowPriorityAgents) {
            const result = await agentStatusService.getAgentCurrentStatus(sessionId, agentType);
            if (result.success && result.data) {
              const status = result.data;

              // 只推送正在进行或重试中的 Agent
              if (['in_progress', 'retrying'].includes(status.status)) {
                visualizationEmitter.emitAgentStatusUpdate(sessionId, {
                  statusId: status.statusId,
                  agentType: status.agentType,
                  status: status.status,
                  progressPercentage: status.progressPercentage,
                  taskDescription: status.taskDescription,
                });
              }
            }
          }
        }
      } catch (error: any) {
        logger.error('Error in low priority update:', error);
      }
    }, 1500); // 1.5s

    logger.info('Low priority updates started (1500ms interval)');
  }

  /**
   * 启动归档任务（每天凌晨 2 点）
   */
  private startArchiveJob(): void {
    // Cron 表达式: 0 2 * * * (每天凌晨 2 点)
    this.archiveJob = cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Starting session archive job...');

        const result = await visualizationService.getSessionsToArchive();

        if (result.success && result.data) {
          const sessions = result.data;
          logger.info(`Found ${sessions.length} sessions to archive`);

          for (const session of sessions) {
            // 这里应该调用 S3 上传服务
            // 暂时使用占位符路径
            const storagePath = `s3://ai-builder-archives/${session.userId}/${session.sessionId}.json`;

            await visualizationService.archiveSession(session.sessionId, storagePath);

            logger.info(`Archived session ${session.sessionId} to ${storagePath}`);
          }

          logger.info(`Archive job completed. Archived ${sessions.length} sessions.`);
        }
      } catch (error: any) {
        logger.error('Error in archive job:', error);
      }
    });

    logger.info('Archive job scheduled (daily at 2:00 AM)');
  }

  /**
   * 手动触发归档任务（用于测试）
   */
  async triggerArchiveJob(): Promise<void> {
    logger.info('Manually triggering archive job...');

    try {
      const result = await visualizationService.getSessionsToArchive();

      if (result.success && result.data) {
        const sessions = result.data;
        logger.info(`Found ${sessions.length} sessions to archive`);

        for (const session of sessions) {
          const storagePath = `s3://ai-builder-archives/${session.userId}/${session.sessionId}.json`;
          await visualizationService.archiveSession(session.sessionId, storagePath);
          logger.info(`Archived session ${session.sessionId}`);
        }

        logger.info(`Manual archive job completed. Archived ${sessions.length} sessions.`);
      }
    } catch (error: any) {
      logger.error('Error in manual archive job:', error);
      throw error;
    }
  }

  /**
   * 获取活跃会话列表
   */
  getActiveSessions(): string[] {
    return Array.from(this.activeSessions);
  }

  /**
   * 获取活跃会话数量
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }
}

// 导出单例
export default new VisualizationScheduler();
