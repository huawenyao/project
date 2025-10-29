import { PrismaClient, BuildLog, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * T012 [P] [US1]: BuildLog数据模型
 * 提供构建日志相关的数据访问操作
 */

const prisma = new PrismaClient();

export class BuildLogModel {
  /**
   * 创建新构建日志
   */
  static async create(data: {
    projectId: string;
    level: string;
    message: string;
    source?: string;
    metadata?: any;
  }): Promise<BuildLog> {
    try {
      const log = await prisma.buildLog.create({
        data: {
          projectId: data.projectId,
          level: data.level,
          message: data.message,
          source: data.source,
          metadata: data.metadata,
        },
      });

      // 只记录error和warning级别的日志创建
      if (data.level === 'error' || data.level === 'warning') {
        logger.info(`BuildLog created: ${log.id} (${log.level}: ${log.message.substring(0, 50)}...)`);
      }

      return log;
    } catch (error: any) {
      logger.error('Failed to create build log:', error);
      throw error;
    }
  }

  /**
   * 批量创建构建日志
   */
  static async createMany(
    logs: Array<{
      projectId: string;
      level: string;
      message: string;
      source?: string;
      metadata?: any;
    }>
  ): Promise<number> {
    try {
      const result = await prisma.buildLog.createMany({
        data: logs,
        skipDuplicates: true,
      });

      logger.info(`Created ${result.count} build logs`);
      return result.count;
    } catch (error: any) {
      logger.error('Failed to create build logs:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找构建日志
   */
  static async findById(id: string): Promise<BuildLog | null> {
    try {
      return await prisma.buildLog.findUnique({
        where: { id },
      });
    } catch (error: any) {
      logger.error(`Failed to find build log by id ${id}:`, error);
      throw error;
    }
  }

  /**
   * 获取构建日志列表
   */
  static async findMany(options: {
    skip?: number;
    take?: number;
    where?: Prisma.BuildLogWhereInput;
    orderBy?: Prisma.BuildLogOrderByWithRelationInput;
  } = {}): Promise<BuildLog[]> {
    try {
      return await prisma.buildLog.findMany({
        skip: options.skip,
        take: options.take,
        where: options.where,
        orderBy: options.orderBy || { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Failed to find build logs:', error);
      throw error;
    }
  }

  /**
   * 获取项目的构建日志
   */
  static async findByProjectId(
    projectId: string,
    options: {
      skip?: number;
      take?: number;
      level?: string;
      source?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<BuildLog[]> {
    try {
      const where: Prisma.BuildLogWhereInput = { projectId };

      if (options.level) {
        where.level = options.level;
      }

      if (options.source) {
        where.source = options.source;
      }

      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) {
          where.createdAt.gte = options.startDate;
        }
        if (options.endDate) {
          where.createdAt.lte = options.endDate;
        }
      }

      return await prisma.buildLog.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error(`Failed to find build logs for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目的最新日志
   */
  static async findLatest(
    projectId: string,
    limit: number = 100
  ): Promise<BuildLog[]> {
    try {
      return await prisma.buildLog.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error: any) {
      logger.error(`Failed to find latest build logs for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目的错误日志
   */
  static async findErrors(
    projectId: string,
    options: {
      skip?: number;
      take?: number;
      startDate?: Date;
    } = {}
  ): Promise<BuildLog[]> {
    try {
      const where: Prisma.BuildLogWhereInput = {
        projectId,
        level: 'error',
      };

      if (options.startDate) {
        where.createdAt = { gte: options.startDate };
      }

      return await prisma.buildLog.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error(`Failed to find error logs for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目的警告日志
   */
  static async findWarnings(
    projectId: string,
    options: {
      skip?: number;
      take?: number;
      startDate?: Date;
    } = {}
  ): Promise<BuildLog[]> {
    try {
      const where: Prisma.BuildLogWhereInput = {
        projectId,
        level: 'warning',
      };

      if (options.startDate) {
        where.createdAt = { gte: options.startDate };
      }

      return await prisma.buildLog.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error(`Failed to find warning logs for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 搜索日志（按消息内容）
   */
  static async search(
    projectId: string,
    query: string,
    options: {
      skip?: number;
      take?: number;
      level?: string;
    } = {}
  ): Promise<BuildLog[]> {
    try {
      const where: Prisma.BuildLogWhereInput = {
        projectId,
        message: { contains: query, mode: 'insensitive' },
      };

      if (options.level) {
        where.level = options.level;
      }

      return await prisma.buildLog.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Failed to search build logs:', error);
      throw error;
    }
  }

  /**
   * 统计日志数量
   */
  static async count(where?: Prisma.BuildLogWhereInput): Promise<number> {
    try {
      return await prisma.buildLog.count({ where });
    } catch (error: any) {
      logger.error('Failed to count build logs:', error);
      throw error;
    }
  }

  /**
   * 统计项目的日志数量（按级别分组）
   */
  static async countByLevel(projectId: string): Promise<Record<string, number>> {
    try {
      const logs = await prisma.buildLog.groupBy({
        by: ['level'],
        where: { projectId },
        _count: { level: true },
      });

      const result: Record<string, number> = {};
      logs.forEach(l => {
        result[l.level] = l._count.level;
      });

      return result;
    } catch (error: any) {
      logger.error(`Failed to count build logs by level for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 统计项目的日志数量（按来源分组）
   */
  static async countBySource(projectId: string): Promise<Record<string, number>> {
    try {
      const logs = await prisma.buildLog.groupBy({
        by: ['source'],
        where: { projectId, source: { not: null } },
        _count: { source: true },
      });

      const result: Record<string, number> = {};
      logs.forEach(l => {
        if (l.source) {
          result[l.source] = l._count.source;
        }
      });

      return result;
    } catch (error: any) {
      logger.error(`Failed to count build logs by source for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 删除旧日志（保留最近N天）
   */
  static async deleteOldLogs(
    projectId: string,
    daysToKeep: number = 30
  ): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.buildLog.deleteMany({
        where: {
          projectId,
          createdAt: { lt: cutoffDate },
        },
      });

      logger.info(`Deleted ${result.count} old build logs for project ${projectId}`);
      return result.count;
    } catch (error: any) {
      logger.error(`Failed to delete old build logs for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 删除项目的所有日志
   */
  static async deleteAllByProjectId(projectId: string): Promise<number> {
    try {
      const result = await prisma.buildLog.deleteMany({
        where: { projectId },
      });

      logger.info(`Deleted all build logs for project ${projectId} (count: ${result.count})`);
      return result.count;
    } catch (error: any) {
      logger.error(`Failed to delete all build logs for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取日志统计摘要
   */
  static async getSummary(projectId: string): Promise<{
    total: number;
    byLevel: Record<string, number>;
    bySource: Record<string, number>;
    recentErrors: number;
    recentWarnings: number;
  }> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const [total, byLevel, bySource, recentErrors, recentWarnings] = await Promise.all([
        this.count({ projectId }),
        this.countByLevel(projectId),
        this.countBySource(projectId),
        this.count({ projectId, level: 'error', createdAt: { gte: oneDayAgo } }),
        this.count({ projectId, level: 'warning', createdAt: { gte: oneDayAgo } }),
      ]);

      return {
        total,
        byLevel,
        bySource,
        recentErrors,
        recentWarnings,
      };
    } catch (error: any) {
      logger.error(`Failed to get build log summary for project ${projectId}:`, error);
      throw error;
    }
  }
}

export default BuildLogModel;
