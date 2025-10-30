/**
 * Task Queue Service
 *
 * T019: Redis 任务队列服务
 * 管理 Agent 任务的排队、分发和执行
 */

import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface Task {
  id: string;
  projectId: string;
  agentType: 'ui' | 'backend' | 'database' | 'integration' | 'deployment';
  taskType: string;
  description: string;
  input: any;
  dependencies: string[];
  priority: number; // 1-10, 10 最高
  status: 'pending' | 'running' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

class TaskQueueService {
  private readonly QUEUE_PREFIX = 'task:queue:';
  private readonly TASK_PREFIX = 'task:';
  private readonly STATUS_PREFIX = 'task:status:';

  /**
   * 添加任务到队列
   */
  async enqueueTask(task: Task): Promise<void> {
    try {
      const queueKey = this.getQueueKey(task.agentType);
      const taskKey = this.getTaskKey(task.id);

      // 保存任务数据
      await redis.set(taskKey, JSON.stringify(task));

      // 添加到优先级队列（使用 sorted set）
      await redis.zadd(queueKey, task.priority, task.id);

      logger.info('[TaskQueueService] Task enqueued:', {
        taskId: task.id,
        agentType: task.agentType,
        priority: task.priority,
      });
    } catch (error: any) {
      logger.error('[TaskQueueService] Error enqueueing task:', error);
      throw error;
    }
  }

  /**
   * 获取下一个任务（最高优先级）
   */
  async dequeueTask(agentType: string): Promise<Task | null> {
    try {
      const queueKey = this.getQueueKey(agentType);

      // 获取最高优先级的任务（ZREVRANGE 返回最高分数）
      const taskIds = await redis.zrevrange(queueKey, 0, 0);

      if (taskIds.length === 0) {
        return null;
      }

      const taskId = taskIds[0];
      const taskKey = this.getTaskKey(taskId);

      // 获取任务数据
      const taskData = await redis.get(taskKey);
      if (!taskData) {
        // 任务数据不存在，移除队列中的引用
        await redis.zrem(queueKey, taskId);
        return null;
      }

      const task: Task = JSON.parse(taskData);

      // 检查依赖是否已完成
      const dependenciesMet = await this.checkDependencies(task.dependencies);
      if (!dependenciesMet) {
        // 依赖未满足，跳过此任务
        return null;
      }

      // 从队列中移除
      await redis.zrem(queueKey, taskId);

      // 更新任务状态
      task.status = 'running';
      task.startedAt = new Date();
      await redis.set(taskKey, JSON.stringify(task));

      logger.info('[TaskQueueService] Task dequeued:', taskId);

      return task;
    } catch (error: any) {
      logger.error('[TaskQueueService] Error dequeuing task:', error);
      throw error;
    }
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(
    taskId: string,
    status: 'running' | 'completed' | 'failed',
    output?: any,
    error?: any
  ): Promise<void> {
    try {
      const taskKey = this.getTaskKey(taskId);
      const taskData = await redis.get(taskKey);

      if (!taskData) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const task: Task = JSON.parse(taskData);
      task.status = status;

      if (status === 'completed') {
        task.completedAt = new Date();
      }

      if (output) {
        task.input = { ...task.input, output };
      }

      if (error) {
        task.input = { ...task.input, error };
      }

      await redis.set(taskKey, JSON.stringify(task));

      // 发布状态更新事件
      await redis.publish(
        `task:status:${task.projectId}`,
        JSON.stringify({
          taskId,
          status,
          timestamp: Date.now(),
        })
      );

      logger.info('[TaskQueueService] Task status updated:', {
        taskId,
        status,
      });
    } catch (error: any) {
      logger.error('[TaskQueueService] Error updating task status:', error);
      throw error;
    }
  }

  /**
   * 重试失败的任务
   */
  async retryTask(taskId: string): Promise<void> {
    try {
      const taskKey = this.getTaskKey(taskId);
      const taskData = await redis.get(taskKey);

      if (!taskData) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const task: Task = JSON.parse(taskData);

      if (task.retryCount >= task.maxRetries) {
        logger.warn('[TaskQueueService] Task max retries exceeded:', taskId);
        return;
      }

      task.retryCount++;
      task.status = 'pending';
      delete task.startedAt;
      delete task.completedAt;

      // 重新入队
      await this.enqueueTask(task);

      logger.info('[TaskQueueService] Task retried:', {
        taskId,
        retryCount: task.retryCount,
      });
    } catch (error: any) {
      logger.error('[TaskQueueService] Error retrying task:', error);
      throw error;
    }
  }

  /**
   * 获取队列长度
   */
  async getQueueLength(agentType: string): Promise<number> {
    try {
      const queueKey = this.getQueueKey(agentType);
      return await redis.zcard(queueKey);
    } catch (error: any) {
      logger.error('[TaskQueueService] Error getting queue length:', error);
      return 0;
    }
  }

  /**
   * 获取所有待处理任务
   */
  async getPendingTasks(agentType: string): Promise<Task[]> {
    try {
      const queueKey = this.getQueueKey(agentType);
      const taskIds = await redis.zrevrange(queueKey, 0, -1);

      const tasks: Task[] = [];
      for (const taskId of taskIds) {
        const taskKey = this.getTaskKey(taskId);
        const taskData = await redis.get(taskKey);
        if (taskData) {
          tasks.push(JSON.parse(taskData));
        }
      }

      return tasks;
    } catch (error: any) {
      logger.error('[TaskQueueService] Error getting pending tasks:', error);
      return [];
    }
  }

  /**
   * 清空队列
   */
  async clearQueue(agentType: string): Promise<void> {
    try {
      const queueKey = this.getQueueKey(agentType);
      await redis.del(queueKey);
      logger.info('[TaskQueueService] Queue cleared:', agentType);
    } catch (error: any) {
      logger.error('[TaskQueueService] Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * 检查任务依赖是否满足
   */
  private async checkDependencies(dependencies: string[]): Promise<boolean> {
    if (!dependencies || dependencies.length === 0) {
      return true;
    }

    for (const depId of dependencies) {
      const taskKey = this.getTaskKey(depId);
      const taskData = await redis.get(taskKey);

      if (!taskData) {
        return false; // 依赖任务不存在
      }

      const task: Task = JSON.parse(taskData);
      if (task.status !== 'completed') {
        return false; // 依赖任务未完成
      }
    }

    return true;
  }

  /**
   * 获取队列键
   */
  private getQueueKey(agentType: string): string {
    return `${this.QUEUE_PREFIX}${agentType}`;
  }

  /**
   * 获取任务键
   */
  private getTaskKey(taskId: string): string {
    return `${this.TASK_PREFIX}${taskId}`;
  }

  /**
   * 订阅任务状态更新
   */
  async subscribeToTaskUpdates(
    projectId: string,
    callback: (message: any) => void
  ): Promise<void> {
    const subscriber = redis.duplicate();
    await subscriber.subscribe(`task:status:${projectId}`);

    subscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        logger.error('[TaskQueueService] Error parsing message:', error);
      }
    });
  }
}

export default new TaskQueueService();
