/**
 * T142: Cleanup Old Metrics Job
 *
 * Phase 11 - Anonymized Metrics Collection
 *
 * 功能：
 * - 定期清理 12 个月以前的指标数据
 * - GDPR 合规的数据保留策略
 * - 保护用户隐私
 */

import cron from 'node-cron';
import { logger } from '../utils/logger';
import { UserInteractionMetric } from '../models/UserInteractionMetric.model';
import { Op } from 'sequelize';

/**
 * 清理 12 个月以前的指标数据
 */
export async function cleanupOldMetrics(): Promise<void> {
  try {
    logger.info('[CleanupMetricsJob] Starting metrics cleanup job...');

    // 计算 12 个月前的日期
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // 删除旧指标数据
    const deletedCount = await UserInteractionMetric.destroy({
      where: {
        timestamp: {
          [Op.lt]: twelveMonthsAgo,
        },
      },
    });

    logger.info(
      `[CleanupMetricsJob] Deleted ${deletedCount} metric records older than ${twelveMonthsAgo.toISOString()}`
    );

    // 记录数据保留政策执行
    logger.info('[CleanupMetricsJob] Data retention policy enforced (12-month limit)');
  } catch (error) {
    logger.error('[CleanupMetricsJob] Metrics cleanup job failed:', error);
  }
}

/**
 * 启动定时任务
 * 每月 1 号凌晨 3 点运行
 */
export function startMetricsCleanupScheduler(): void {
  // 每月 1 号凌晨 3 点运行
  cron.schedule('0 3 1 * *', cleanupOldMetrics, {
    timezone: 'Asia/Shanghai',
  });

  logger.info('[CleanupMetricsJob] Metrics cleanup scheduler started (runs monthly on 1st at 3:00 AM)');

  // 可选：启动时立即运行一次
  if (process.env.RUN_METRICS_CLEANUP_ON_STARTUP === 'true') {
    cleanupOldMetrics();
  }
}

/**
 * 获取指标统计信息
 */
export async function getMetricsStats(): Promise<{
  totalMetrics: number;
  oldestMetric: Date | null;
  newestMetric: Date | null;
  averageAge: number;
}> {
  try {
    const [totalMetrics, oldestMetric, newestMetric] = await Promise.all([
      UserInteractionMetric.count(),
      UserInteractionMetric.findOne({
        order: [['timestamp', 'ASC']],
        attributes: ['timestamp'],
      }),
      UserInteractionMetric.findOne({
        order: [['timestamp', 'DESC']],
        attributes: ['timestamp'],
      }),
    ]);

    const averageAge =
      oldestMetric && newestMetric
        ? (newestMetric.timestamp.getTime() - oldestMetric.timestamp.getTime()) / totalMetrics
        : 0;

    return {
      totalMetrics,
      oldestMetric: oldestMetric?.timestamp || null,
      newestMetric: newestMetric?.timestamp || null,
      averageAge: Math.floor(averageAge / (1000 * 60 * 60 * 24)), // 转换为天数
    };
  } catch (error) {
    logger.error('[CleanupMetricsJob] Failed to get metrics stats:', error);
    return {
      totalMetrics: 0,
      oldestMetric: null,
      newestMetric: null,
      averageAge: 0,
    };
  }
}

export default {
  cleanupOldMetrics,
  startMetricsCleanupScheduler,
  getMetricsStats,
};
