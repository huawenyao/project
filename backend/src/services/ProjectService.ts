import { Project } from '@prisma/client';
import ProjectModel from '../models/Project';
import { AIService } from './AIService';
import { logger } from '../utils/logger';

/**
 * T014 [P] [US1]: ProjectService
 * 提供项目相关的业务逻辑，包括项目创建、管理、AI需求分析
 */

export interface CreateProjectData {
  userId: string;
  name: string;
  requirementText: string;
}

export interface UpdateProjectData {
  name?: string;
  requirementText?: string;
  status?: string;
  progress?: number;
  metadata?: any;
}

export interface ProjectWithStats extends Project {
  stats?: {
    totalTasks: number;
    completedTasks: number;
    totalAgents: number;
    activeAgents: number;
    totalComponents: number;
    totalDataModels: number;
    totalApiEndpoints: number;
    totalDeployments: number;
    totalVersions: number;
  };
}

export class ProjectService {
  private static aiService = new AIService();

  /**
   * 创建新项目（包含AI需求分析）
   */
  static async createProject(data: CreateProjectData): Promise<Project> {
    try {
      // 1. 验证输入
      this.validateCreateProjectData(data);

      // 2. 使用AI分析需求文本
      let requirementSummary: any = null;
      try {
        requirementSummary = await this.analyzeRequirements(data.requirementText);
        logger.info(`Requirements analyzed for project: ${data.name}`);
      } catch (error) {
        logger.warn('AI requirement analysis failed, continuing without summary:', error);
      }

      // 3. 估算项目时长（基于需求复杂度）
      const estimatedDuration = this.estimateDuration(data.requirementText, requirementSummary);

      // 4. 创建项目
      const project = await ProjectModel.create({
        userId: data.userId,
        name: data.name,
        requirementText: data.requirementText,
        requirementSummary,
        status: 'draft',
        estimatedDuration,
        metadata: {
          createdBy: 'user',
          aiAnalyzed: !!requirementSummary,
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
   * 获取项目详情
   */
  static async getProjectById(projectId: string): Promise<Project | null> {
    try {
      return await ProjectModel.findById(projectId);
    } catch (error: any) {
      logger.error(`Failed to get project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目详情（包含关联数据）
   */
  static async getProjectWithRelations(projectId: string) {
    try {
      return await ProjectModel.findByIdWithRelations(projectId);
    } catch (error: any) {
      logger.error(`Failed to get project with relations ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目详情（包含统计数据）
   */
  static async getProjectWithStats(projectId: string): Promise<ProjectWithStats | null> {
    try {
      const [project, stats] = await Promise.all([
        ProjectModel.findById(projectId),
        ProjectModel.getStats(projectId),
      ]);

      if (!project) {
        return null;
      }

      return {
        ...project,
        stats,
      };
    } catch (error: any) {
      logger.error(`Failed to get project with stats ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 更新项目信息
   */
  static async updateProject(projectId: string, data: UpdateProjectData): Promise<Project> {
    try {
      // 如果更新了需求文本，重新分析
      if (data.requirementText) {
        try {
          const requirementSummary = await this.analyzeRequirements(data.requirementText);
          (data as any).requirementSummary = requirementSummary;
          logger.info(`Requirements re-analyzed for project: ${projectId}`);
        } catch (error) {
          logger.warn('AI requirement re-analysis failed:', error);
        }
      }

      const project = await ProjectModel.update(projectId, data);
      logger.info(`Project updated: ${project.id}`);

      return project;
    } catch (error: any) {
      logger.error(`Failed to update project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 更新项目状态
   */
  static async updateProjectStatus(
    projectId: string,
    status: string,
    additionalData?: {
      progress?: number;
      startedAt?: Date;
      completedAt?: Date;
    }
  ): Promise<Project> {
    try {
      const project = await ProjectModel.updateStatus(projectId, status, additionalData);
      logger.info(`Project status updated: ${project.id} -> ${status}`);

      return project;
    } catch (error: any) {
      logger.error(`Failed to update project status ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 更新项目进度
   */
  static async updateProjectProgress(projectId: string, progress: number): Promise<Project> {
    try {
      if (progress < 0 || progress > 100) {
        throw new Error('进度值必须在0-100之间');
      }

      return await ProjectModel.updateProgress(projectId, progress);
    } catch (error: any) {
      logger.error(`Failed to update project progress ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 删除项目
   */
  static async deleteProject(projectId: string): Promise<void> {
    try {
      await ProjectModel.delete(projectId);
      logger.info(`Project deleted: ${projectId}`);
    } catch (error: any) {
      logger.error(`Failed to delete project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取用户的项目列表
   */
  static async getUserProjects(
    userId: string,
    options: {
      skip?: number;
      take?: number;
      status?: string;
    } = {}
  ): Promise<Project[]> {
    try {
      return await ProjectModel.findByUserId(userId, options);
    } catch (error: any) {
      logger.error(`Failed to get projects for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 搜索项目
   */
  static async searchProjects(
    userId: string,
    query: string,
    options: {
      skip?: number;
      take?: number;
    } = {}
  ): Promise<Project[]> {
    try {
      return await ProjectModel.search(userId, query, options);
    } catch (error: any) {
      logger.error('Failed to search projects:', error);
      throw error;
    }
  }

  /**
   * 统计用户的项目数量
   */
  static async countUserProjects(userId: string): Promise<number> {
    try {
      return await ProjectModel.count({ userId });
    } catch (error: any) {
      logger.error(`Failed to count projects for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 统计用户的项目数量（按状态分组）
   */
  static async countUserProjectsByStatus(userId: string): Promise<Record<string, number>> {
    try {
      return await ProjectModel.countByStatus(userId);
    } catch (error: any) {
      logger.error(`Failed to count projects by status for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 开始构建项目
   */
  static async startBuild(projectId: string): Promise<Project> {
    try {
      const project = await ProjectModel.findById(projectId);

      if (!project) {
        throw new Error('项目不存在');
      }

      if (project.status === 'building') {
        throw new Error('项目正在构建中');
      }

      return await ProjectModel.updateStatus(projectId, 'building', {
        progress: 0,
        startedAt: new Date(),
      });
    } catch (error: any) {
      logger.error(`Failed to start build for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 完成项目构建
   */
  static async completeBuild(
    projectId: string,
    success: boolean = true
  ): Promise<Project> {
    try {
      const status = success ? 'completed' : 'failed';
      return await ProjectModel.updateStatus(projectId, status, {
        progress: success ? 100 : undefined,
        completedAt: new Date(),
      });
    } catch (error: any) {
      logger.error(`Failed to complete build for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目构建进度
   */
  static async getBuildProgress(projectId: string): Promise<{
    status: string;
    progress: number;
    estimatedTimeRemaining?: number;
  }> {
    try {
      const project = await ProjectModel.findById(projectId);

      if (!project) {
        throw new Error('项目不存在');
      }

      const result: any = {
        status: project.status,
        progress: project.progress || 0,
      };

      // 如果正在构建，估算剩余时间
      // 注：startedAt 字段暂未在 Project 模型中定义，临时禁用此功能
      // if (project.status === 'building' && project.startedAt) {
      //   const elapsed = Date.now() - project.startedAt.getTime();
      //   const progressPercent = project.progress || 0;
      //
      //   if (progressPercent > 0) {
      //     const estimatedTotal = (elapsed / progressPercent) * 100;
      //     const remaining = estimatedTotal - elapsed;
      //     result.estimatedTimeRemaining = Math.max(0, Math.round(remaining / 1000)); // 转换为秒
      //   }
      // }

      return result;
    } catch (error: any) {
      logger.error(`Failed to get build progress for project ${projectId}:`, error);
      throw error;
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 使用AI分析需求文本
   */
  private static async analyzeRequirements(requirementText: string): Promise<any> {
    try {
      if (!this.aiService.isAvailable()) {
        logger.warn('AI service not available, skipping requirement analysis');
        return null;
      }

      const systemPrompt = `你是一个产品需求分析专家。分析用户的应用需求，并返回JSON格式的结构化摘要。

返回格式：
{
  "appType": "应用类型（web/mobile/desktop/api）",
  "category": "应用分类（电商/社交/工具/游戏等）",
  "features": ["功能1", "功能2", ...],
  "techStack": {
    "frontend": ["建议的前端技术"],
    "backend": ["建议的后端技术"],
    "database": ["建议的数据库"]
  },
  "complexity": "复杂度（simple/medium/complex）",
  "estimatedPages": 估计的页面数量,
  "estimatedAPIs": 估计的API数量,
  "estimatedTables": 估计的数据表数量
}

只返回JSON，不要其他说明。`;

      const response = await this.aiService.generateResponse(requirementText, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 1000,
      });

      // 提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;
    } catch (error) {
      logger.error('AI requirement analysis failed:', error);
      throw error;
    }
  }

  /**
   * 估算项目时长（分钟）
   */
  private static estimateDuration(requirementText: string, summary: any): number {
    // 基础时长
    let duration = 60; // 1小时

    // 根据需求文本长度
    const textLength = requirementText.length;
    duration += Math.min(textLength / 100, 30); // 最多加30分钟

    // 根据AI分析结果
    if (summary) {
      // 根据复杂度
      if (summary.complexity === 'complex') {
        duration *= 3;
      } else if (summary.complexity === 'medium') {
        duration *= 2;
      }

      // 根据功能数量
      if (summary.features && Array.isArray(summary.features)) {
        duration += summary.features.length * 10;
      }

      // 根据估计的页面/API/表数量
      duration += (summary.estimatedPages || 0) * 5;
      duration += (summary.estimatedAPIs || 0) * 3;
      duration += (summary.estimatedTables || 0) * 5;
    }

    return Math.round(duration);
  }

  /**
   * 验证创建项目数据
   */
  private static validateCreateProjectData(data: CreateProjectData): void {
    if (!data.userId) {
      throw new Error('用户ID不能为空');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error('项目名称不能为空');
    }

    if (data.name.length > 200) {
      throw new Error('项目名称不能超过200个字符');
    }

    if (!data.requirementText || data.requirementText.trim().length === 0) {
      throw new Error('需求描述不能为空');
    }

    if (data.requirementText.length < 10) {
      throw new Error('需求描述至少需要10个字符');
    }
  }
}

export default ProjectService;
