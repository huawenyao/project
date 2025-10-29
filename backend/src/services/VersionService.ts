/**
 * Version Service
 *
 * T029.1: 版本管理服务
 * 实现版本快照创建、回滚和对比功能
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface VersionSnapshot {
  components: any[];
  dataModels: any[];
  apiEndpoints: any[];
  projectMetadata: any;
}

export interface VersionDiff {
  added: { type: string; items: any[] }[];
  modified: { type: string; items: any[] }[];
  removed: { type: string; items: any[] }[];
}

class VersionService {
  /**
   * 创建版本快照
   */
  async createSnapshot(
    projectId: string,
    userId: string,
    description?: string
  ): Promise<any> {
    try {
      logger.info('[VersionService] Creating snapshot for project:', projectId);

      // 获取当前项目的所有数据
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          components: true,
          dataModels: true,
          apiEndpoints: true,
        },
      });

      if (!project) {
        throw new Error('项目不存在');
      }

      // 获取当前版本号
      const latestVersion = await prisma.version.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      const versionNumber = this.generateVersionNumber(latestVersion?.versionNumber);

      // 创建快照数据
      const snapshot: VersionSnapshot = {
        components: project.components || [],
        dataModels: project.dataModels || [],
        apiEndpoints: project.apiEndpoints || [],
        projectMetadata: {
          name: project.name,
          description: project.description,
          requirementText: project.requirementText,
          requirementSummary: project.requirementSummary,
          status: project.status,
        },
      };

      // 保存版本
      const version = await prisma.version.create({
        data: {
          projectId,
          versionNumber,
          description: description || `自动快照 - ${new Date().toLocaleString('zh-CN')}`,
          snapshot: snapshot as any,
          createdByUserId: userId,
          changedComponents: project.components?.map((c: any) => c.id) || [],
          changedDataModels: project.dataModels?.map((d: any) => d.id) || [],
          changedApiEndpoints: project.apiEndpoints?.map((a: any) => a.id) || [],
        },
      });

      logger.info('[VersionService] Snapshot created:', version.id);

      return version;
    } catch (error: any) {
      logger.error('[VersionService] Error creating snapshot:', error);
      throw error;
    }
  }

  /**
   * 恢复到指定版本
   */
  async restoreVersion(projectId: string, versionId: string, userId: string): Promise<void> {
    try {
      logger.info('[VersionService] Restoring version:', versionId);

      // 先创建当前版本的备份
      await this.createSnapshot(projectId, userId, '回滚前备份');

      // 获取目标版本
      const version = await prisma.version.findUnique({
        where: { id: versionId },
      });

      if (!version || version.projectId !== projectId) {
        throw new Error('版本不存在或不属于该项目');
      }

      const snapshot = version.snapshot as any as VersionSnapshot;

      // 开始事务恢复
      await prisma.$transaction(async (tx) => {
        // 删除当前的组件、数据模型、API端点
        await tx.component.deleteMany({ where: { projectId } });
        await tx.dataModel.deleteMany({ where: { projectId } });
        await tx.aPIEndpoint.deleteMany({ where: { projectId } });

        // 恢复快照数据
        if (snapshot.components && snapshot.components.length > 0) {
          await tx.component.createMany({
            data: snapshot.components.map((c: any) => ({
              ...c,
              projectId,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          });
        }

        if (snapshot.dataModels && snapshot.dataModels.length > 0) {
          await tx.dataModel.createMany({
            data: snapshot.dataModels.map((d: any) => ({
              ...d,
              projectId,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          });
        }

        if (snapshot.apiEndpoints && snapshot.apiEndpoints.length > 0) {
          await tx.aPIEndpoint.createMany({
            data: snapshot.apiEndpoints.map((a: any) => ({
              ...a,
              projectId,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          });
        }

        // 更新项目元数据
        await tx.project.update({
          where: { id: projectId },
          data: {
            ...snapshot.projectMetadata,
            updatedAt: new Date(),
          },
        });
      });

      logger.info('[VersionService] Version restored successfully');
    } catch (error: any) {
      logger.error('[VersionService] Error restoring version:', error);
      throw error;
    }
  }

  /**
   * 获取版本列表
   */
  async getVersions(projectId: string): Promise<any[]> {
    return prisma.version.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * 对比两个版本
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<VersionDiff> {
    try {
      const [version1, version2] = await Promise.all([
        prisma.version.findUnique({ where: { id: versionId1 } }),
        prisma.version.findUnique({ where: { id: versionId2 } }),
      ]);

      if (!version1 || !version2) {
        throw new Error('版本不存在');
      }

      const snapshot1 = version1.snapshot as any as VersionSnapshot;
      const snapshot2 = version2.snapshot as any as VersionSnapshot;

      const diff: VersionDiff = {
        added: [],
        modified: [],
        removed: [],
      };

      // 对比组件
      this.compareArrays(
        snapshot1.components,
        snapshot2.components,
        'components',
        diff
      );

      // 对比数据模型
      this.compareArrays(
        snapshot1.dataModels,
        snapshot2.dataModels,
        'dataModels',
        diff
      );

      // 对比 API 端点
      this.compareArrays(
        snapshot1.apiEndpoints,
        snapshot2.apiEndpoints,
        'apiEndpoints',
        diff
      );

      return diff;
    } catch (error: any) {
      logger.error('[VersionService] Error comparing versions:', error);
      throw error;
    }
  }

  /**
   * 生成版本号
   */
  private generateVersionNumber(latestVersion?: string): string {
    if (!latestVersion) {
      return '1.0.0';
    }

    const parts = latestVersion.split('.').map(Number);
    parts[2]++; // 增加补丁版本号

    if (parts[2] >= 10) {
      parts[2] = 0;
      parts[1]++; // 增加次版本号
    }

    if (parts[1] >= 10) {
      parts[1] = 0;
      parts[0]++; // 增加主版本号
    }

    return parts.join('.');
  }

  /**
   * 对比两个数组
   */
  private compareArrays(
    arr1: any[],
    arr2: any[],
    type: string,
    diff: VersionDiff
  ): void {
    const map1 = new Map(arr1.map((item) => [item.id, item]));
    const map2 = new Map(arr2.map((item) => [item.id, item]));

    // 查找新增的
    const added = arr2.filter((item) => !map1.has(item.id));
    if (added.length > 0) {
      diff.added.push({ type, items: added });
    }

    // 查找删除的
    const removed = arr1.filter((item) => !map2.has(item.id));
    if (removed.length > 0) {
      diff.removed.push({ type, items: removed });
    }

    // 查找修改的（简单的 JSON 比较）
    const modified = arr2.filter((item) => {
      const old = map1.get(item.id);
      return old && JSON.stringify(old) !== JSON.stringify(item);
    });
    if (modified.length > 0) {
      diff.modified.push({ type, items: modified });
    }
  }
}

export default new VersionService();
