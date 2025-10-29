/**
 * 项目服务
 * 处理项目相关的API调用
 */

import apiClient from './apiClient';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  requirementText: string;
  requirementSummary?: any;
  status: string;
  currentVersion?: string;
  estimatedDuration?: number;
  metadata?: any;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  requirementText: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  requirementText?: string;
  currentVersion?: string;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  runningTasks: number;
  failedTasks: number;
  progress: number;
}

/**
 * 项目服务类
 */
class ProjectService {
  private basePath = '/api/projects';

  /**
   * 创建新项目
   */
  async createProject(data: CreateProjectData): Promise<Project> {
    return apiClient.post<Project>(this.basePath, data);
  }

  /**
   * 获取用户的所有项目
   */
  async getProjects(params?: {
    skip?: number;
    take?: number;
    status?: string;
  }): Promise<Project[]> {
    return apiClient.get<Project[]>(this.basePath, { params });
  }

  /**
   * 搜索项目
   */
  async searchProjects(query: string): Promise<Project[]> {
    return apiClient.get<Project[]>(`${this.basePath}/search`, {
      params: { q: query },
    });
  }

  /**
   * 获取项目详情
   */
  async getProject(id: string): Promise<Project> {
    return apiClient.get<Project>(`${this.basePath}/${id}`);
  }

  /**
   * 获取完整项目信息（包含关联数据）
   */
  async getProjectFull(id: string): Promise<Project> {
    return apiClient.get<Project>(`${this.basePath}/${id}/full`);
  }

  /**
   * 更新项目
   */
  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    return apiClient.put<Project>(`${this.basePath}/${id}`, data);
  }

  /**
   * 更新项目状态
   */
  async updateProjectStatus(id: string, status: string): Promise<Project> {
    return apiClient.patch<Project>(`${this.basePath}/${id}/status`, { status });
  }

  /**
   * 更新项目进度
   */
  async updateProjectProgress(id: string, progress: number): Promise<Project> {
    return apiClient.patch<Project>(`${this.basePath}/${id}/progress`, { progress });
  }

  /**
   * 开始构建
   */
  async startBuild(id: string): Promise<Project> {
    return apiClient.post<Project>(`${this.basePath}/${id}/build`);
  }

  /**
   * 获取构建进度
   */
  async getBuildProgress(id: string): Promise<ProjectStats> {
    return apiClient.get<ProjectStats>(`${this.basePath}/${id}/progress`);
  }

  /**
   * 删除项目
   */
  async deleteProject(id: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * 获取项目统计
   */
  async getProjectStats(): Promise<{ count: number }> {
    return apiClient.get(`${this.basePath}/stats/count`);
  }

  /**
   * 按状态统计项目
   */
  async getProjectsByStatus(): Promise<Record<string, number>> {
    return apiClient.get(`${this.basePath}/stats/by-status`);
  }
}

export const projectService = new ProjectService();
export default projectService;
