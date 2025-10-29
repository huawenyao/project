import { Task } from '@prisma/client';
import TaskModel from '../models/Task';
import AgentModel from '../models/Agent';
import { logger } from '../utils/logger';

/**
 * T016 [P] [US2]: TaskService
 * 提供任务相关的业务逻辑，包括任务创建、分配、执行、状态管理
 */

export interface CreateTaskData {
  projectId: string;
  agentId: string;
  taskType: string;
  description: string;
  input?: any;
  dependencies?: string[];
  priority?: number;
  estimatedDuration?: number;
}

export interface UpdateTaskData {
  description?: string;
  input?: any;
  output?: any;
  result?: any;
  errorMessage?: string;
  status?: string;
  progress?: number;
  priority?: number;
  estimatedDuration?: number;
  actualDuration?: number;
}

export interface TaskWithRelations extends Task {
  agent?: any;
  project?: any;
}

export interface TaskExecutionResult {
  success: boolean;
  taskId: string;
  output?: any;
  error?: string;
  duration: number;
}

export class TaskService {
  /**
   * 创建新任务
   */
  static async createTask(data: CreateTaskData): Promise<Task> {
    try {
      // 验证输入
      this.validateCreateTaskData(data);

      // 检查Agent是否存在且可用
      const agent = await AgentModel.findById(data.agentId);
      if (!agent) {
        throw new Error('Agent不存在');
      }

      if (agent.status === 'offline' || agent.status === 'error') {
        throw new Error(`Agent状态异常: ${agent.status}`);
      }

      // 创建任务
      const task = await TaskModel.create({
        projectId: data.projectId,
        agentId: data.agentId,
        taskType: data.taskType,
        description: data.description,
        input: data.input,
        dependencies: data.dependencies || [],
        priority: data.priority !== undefined ? data.priority : 5,
        estimatedDuration: data.estimatedDuration,
      });

      logger.info(`Task created: ${task.id} (type: ${task.taskType}, agent: ${task.agentId})`);
      return task;
    } catch (error: any) {
      logger.error('Failed to create task:', error);
      throw error;
    }
  }

  /**
   * 批量创建任务
   */
  static async createTasks(tasks: CreateTaskData[]): Promise<Task[]> {
    try {
      const createdTasks: Task[] = [];

      for (const taskData of tasks) {
        const task = await this.createTask(taskData);
        createdTasks.push(task);
      }

      logger.info(`Created ${createdTasks.length} tasks`);
      return createdTasks;
    } catch (error: any) {
      logger.error('Failed to create tasks:', error);
      throw error;
    }
  }

