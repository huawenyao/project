/**
 * T122: Archive Old Sessions Job
 *
 * Phase 9 - Historical Replay & Data Archiving
 *
 * 功能：
 * - 每日运行的定时任务
 * - 将超过 30 天的构建会话归档到 S3
 * - 从主数据库删除详细事件数据
 * - 保留会话元数据用于快速查询
 */

import cron from 'node-cron';
import { logger } from '../utils/logger';
import { BuildSession } from '../models/BuildSession.model';
import { AgentWorkStatus } from '../models/AgentWorkStatus.model';
import { DecisionRecord } from '../models/DecisionRecord.model';
import { CollaborationEvent } from '../models/CollaborationEvent.model';
import { AgentErrorRecord } from '../models/AgentErrorRecord.model';
import dataArchiveService from '../services/DataArchiveService';
import { Op } from 'sequelize';

/**
 * 归档超过 30 天的会话
 */
export async function archiveOldSessions(): Promise<void> {
  try {
    logger.info('[ArchiveJob] Starting archive job...');

    // 计算 30 天前的日期
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 查找需要归档的会话
    const sessionsToArchive = await BuildSession.findAll({
      where: {
        startTime: {
          [Op.lt]: thirtyDaysAgo,
        },
        archived: false,
      },
      limit: 100, // 每次最多处理 100 个会话
    });

    if (sessionsToArchive.length === 0) {
      logger.info('[ArchiveJob] No sessions to archive');
      return;
    }

    logger.info(`[ArchiveJob] Found ${sessionsToArchive.length} sessions to archive`);

    let successCount = 0;
    let errorCount = 0;

    for (const session of sessionsToArchive) {
      try {
        // 收集会话的所有相关数据
        const sessionData = await collectSessionData(session.sessionId);

        // T123: 归档到 S3
        const archiveResult = await dataArchiveService.archiveSession(
          session.sessionId,
          sessionData
        );

        if (archiveResult.success) {
          // T124: 更新会话归档状态
          await session.update({
            archived: true,
            archivedAt: new Date(),
            archiveKey: archiveResult.archiveKey,
          });

          // 删除详细数据（保留会话元数据）
          await deleteDetailedData(session.sessionId);

          successCount++;
          logger.info(`[ArchiveJob] Archived session ${session.sessionId}`);
        } else {
          errorCount++;
          logger.error(
            `[ArchiveJob] Failed to archive session ${session.sessionId}:`,
            archiveResult.error
          );
        }
      } catch (error) {
        errorCount++;
        logger.error(`[ArchiveJob] Error archiving session ${session.sessionId}:`, error);
      }
    }

    logger.info(
      `[ArchiveJob] Archive job completed. Success: ${successCount}, Errors: ${errorCount}`
    );
  } catch (error) {
    logger.error('[ArchiveJob] Archive job failed:', error);
  }
}

/**
 * 收集会话的所有相关数据
 */
async function collectSessionData(sessionId: string): Promise<any> {
  try {
    const [session, agentStatuses, decisions, collaborations, errors] = await Promise.all([
      BuildSession.findByPk(sessionId),
      AgentWorkStatus.findAll({ where: { sessionId } }),
      DecisionRecord.findAll({ where: { sessionId } }),
      CollaborationEvent.findAll({ where: { sessionId } }),
      AgentErrorRecord.findAll({ where: { sessionId } }),
    ]);

    return {
      session: session?.toJSON(),
      agentStatuses: agentStatuses.map((s) => s.toJSON()),
      decisions: decisions.map((d) => d.toJSON()),
      collaborations: collaborations.map((c) => c.toJSON()),
      errors: errors.map((e) => e.toJSON()),
      archivedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`[ArchiveJob] Failed to collect session data for ${sessionId}:`, error);
    throw error;
  }
}

/**
 * 删除详细数据（保留会话元数据）
 */
async function deleteDetailedData(sessionId: string): Promise<void> {
  try {
    await Promise.all([
      AgentWorkStatus.destroy({ where: { sessionId } }),
      DecisionRecord.destroy({ where: { sessionId } }),
      CollaborationEvent.destroy({ where: { sessionId } }),
      AgentErrorRecord.destroy({ where: { sessionId } }),
    ]);

    logger.info(`[ArchiveJob] Deleted detailed data for session ${sessionId}`);
  } catch (error) {
    logger.error(`[ArchiveJob] Failed to delete detailed data for ${sessionId}:`, error);
    throw error;
  }
}

/**
 * 启动定时任务
 * 每天凌晨 2 点运行
 */
export function startArchiveScheduler(): void {
  // 每天凌晨 2 点运行
  cron.schedule('0 2 * * *', archiveOldSessions, {
    timezone: 'Asia/Shanghai',
  });

  logger.info('[ArchiveJob] Archive scheduler started (runs daily at 2:00 AM)');

  // 可选：启动时立即运行一次
  if (process.env.RUN_ARCHIVE_ON_STARTUP === 'true') {
    archiveOldSessions();
  }
}

export default {
  archiveOldSessions,
  startArchiveScheduler,
};
