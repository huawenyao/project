import { PrismaClient, Agent, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * T010 [P] [US2]: Agent数据模型
 * 提供AI代理相关的数据访问操作
 */

const prisma = new PrismaClient();

export class AgentModel {
  /**
   * 创建新Agent
   */
  static async create(data: {
    projectId: string;
    agentType: string;
    name: string;
    description?: string;
    capabilities?: any;
    status?: string;
    config?: any;
  }): Promise<Agent> {
    try {
      const agent = await prisma.agent.create({
        data: {
          projectId: data.projectId,
          agentType: data.agentType,
          name: data.name,
          description: data.description,
          capabilities: data.capabilities || [],
          status: data.status || 'idle',
          config: data.config,
        },
      });

      logger.info(`Agent created: ${agent.id} (${agent.name}, type: ${agent.agentType})`);
      return agent;
    } catch (error: any) {
      logger.error('Failed to create agent:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找Agent
   */
  static async findById(id: string): Promise<Agent | null> {
    try {
      return await prisma.agent.findUnique({
        where: { id },
      });
    } catch (error: any) {
      logger.error(`Failed to find agent by id ${id}:`, error);
      throw error;
    }
  }

  /**
   * 根据ID查找Agent（包含关联任务）
   */
  static async findByIdWithTasks(id: string) {
    try {
      return await prisma.agent.findUnique({
        where: { id },
        include: {
          tasks: {
            orderBy: { createdAt: 'desc' },
            take: 50, // 最近50个任务
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
      logger.error(`Failed to find agent with tasks ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新Agent信息
   */
  static async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      capabilities: any;
      status: string;
      config: any;
      currentTask: string;
      lastActiveAt: Date;
      metrics: any;
    }>
  ): Promise<Agent> {
    try {
      const agent = await prisma.agent.update({
        where: { id },
        data,
      });

      logger.info(`Agent updated: ${agent.id}`);
      return agent;
    } catch (error: any) {
      logger.error(`Failed to update agent ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新Agent状态
   */
  static async updateStatus(
    id: string,
    status: string,
    currentTask?: string
  ): Promise<Agent> {
    try {
      const data: any = {
        status,
        lastActiveAt: new Date(),
      };

      if (currentTask !== undefined) {
        data.currentTask = currentTask;
      }

      return await this.update(id, data);
    } catch (error: any) {
      logger.error(`Failed to update agent status ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新Agent最后活跃时间
   */
  static async updateLastActive(id: string): Promise<Agent> {
    try {
      return await this.update(id, {
        lastActiveAt: new Date(),
      });
    } catch (error: any) {
      logger.error(`Failed to update agent last active ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新Agent指标
   */
  static async updateMetrics(id: string, metrics: any): Promise<Agent> {
    try {
      return await this.update(id, { metrics });
    } catch (error: any) {
      logger.error(`Failed to update agent metrics ${id}:`, error);
      throw error;
    }
  }

  /**
   * 删除Agent
   */
  static async delete(id: string): Promise<void> {
    try {
      await prisma.agent.delete({
        where: { id },
      });

      logger.info(`Agent deleted: ${id}`);
    } catch (error: any) {
      logger.error(`Failed to delete agent ${id}:`, error);
      throw error;
    }
  }

  /**
   * 获取Agent列表
   */
  static async findMany(options: {
    skip?: number;
    take?: number;
    where?: Prisma.AgentWhereInput;
    orderBy?: Prisma.AgentOrderByWithRelationInput;
    include?: Prisma.AgentInclude;
  } = {}): Promise<Agent[]> {
    try {
      return await prisma.agent.findMany({
        skip: options.skip,
        take: options.take,
        where: options.where,
        orderBy: options.orderBy,
        include: options.include,
      });
    } catch (error: any) {
      logger.error('Failed to find agents:', error);
      throw error;
    }
  }

  /**
   * 获取项目的所有Agent
   */
  static async findByProjectId(
    projectId: string,
    options: {
      skip?: number;
      take?: number;
      agentType?: string;
      status?: string;
    } = {}
  ): Promise<Agent[]> {
    try {
      const where: Prisma.AgentWhereInput = { projectId };

      if (options.agentType) {
        where.agentType = options.agentType;
      }

      if (options.status) {
        where.status = options.status;
      }

      return await prisma.agent.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'asc' },
      });
    } catch (error: any) {
      logger.error(`Failed to find agents for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取活跃的Agent列表
   */
  static async findActive(projectId?: string): Promise<Agent[]> {
    try {
      const where: Prisma.AgentWhereInput = {
        status: { in: ['active', 'working', 'busy'] },
      };

      if (projectId) {
        where.projectId = projectId;
      }

      return await prisma.agent.findMany({
        where,
        orderBy: { lastActiveAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Failed to find active agents:', error);
      throw error;
    }
  }

  /**
   * 统计Agent数量
   */
  static async count(where?: Prisma.AgentWhereInput): Promise<number> {
    try {
      return await prisma.agent.count({ where });
    } catch (error: any) {
      logger.error('Failed to count agents:', error);
      throw error;
    }
  }

  /**
   * 统计项目的Agent数量（按类型分组）
   */
  static async countByType(projectId: string): Promise<Record<string, number>> {
    try {
      const agents = await prisma.agent.groupBy({
        by: ['agentType'],
        where: { projectId },
        _count: { agentType: true },
      });

      const result: Record<string, number> = {};
      agents.forEach(a => {
        result[a.agentType] = a._count.agentType;
      });

      return result;
    } catch (error: any) {
      logger.error(`Failed to count agents by type for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 统计项目的Agent数量（按状态分组）
   */
  static async countByStatus(projectId: string): Promise<Record<string, number>> {
    try {
      const agents = await prisma.agent.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { status: true },
      });

      const result: Record<string, number> = {};
      agents.forEach(a => {
        result[a.status] = a._count.status;
      });

      return result;
    } catch (error: any) {
      logger.error(`Failed to count agents by status for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 根据类型获取可用的Agent
   */
  static async findAvailableByType(
    projectId: string,
    agentType: string
  ): Promise<Agent | null> {
    try {
      return await prisma.agent.findFirst({
        where: {
          projectId,
          agentType,
          status: { in: ['idle', 'active'] },
        },
        orderBy: { lastActiveAt: 'asc' }, // 选择最久没活动的
      });
    } catch (error: any) {
      logger.error(`Failed to find available agent of type ${agentType}:`, error);
      throw error;
    }
  }

  /**
   * 获取Agent的任务统计
   */
  static async getTaskStats(agentId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
  }> {
    try {
      const [total, completed, failed, inProgress] = await Promise.all([
        prisma.task.count({ where: { agentId } }),
        prisma.task.count({ where: { agentId, status: 'completed' } }),
        prisma.task.count({ where: { agentId, status: 'failed' } }),
        prisma.task.count({ where: { agentId, status: { in: ['running', 'pending'] } } }),
      ]);

      return { total, completed, failed, inProgress };
    } catch (error: any) {
      logger.error(`Failed to get task stats for agent ${agentId}:`, error);
      throw error;
    }
  }
}

export default AgentModel;