  /**
   * 获取任务详情
   */
  static async getTaskById(taskId: string): Promise<Task | null> {
    try {
      return await TaskModel.findById(taskId);
    } catch (error: any) {
      logger.error(`Failed to get task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 获取任务详情（包含关联数据）
   */
  static async getTaskWithRelations(taskId: string): Promise<TaskWithRelations | null> {
    try {
      return await TaskModel.findByIdWithRelations(taskId);
    } catch (error: any) {
      logger.error(`Failed to get task with relations ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 更新任务信息
   */
  static async updateTask(taskId: string, data: UpdateTaskData): Promise<Task> {
    try {
      const task = await TaskModel.update(taskId, data);
      logger.info(`Task updated: ${task.id}`);

      return task;
    } catch (error: any) {
      logger.error(`Failed to update task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 更新任务状态
   */
  static async updateTaskStatus(
    taskId: string,
    status: string,
    additionalData?: {
      progress?: number;
      output?: any;
      result?: any;
      errorMessage?: string;
    }
  ): Promise<Task> {
    try {
      // 验证状态值
      const validStatuses = ['pending', 'running', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`无效的状态值: ${status}`);
      }

      const task = await TaskModel.updateStatus(taskId, status, additionalData);
      logger.info(`Task status updated: ${task.id} -> ${status}`);

      return task;
    } catch (error: any) {
      logger.error(`Failed to update task status ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 更新任务进度
   */
  static async updateTaskProgress(taskId: string, progress: number): Promise<Task> {
    try {
      if (progress < 0 || progress > 100) {
        throw new Error('进度值必须在0-100之间');
      }

      return await TaskModel.updateProgress(taskId, progress);
    } catch (error: any) {
      logger.error(`Failed to update task progress ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 开始执行任务
   */
  static async startTask(taskId: string): Promise<Task> {
    try {
      const task = await TaskModel.findById(taskId);

      if (!task) {
        throw new Error('任务不存在');
      }

      if (task.status !== 'pending') {
        throw new Error(`任务状态不允许开始执行: ${task.status}`);
      }

      // 检查依赖任务是否完成
      if (task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0) {
        const hasUncompletedDeps = await this.hasUncompletedDependencies(task.dependencies as string[]);
        if (hasUncompletedDeps) {
          throw new Error('存在未完成的依赖任务');
        }
      }

      return await this.updateTaskStatus(taskId, 'running', {
        progress: 0,
      });
    } catch (error: any) {
      logger.error(`Failed to start task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 完成任务
   */
  static async completeTask(
    taskId: string,
    output?: any,
    result?: any
  ): Promise<Task> {
    try {
      const task = await TaskModel.findById(taskId);

      if (!task) {
        throw new Error('任务不存在');
      }

      // 计算实际执行时长
      let actualDuration: number | undefined;
      if (task.startedAt) {
        actualDuration = Math.round((Date.now() - task.startedAt.getTime()) / 1000); // 秒
      }

      return await this.updateTaskStatus(taskId, 'completed', {
        progress: 100,
        output,
        result,
      });
    } catch (error: any) {
      logger.error(`Failed to complete task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 标记任务失败
   */
  static async failTask(taskId: string, errorMessage: string): Promise<Task> {
    try {
      return await TaskModel.markAsFailed(taskId, errorMessage, true);
    } catch (error: any) {
      logger.error(`Failed to mark task as failed ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 重试任务
   */
  static async retryTask(taskId: string): Promise<Task> {
    try {
      const task = await TaskModel.findById(taskId);

      if (!task) {
        throw new Error('任务不存在');
      }

      if (task.status !== 'failed') {
        throw new Error(`只能重试失败的任务，当前状态: ${task.status}`);
      }

      const maxRetries = 3;
      if ((task.retryCount || 0) >= maxRetries) {
        throw new Error('已达到最大重试次数');
      }

      return await this.updateTaskStatus(taskId, 'pending', {
        errorMessage: '',
      });
    } catch (error: any) {
      logger.error(`Failed to retry task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 取消任务
   */
  static async cancelTask(taskId: string): Promise<Task> {
    try {
      const task = await TaskModel.findById(taskId);

      if (!task) {
        throw new Error('任务不存在');
      }

      if (task.status === 'completed' || task.status === 'cancelled') {
        throw new Error(`任务已${task.status === 'completed' ? '完成' : '取消'}，无法取消`);
      }

      return await this.updateTaskStatus(taskId, 'cancelled');
    } catch (error: any) {
      logger.error(`Failed to cancel task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 删除任务
   */
  static async deleteTask(taskId: string): Promise<void> {
    try {
      await TaskModel.delete(taskId);
      logger.info(`Task deleted: ${taskId}`);
    } catch (error: any) {
      logger.error(`Failed to delete task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目的任务列表
   */
  static async getProjectTasks(
    projectId: string,
    options: {
      skip?: number;
      take?: number;
      status?: string;
      taskType?: string;
    } = {}
  ): Promise<Task[]> {
    try {
      return await TaskModel.findByProjectId(projectId, options);
    } catch (error: any) {
      logger.error(`Failed to get tasks for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取Agent的任务列表
   */
  static async getAgentTasks(
    agentId: string,
    options: {
      skip?: number;
      take?: number;
      status?: string;
    } = {}
  ): Promise<Task[]> {
    try {
      return await TaskModel.findByAgentId(agentId, options);
    } catch (error: any) {
      logger.error(`Failed to get tasks for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 获取待执行的任务队列
   */
  static async getPendingTasks(projectId?: string, agentId?: string): Promise<Task[]> {
    try {
      return await TaskModel.findPending(projectId, agentId);
    } catch (error: any) {
      logger.error('Failed to get pending tasks:', error);
      throw error;
    }
  }

  /**
   * 获取下一个待执行的任务
   */
  static async getNextTask(projectId: string, agentId?: string): Promise<Task | null> {
    try {
      const pendingTasks = await this.getPendingTasks(projectId, agentId);

      if (pendingTasks.length === 0) {
        return null;
      }

      // 返回优先级最高的任务
      return pendingTasks[0];
    } catch (error: any) {
      logger.error('Failed to get next task:', error);
      throw error;
    }
  }

  /**
   * 统计项目的任务数量（按状态）
   */
  static async countProjectTasksByStatus(projectId: string): Promise<Record<string, number>> {
    try {
      return await TaskModel.countByStatus(projectId);
    } catch (error: any) {
      logger.error(`Failed to count tasks by status for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 统计项目的任务数量（按类型）
   */
  static async countProjectTasksByType(projectId: string): Promise<Record<string, number>> {
    try {
      return await TaskModel.countByType(projectId);
    } catch (error: any) {
      logger.error(`Failed to count tasks by type for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目的任务执行统计
   */
  static async getProjectTaskStats(projectId: string) {
    try {
      return await TaskModel.getExecutionStats(projectId);
    } catch (error: any) {
      logger.error(`Failed to get task stats for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 计算项目总体进度（基于任务完成情况）
   */
  static async calculateProjectProgress(projectId: string): Promise<number> {
    try {
      const stats = await TaskModel.getExecutionStats(projectId);

      if (stats.total === 0) {
        return 0;
      }

      // 计算进度：已完成任务 / 总任务 * 100
      const progress = (stats.completed / stats.total) * 100;

      return Math.round(progress);
    } catch (error: any) {
      logger.error(`Failed to calculate project progress ${projectId}:`, error);
      throw error;
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 检查是否有未完成的依赖任务
   */
  private static async hasUncompletedDependencies(dependencies: string[]): Promise<boolean> {
    try {
      for (const depId of dependencies) {
        const task = await TaskModel.findById(depId);
        if (!task || task.status !== 'completed') {
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Failed to check dependencies:', error);
      return true; // 出错时保守处理，认为有未完成依赖
    }
  }

  /**
   * 验证创建任务数据
   */
  private static validateCreateTaskData(data: CreateTaskData): void {
    if (!data.projectId) {
      throw new Error('项目ID不能为空');
    }

    if (!data.agentId) {
      throw new Error('Agent ID不能为空');
    }

    if (!data.taskType) {
      throw new Error('任务类型不能为空');
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new Error('任务描述不能为空');
    }

    if (data.priority !== undefined && (data.priority < 1 || data.priority > 10)) {
      throw new Error('优先级必须在1-10之间');
    }
  }
}

export default TaskService;
