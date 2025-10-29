import { PrismaClient, Task, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * T011 [P] [US2]: Task数据模型
 * 提供任务相关的数据访问操作
 */

const prisma = new PrismaClient();

export class TaskModel {
  /**
   * 创建新任务
   */
  static async create(data: {
    projectId: string;
    agentId: string;
    taskType: string;
    description: string;
    input?: any;
    dependencies?: any;
    priority?: number;
    estimatedDuration?: number;
  }): Promise<Task> {
    try {
      const task = await prisma.task.create({
        data: {
          projectId: data.projectId,
          agentId: data.agentId,
          taskType: data.taskType,
          description: data.description,
          input: data.input,
          dependencies: data.dependencies || [],
          priority: data.priority || 5,
          estimatedDuration: data.estimatedDuration,
          status: 'pending',
        },
      });

      logger.info(`Task created: ${task.id} (type: ${task.taskType}, agent: ${task.agentId})`);
      return task;
    } catch (error: any) {
      logger.error('Failed to create task:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找任务
   */
  static async findById(id: string): Promise<Task | null> {
    try {
      return await prisma.task.findUnique({
        where: { id },
      });
    } catch (error: any) {
      logger.error(`Failed to find task by id ${id}:`, error);
      throw error;
    }
  }

  /**
   * 根据ID查找任务（包含关联数据）
   */
  static async findByIdWithRelations(id: string) {
    try {
      return await prisma.task.findUnique({
        where: { id },
        include: {
          agent: {
            select: {
              id: true,
              agentType: true,
              name: true,
              status: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });
    } catch (error: any) {
      logger.error(`Failed to find task with relations ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新任务信息
   */
  static async update(
    id: string,
    data: Partial<{
      description: string;
      input: any;
      output: any;
      result: any;
      errorMessage: string;
      status: string;
      progress: number;
      priority: number;
      estimatedDuration: number;
      actualDuration: number;
      retryCount: number;
      startedAt: Date;
      completedAt: Date;
    }>
  ): Promise<Task> {
    try {
      const task = await prisma.task.update({
        where: { id },
        data,
      });

      logger.info(`Task updated: ${task.id}`);
      return task;
    } catch (error: any) {
      logger.error(`Failed to update task ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新任务状态
   */
  static async updateStatus(
    id: string,
    status: string,
    additionalData?: {
      progress?: number;
      startedAt?: Date;
      completedAt?: Date;
      output?: any;
      result?: any;
      errorMessage?: string;
    }
  ): Promise<Task> {
    try {
      const data: any = { status };

      if (additionalData) {
        Object.assign(data, additionalData);
      }

      // 如果状态变为running，记录开始时间
      if (status === 'running' && !additionalData?.startedAt) {
        data.startedAt = new Date();
      }

      // 如果状态变为completed/failed，记录完成时间
      if ((status === 'completed' || status === 'failed') && !additionalData?.completedAt) {
        data.completedAt = new Date();
      }

      // 如果状态变为completed，设置进度为100
      if (status === 'completed' && !additionalData?.progress) {
        data.progress = 100;
      }

      return await this.update(id, data);
    } catch (error: any) {
      logger.error(`Failed to update task status ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新任务进度
   */
  static async updateProgress(id: string, progress: number): Promise<Task> {
    try {
      return await this.update(id, { progress });
    } catch (error: any) {
      logger.error(`Failed to update task progress ${id}:`, error);
      throw error;
    }
  }

  /**
   * 标记任务为失败并增加重试计数
   */
  static async markAsFailed(
    id: string,
    errorMessage: string,
    canRetry: boolean = true
  ): Promise<Task> {
    try {
      const task = await this.findById(id);
      if (!task) {
        throw new Error(`Task ${id} not found`);
      }

      const retryCount = (task.retryCount || 0) + 1;
      const maxRetries = 3;

      // 如果重试次数未超过限制且允许重试，状态设为pending
      const newStatus = canRetry && retryCount <= maxRetries ? 'pending' : 'failed';

      return await this.update(id, {
        status: newStatus,
        errorMessage,
        retryCount,
        completedAt: newStatus === 'failed' ? new Date() : undefined,
      });
    } catch (error: any) {
      logger.error(`Failed to mark task as failed ${id}:`, error);
      throw error;
    }
  }

  /**
   * 删除任务
   */
  static async delete(id: string): Promise<void> {
    try {
      await prisma.task.delete({
        where: { id },
      });

      logger.info(`Task deleted: ${id}`);
    } catch (error: any) {
      logger.error(`Failed to delete task ${id}:`, error);
      throw error;
    }
  }

  /**
   * 获取任务列表
   */
  static async findMany(options: {
    skip?: number;
    take?: number;
    where?: Prisma.TaskWhereInput;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
    include?: Prisma.TaskInclude;
  } = {}): Promise<Task[]> {
    try {
      return await prisma.task.findMany({
        skip: options.skip,
        take: options.take,
        where: options.where,
        orderBy: options.orderBy,
        include: options.include,
      });
    } catch (error: any) {
      logger.error('Failed to find tasks:', error);
      throw error;
    }
  }

  /**
   * 获取项目的任务列表
   */
  static async findByProjectId(
    projectId: string,
    options: {
      skip?: number;
      take?: number;
      status?: string;
      taskType?: string;
      orderBy?: Prisma.TaskOrderByWithRelationInput;
    } = {}
  ): Promise<Task[]> {
    try {
      const where: Prisma.TaskWhereInput = { projectId };

      if (options.status) {
        where.status = options.status;
      }

      if (options.taskType) {
        where.taskType = options.taskType;
      }

      return await prisma.task.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'asc' },
      });
    } catch (error: any) {
      logger.error(`Failed to find tasks for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取Agent的任务列表
   */
  static async findByAgentId(
    agentId: string,
    options: {
      skip?: number;
      take?: number;
      status?: string;
      orderBy?: Prisma.TaskOrderByWithRelationInput;
    } = {}
  ): Promise<Task[]> {
    try {
      const where: Prisma.TaskWhereInput = { agentId };

      if (options.status) {
        where.status = options.status;
      }

      return await prisma.task.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error(`Failed to find tasks for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 获取待执行的任务（按优先级排序）
   */
  static async findPending(
    projectId?: string,
    agentId?: string
  ): Promise<Task[]> {
    try {
      const where: Prisma.TaskWhereInput = {
        status: 'pending',
      };

      if (projectId) {
        where.projectId = projectId;
      }

      if (agentId) {
        where.agentId = agentId;
      }

      return await prisma.task.findMany({
        where,
        orderBy: [
          { priority: 'desc' }, // 优先级高的先执行
          { createdAt: 'asc' }, // 创建时间早的先执行
        ],
      });
    } catch (error: any) {
      logger.error('Failed to find pending tasks:', error);
      throw error;
    }
  }

  /**
   * 统计任务数量
   */
  static async count(where?: Prisma.TaskWhereInput): Promise<number> {
    try {
      return await prisma.task.count({ where });
    } catch (error: any) {
      logger.error('Failed to count tasks:', error);
      throw error;
    }
  }

  /**
   * 统计项目的任务数量（按状态分组）
   */
  static async countByStatus(projectId: string): Promise<Record<string, number>> {
    try {
      const tasks = await prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { status: true },
      });

      const result: Record<string, number> = {};
      tasks.forEach(t => {
        result[t.status] = t._count.status;
      });

      return result;
    } catch (error: any) {
      logger.error(`Failed to count tasks by status for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 统计项目的任务数量（按类型分组）
   */
  static async countByType(projectId: string): Promise<Record<string, number>> {
    try {
      const tasks = await prisma.task.groupBy({
        by: ['taskType'],
        where: { projectId },
        _count: { taskType: true },
      });

      const result: Record<string, number> = {};
      tasks.forEach(t => {
        result[t.taskType] = t._count.taskType;
      });

      return result;
    } catch (error: any) {
      logger.error(`Failed to count tasks by type for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取任务执行统计
   */
  static async getExecutionStats(projectId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    pending: number;
    averageDuration: number | null;
  }> {
    try {
      const [total, completed, failed, inProgress, pending] = await Promise.all([
        prisma.task.count({ where: { projectId } }),
        prisma.task.count({ where: { projectId, status: 'completed' } }),
        prisma.task.count({ where: { projectId, status: 'failed' } }),
        prisma.task.count({ where: { projectId, status: 'running' } }),
        prisma.task.count({ where: { projectId, status: 'pending' } }),
      ]);

      // 计算平均执行时长
      const completedTasks = await prisma.task.findMany({
        where: {
          projectId,
          status: 'completed',
          actualDuration: { not: null },
        },
        select: { actualDuration: true },
      });

      const averageDuration = completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / completedTasks.length
        : null;

      return {
        total,
        completed,
        failed,
        inProgress,
        pending,
        averageDuration,
      };
    } catch (error: any) {
      logger.error(`Failed to get execution stats for project ${projectId}:`, error);
      throw error;
    }
  }
}

export default TaskModel;
