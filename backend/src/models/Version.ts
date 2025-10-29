import { PrismaClient, Version, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * T012.1 [P] [US6]: Version数据模型
 * 提供版本管理相关的数据访问操作
 */

const prisma = new PrismaClient();

export class VersionModel {
  /**
   * 创建新版本
   */
  static async create(data: {
    projectId: string;
    versionNumber: string;
    description?: string;
    snapshot: any;
    changeLog?: string;
  }): Promise<Version> {
    try {
      const version = await prisma.version.create({
        data: {
          projectId: data.projectId,
          versionNumber: data.versionNumber,
          description: data.description,
          snapshot: data.snapshot,
          changeLog: data.changeLog,
        },
      });

      logger.info(`Version created: ${version.id} (v${version.versionNumber})`);
      return version;
    } catch (error: any) {
      logger.error('Failed to create version:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找版本
   */
  static async findById(id: string): Promise<Version | null> {
    try {
      return await prisma.version.findUnique({
        where: { id },
      });
    } catch (error: any) {
      logger.error(`Failed to find version by id ${id}:`, error);
      throw error;
    }
  }

  /**
   * 根据版本号查找版本
   */
  static async findByVersionNumber(
    projectId: string,
    versionNumber: string
  ): Promise<Version | null> {
    try {
      return await prisma.version.findFirst({
        where: {
          projectId,
          versionNumber,
        },
      });
    } catch (error: any) {
      logger.error(`Failed to find version by version number:`, error);
      throw error;
    }
  }

  /**
   * 获取版本列表
   */
  static async findMany(options: {
    skip?: number;
    take?: number;
    where?: Prisma.VersionWhereInput;
    orderBy?: Prisma.VersionOrderByWithRelationInput;
  } = {}): Promise<Version[]> {
    try {
      return await prisma.version.findMany({
        skip: options.skip,
        take: options.take,
        where: options.where,
        orderBy: options.orderBy || { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Failed to find versions:', error);
      throw error;
    }
  }

  /**
   * 获取项目的版本列表
   */
  static async findByProjectId(
    projectId: string,
    options: {
      skip?: number;
      take?: number;
      orderBy?: Prisma.VersionOrderByWithRelationInput;
    } = {}
  ): Promise<Version[]> {
    try {
      return await prisma.version.findMany({
        where: { projectId },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error(`Failed to find versions for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目的最新版本
   */
  static async findLatest(projectId: string): Promise<Version | null> {
    try {
      return await prisma.version.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error(`Failed to find latest version for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 更新版本信息
   */
  static async update(
    id: string,
    data: Partial<{
      description: string;
      changeLog: string;
      snapshot: any;
    }>
  ): Promise<Version> {
    try {
      const version = await prisma.version.update({
        where: { id },
        data,
      });

      logger.info(`Version updated: ${version.id}`);
      return version;
    } catch (error: any) {
      logger.error(`Failed to update version ${id}:`, error);
      throw error;
    }
  }

  /**
   * 删除版本
   */
  static async delete(id: string): Promise<void> {
    try {
      await prisma.version.delete({
        where: { id },
      });

      logger.info(`Version deleted: ${id}`);
    } catch (error: any) {
      logger.error(`Failed to delete version ${id}:`, error);
      throw error;
    }
  }

  /**
   * 删除项目的所有版本
   */
  static async deleteAllByProjectId(projectId: string): Promise<number> {
    try {
      const result = await prisma.version.deleteMany({
        where: { projectId },
      });

      logger.info(`Deleted all versions for project ${projectId} (count: ${result.count})`);
      return result.count;
    } catch (error: any) {
      logger.error(`Failed to delete all versions for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 统计版本数量
   */
  static async count(where?: Prisma.VersionWhereInput): Promise<number> {
    try {
      return await prisma.version.count({ where });
    } catch (error: any) {
      logger.error('Failed to count versions:', error);
      throw error;
    }
  }

  /**
   * 比较两个版本
   */
  static async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<{
    version1: Version;
    version2: Version;
    differences: any;
  } | null> {
    try {
      const [version1, version2] = await Promise.all([
        this.findById(versionId1),
        this.findById(versionId2),
      ]);

      if (!version1 || !version2) {
        return null;
      }

      // 简单的差异比较（可以根据需要扩展）
      const differences = {
        versionNumber: version1.versionNumber !== version2.versionNumber,
        description: version1.description !== version2.description,
        snapshotChanged: JSON.stringify(version1.snapshot) !== JSON.stringify(version2.snapshot),
        timeDiff: version2.createdAt.getTime() - version1.createdAt.getTime(),
      };

      return {
        version1,
        version2,
        differences,
      };
    } catch (error: any) {
      logger.error('Failed to compare versions:', error);
      throw error;
    }
  }

  /**
   * 获取版本历史（带分页）
   */
  static async getHistory(
    projectId: string,
    options: {
      skip?: number;
      take?: number;
    } = {}
  ): Promise<{
    versions: Version[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const take = options.take || 20;
      const skip = options.skip || 0;

      const [versions, total] = await Promise.all([
        this.findByProjectId(projectId, { skip, take: take + 1 }), // 多取一个判断是否有更多
        this.count({ projectId }),
      ]);

      const hasMore = versions.length > take;
      if (hasMore) {
        versions.pop(); // 移除多余的一个
      }

      return {
        versions,
        total,
        hasMore,
      };
    } catch (error: any) {
      logger.error(`Failed to get version history for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 检查版本号是否存在
   */
  static async versionNumberExists(
    projectId: string,
    versionNumber: string
  ): Promise<boolean> {
    try {
      const version = await prisma.version.findFirst({
        where: {
          projectId,
          versionNumber,
        },
        select: { id: true },
      });
      return !!version;
    } catch (error: any) {
      logger.error('Failed to check version number existence:', error);
      throw error;
    }
  }

  /**
   * 生成下一个版本号（基于语义化版本）
   */
  static async generateNextVersionNumber(
    projectId: string,
    type: 'major' | 'minor' | 'patch' = 'patch'
  ): Promise<string> {
    try {
      const latestVersion = await this.findLatest(projectId);

      if (!latestVersion) {
        return '1.0.0';
      }

      const current = latestVersion.versionNumber;
      const parts = current.split('.').map(Number);

      if (parts.length !== 3 || parts.some(isNaN)) {
        // 如果当前版本号不符合语义化版本格式，返回1.0.0
        return '1.0.0';
      }

      let [major, minor, patch] = parts;

      switch (type) {
        case 'major':
          major++;
          minor = 0;
          patch = 0;
          break;
        case 'minor':
          minor++;
          patch = 0;
          break;
        case 'patch':
          patch++;
          break;
      }

      return `${major}.${minor}.${patch}`;
    } catch (error: any) {
      logger.error(`Failed to generate next version number for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 创建快照版本（基于当前项目状态）
   */
  static async createSnapshot(
    projectId: string,
    description?: string
  ): Promise<Version> {
    try {
      // 获取项目的完整状态
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          agents: true,
          components: true,
          dataModels: true,
          apiEndpoints: true,
          deployments: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // 生成版本号
      const versionNumber = await this.generateNextVersionNumber(projectId, 'patch');

      // 创建快照
      const snapshot = {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          progress: project.progress,
          requirementText: project.requirementText,
          requirementSummary: project.requirementSummary,
          metadata: project.metadata,
        },
        tasks: project.tasks,
        agents: project.agents,
        components: project.components,
        dataModels: project.dataModels,
        apiEndpoints: project.apiEndpoints,
        deployment: project.deployments[0] || null,
        timestamp: new Date().toISOString(),
      };

      return await this.create({
        projectId,
        versionNumber,
        description: description || `自动快照 v${versionNumber}`,
        snapshot,
      });
    } catch (error: any) {
      logger.error(`Failed to create snapshot for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 恢复到指定版本
   */
  static async restoreVersion(
    versionId: string
  ): Promise<{ success: boolean; message: string; restoredProject?: any }> {
    try {
      const version = await this.findById(versionId);

      if (!version) {
        return {
          success: false,
          message: `Version ${versionId} not found`,
        };
      }

      const snapshot = version.snapshot as any;

      if (!snapshot || !snapshot.project) {
        return {
          success: false,
          message: 'Invalid version snapshot',
        };
      }

      // 恢复项目基本信息
      const restoredProject = await prisma.project.update({
        where: { id: version.projectId },
        data: {
          name: snapshot.project.name,
          status: snapshot.project.status,
          progress: snapshot.project.progress,
          requirementText: snapshot.project.requirementText,
          requirementSummary: snapshot.project.requirementSummary,
          metadata: snapshot.project.metadata,
        },
      });

      logger.info(`Restored project ${version.projectId} to version ${version.versionNumber}`);

      return {
        success: true,
        message: `Successfully restored to version ${version.versionNumber}`,
        restoredProject,
      };
    } catch (error: any) {
      logger.error(`Failed to restore version ${versionId}:`, error);
      return {
        success: false,
        message: error.message || 'Unknown error occurred',
      };
    }
  }
}

export default VersionModel;
