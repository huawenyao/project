/**
 * 任务服务
 * 处理任务相关的API调用
 */

import apiClient from './apiClient';

export interface Task {
  id: string;
  projectId: string;
  agentId: string;
  type: string;
  description?: string;
  input: any;
  output?: any;
  status: string;
  dependencies: string[];
  priority: number;
  progress: number;
  executionTimeMs?: number;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CreateTaskData {
  projectId: string;
  agentId: string;
  type: string;
  description?: string;
  input: any;
  dependencies?: string[];
  priority?: number;
}

export interface UpdateTaskData {
  type?: string;
  description?: string;
  input?: any;
  priority?: number;
  dependencies?: string[];
}

export interface TaskStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

/**
 * 任务服务类
 */
class TaskService {
  private basePath = '/api/tasks';

  /**
   * 创建任务
   */
  async createTask(data: CreateTaskData): Promise<Task> {
    return apiClient.post<Task>(this.basePath, data);
  }

  /**
   * 批量创建任务
   */
  async createTasksBatch(tasks: CreateTaskData[]): Promise<Task[]> {
    return apiClient.post<Task[]>(`${this.basePath}/batch`, { tasks });
  }

  /**
   * 获取任务详情
   */
  async getTask(id: string): Promise<Task> {
    return apiClient.get<Task>(`${this.basePath}/${id}`);
  }

  /**
   * 更新任务
   */
  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    return apiClient.put<Task>(`${this.basePath}/${id}`, data);
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(id: string, status: string): Promise<Task> {
    return apiClient.patch<Task>(`${this.basePath}/${id}/status`, { status });
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(id: string, progress: number): Promise<Task> {
    return apiClient.patch<Task>(`${this.basePath}/${id}/progress`, { progress });
  }

  /**
   * 开始任务
   */
  async startTask(id: string): Promise<Task> {
    return apiClient.post<Task>(`${this.basePath}/${id}/start`);
  }

  /**
   * 完成任务
   */
  async completeTask(id: string, output: any, result?: any): Promise<Task> {
    return apiClient.post<Task>(`${this.basePath}/${id}/complete`, { output, result });
  }

  /**
   * 标记任务失败
   */
  async failTask(id: string, errorMessage: string): Promise<Task> {
    return apiClient.post<Task>(`${this.basePath}/${id}/fail`, { errorMessage });
  }

  /**
   * 重试任务
   */
  async retryTask(id: string): Promise<Task> {
    return apiClient.post<Task>(`${this.basePath}/${id}/retry`);
  }

  /**
   * 取消任务
   */
  async cancelTask(id: string): Promise<Task> {
    return apiClient.post<Task>(`${this.basePath}/${id}/cancel`);
  }

  /**
   * 删除任务
   */
  async deleteTask(id: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * 获取项目的任务列表
   */
  async getProjectTasks(projectId: string, params?: {
    status?: string;
    agentId?: string;
    skip?: number;
    take?: number;
  }): Promise<Task[]> {
    return apiClient.get<Task[]>(`${this.basePath}/project/${projectId}`, { params });
  }

  /**
   * 获取项目任务统计
   */
  async getProjectTaskStats(projectId: string): Promise<TaskStats> {
    return apiClient.get<TaskStats>(`${this.basePath}/project/${projectId}/stats`);
  }

  /**
   * 获取待处理任务
   */
  async getPendingTasks(projectId: string): Promise<Task[]> {
    return apiClient.get<Task[]>(`${this.basePath}/project/${projectId}/pending`);
  }
}

export const taskService = new TaskService();
export default taskService;
