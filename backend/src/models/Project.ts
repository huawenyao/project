import { PrismaClient, Project, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * T009 [P] [US1]: Project数据模型
 * 提供项目相关的数据访问操作
 */

const prisma = new PrismaClient();

export class ProjectModel {
  /**
   * 创建新项目
   */
  static async create(data: {
    userId: string;
    name: string;
    requirementText: string;
    requirementSummary?: any;
    status?: string;
    estimatedDuration?: number;
    metadata?: any;
  }): Promise<Project> {
    try {
      const project = await prisma.project.create({
        data: {
          userId: data.userId,
          name: data.name,
          requirementText: data.requirementText,
          requirementSummary: data.requirementSummary,
          status: data.status || 'draft',
          estimatedDuration: data.estimatedDuration,
          metadata: data.metadata,
        },
      });

      logger.info(`Project created: ${project.id} (${project.name})`);
      return project;
    } catch (error: any) {
      logger.error('Failed to create project:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找项目
   */
  static async findById(id: string): Promise<Project | null> {
    try {
      return await prisma.project.findUnique({
        where: { id },
      });
    } catch (error: any) {
      logger.error(`Failed to find project by id ${id}:`, error);
      throw error;
    }
  }

  /**
   * 根据ID查找项目（包含关联数据）
   */
  static async findByIdWithRelations(id: string) {
    try {
      return await prisma.project.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          tasks: {
            orderBy: { createdAt: 'asc' },
          },
          agents: {
            orderBy: { createdAt: 'asc' },
          },
          components: {
            orderBy: { createdAt: 'asc' },
          },
          dataModels: {
            orderBy: { createdAt: 'asc' },
          },
          apiEndpoints: {
            orderBy: { createdAt: 'asc' },
          },
          deployments: {
            orderBy: { createdAt: 'desc' },
          },
          versions: {
            orderBy: { createdAt: 'desc' },
          },
          buildLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10, // 只取最近10条日志
          },
        },
      });
    } catch (error: any) {
      logger.error(`Failed to find project with relations ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新项目信息
   */
  static async update(
    id: string,
    data: Partial<{
      name: string;
      requirementText: string;
      requirementSummary: any;
      status: string;
      progress: number;
      estimatedDuration: number;
      actualDuration: number;
      startedAt: Date;
      completedAt: Date;
      metadata: any;
    }>
  ): Promise<Project> {
    try {
      const project = await prisma.project.update({
        where: { id },
        data,
      });

      logger.info(`Project updated: ${project.id}`);
      return project;
    } catch (error: any) {
      logger.error(`Failed to update project ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新项目状态
   */
  static async updateStatus(
    id: string,
    status: string,
    additionalData?: {
      progress?: number;
      startedAt?: Date;
      completedAt?: Date;
    }
  ): Promise<Project> {
    try {
      const data: any = { status };

      if (additionalData) {
        Object.assign(data, additionalData);
      }

      // 如果状态变为building，记录开始时间
      if (status === 'building' && !additionalData?.startedAt) {
        data.startedAt = new Date();
      }

      // 如果状态变为completed/deployed，记录完成时间
      if ((status === 'completed' || status === 'deployed') && !additionalData?.completedAt) {
        data.completedAt = new Date();
        data.progress = 100;
      }

      return await this.update(id, data);
    } catch (error: any) {
      logger.error(`Failed to update project status ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新项目进度
   */
  static async updateProgress(id: string, progress: number): Promise<Project> {
    try {
      return await this.update(id, { progress });
    } catch (error: any) {
      logger.error(`Failed to update project progress ${id}:`, error);
      throw error;
    }
  }

  /**
   * 删除项目
   */
  static async delete(id: string): Promise<void> {
    try {
      await prisma.project.delete({
        where: { id },
      });

      logger.info(`Project deleted: ${id}`);
    } catch (error: any) {
      logger.error(`Failed to delete project ${id}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目列表（分页）
   */
  static async findMany(options: {
    skip?: number;
    take?: number;
    where?: Prisma.ProjectWhereInput;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
    include?: Prisma.ProjectInclude;
  } = {}): Promise<Project[]> {
    try {
      return await prisma.project.findMany({
        skip: options.skip,
        take: options.take,
        where: options.where,
        orderBy: options.orderBy,
        include: options.include,
      });
    } catch (error: any) {
      logger.error('Failed to find projects:', error);
      throw error;
    }
  }

  /**
   * 获取用户的项目列表
   */
  static async findByUserId(
    userId: string,
    options: {
      skip?: number;
      take?: number;
      status?: string;
      orderBy?: Prisma.ProjectOrderByWithRelationInput;
    } = {}
  ): Promise<Project[]> {
    try {
      const where: Prisma.ProjectWhereInput = { userId };

      if (options.status) {
        where.status = options.status;
      }

      return await prisma.project.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error(`Failed to find projects for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 统计项目数量
   */
  static async count(where?: Prisma.ProjectWhereInput): Promise<number> {
    try {
      return await prisma.project.count({ where });
    } catch (error: any) {
      logger.error('Failed to count projects:', error);
      throw error;
    }
  }

  /**
   * 统计用户的项目数量（按状态分组）
   */
  static async countByStatus(userId: string): Promise<Record<string, number>> {
    try {
      const projects = await prisma.project.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      });

      const result: Record<string, number> = {};
      projects.forEach(p => {
        result[p.status] = p._count.status;
      });

      return result;
    } catch (error: any) {
      logger.error(`Failed to count projects by status for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目统计信息
   */
  static async getStats(projectId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    totalAgents: number;
    activeAgents: number;
    totalComponents: number;
    totalDataModels: number;
    totalApiEndpoints: number;
    totalDeployments: number;
    totalVersions: number;
  }> {
    try {
      const [
        totalTasks,
        completedTasks,
        totalAgents,
        activeAgents,
        totalComponents,
        totalDataModels,
        totalApiEndpoints,
        totalDeployments,
        totalVersions,
      ] = await Promise.all([
        prisma.task.count({ where: { projectId } }),
        prisma.task.count({ where: { projectId, status: 'completed' } }),
        prisma.agent.count({ where: { projectId } }),
        prisma.agent.count({ where: { projectId, status: 'active' } }),
        prisma.component.count({ where: { projectId } }),
        prisma.dataModel.count({ where: { projectId } }),
        prisma.aPIEndpoint.count({ where: { projectId } }),
        prisma.deployment.count({ where: { projectId } }),
        prisma.version.count({ where: { projectId } }),
      ]);

      return {
        totalTasks,
        completedTasks,
        totalAgents,
        activeAgents,
        totalComponents,
        totalDataModels,
        totalApiEndpoints,
        totalDeployments,
        totalVersions,
      };
    } catch (error: any) {
      logger.error(`Failed to get stats for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 搜索项目（按名称或需求文本）
   */
  static async search(
    userId: string,
    query: string,
    options: {
      skip?: number;
      take?: number;
    } = {}
  ): Promise<Project[]> {
    try {
      return await prisma.project.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { requirementText: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip: options.skip,
        take: options.take,
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Failed to search projects:', error);
      throw error;
    }
  }
}

export default ProjectModel;
