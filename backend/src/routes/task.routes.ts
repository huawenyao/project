import { Router, Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import { ProjectService } from '../services/ProjectService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * T022 [P] [US2]: 任务路由
 * /api/tasks - 任务管理相关API
 */

const router = Router();

// 所有任务路由都需要认证
router.use(authenticate);

/**
 * POST /api/tasks
 * 创建新任务
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      agentId,
      taskType,
      description,
      input,
      dependencies,
      priority,
      estimatedDuration,
    } = req.body;

    // 验证必填字段
    if (!projectId || !agentId || !taskType || !description) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: '缺少必填字段：projectId, agentId, taskType, description',
      });
      return;
    }

    // 验证用户对项目的权限
    const project = await ProjectService.getProjectById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此项目',
      });
      return;
    }

    // 创建任务
    const task = await TaskService.createTask({
      projectId,
      agentId,
      taskType,
      description,
      input,
      dependencies,
      priority,
      estimatedDuration,
    });

    res.status(201).json({
      success: true,
      data: { task },
      message: '创建任务成功',
    });
  } catch (error: any) {
    logger.error('Create task error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create task',
      message: error.message || '创建任务失败',
    });
  }
});

/**
 * POST /api/tasks/batch
 * 批量创建任务
 */
router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid tasks array',
        message: '任务数组无效或为空',
      });
      return;
    }

    // 验证所有任务属于同一个项目，并且用户有权限
    const firstProjectId = tasks[0].projectId;
    if (!firstProjectId) {
      res.status(400).json({
        success: false,
        error: 'Missing projectId',
        message: '缺少projectId',
      });
      return;
    }

    const project = await ProjectService.getProjectById(firstProjectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此项目',
      });
      return;
    }

    // 批量创建任务
    const createdTasks = await TaskService.createTasks(tasks);

    res.status(201).json({
      success: true,
      data: {
        tasks: createdTasks,
        total: createdTasks.length,
      },
      message: '批量创建任务成功',
    });
  } catch (error: any) {
    logger.error('Batch create tasks error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create tasks',
      message: error.message || '批量创建任务失败',
    });
  }
});

/**
 * GET /api/tasks/:id
 * 获取任务详情
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeRelations } = req.query;

    let task;

    if (includeRelations === 'true') {
      task = await TaskService.getTaskWithRelations(id);
    } else {
      task = await TaskService.getTaskById(id);
    }

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      });
      return;
    }

    // 验证用户权限（通过项目）
    const project = await ProjectService.getProjectById(task.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此任务',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { task },
      message: '获取任务详情成功',
    });
  } catch (error: any) {
    logger.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get task',
      message: '获取任务详情失败',
    });
  }
});

/**
 * PUT /api/tasks/:id
 * 更新任务信息
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证任务存在和权限
    const existingTask = await TaskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingTask.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权修改此任务',
      });
      return;
    }

    const {
      description,
      input,
      output,
      result,
      errorMessage,
      status,
      progress,
      priority,
    } = req.body;

    const task = await TaskService.updateTask(id, {
      description,
      input,
      output,
      result,
      errorMessage,
      status,
      progress,
      priority,
    });

    res.status(200).json({
      success: true,
      data: { task },
      message: '更新任务成功',
    });
  } catch (error: any) {
    logger.error('Update task error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update task',
      message: error.message || '更新任务失败',
    });
  }
});

/**
 * PATCH /api/tasks/:id/status
 * 更新任务状态
 */
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, progress, output, result, errorMessage } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'Missing status',
        message: '缺少status字段',
      });
      return;
    }

    // 验证权限
    const existingTask = await TaskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingTask.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权修改此任务',
      });
      return;
    }

    const task = await TaskService.updateTaskStatus(id, status, {
      progress,
      output,
      result,
      errorMessage,
    });

    res.status(200).json({
      success: true,
      data: { task },
      message: '更新任务状态成功',
    });
  } catch (error: any) {
    logger.error('Update task status error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update status',
      message: error.message || '更新任务状态失败',
    });
  }
});

/**
 * PATCH /api/tasks/:id/progress
 * 更新任务进度
 */
router.patch('/:id/progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing progress',
        message: '缺少progress字段',
      });
      return;
    }

    // 验证权限
    const existingTask = await TaskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingTask.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权修改此任务',
      });
      return;
    }

    const task = await TaskService.updateTaskProgress(id, progress);

    res.status(200).json({
      success: true,
      data: { task },
      message: '更新任务进度成功',
    });
  } catch (error: any) {
    logger.error('Update task progress error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update progress',
      message: error.message || '更新任务进度失败',
    });
  }
});

/**
 * POST /api/tasks/:id/start
 * 开始执行任务
 */
router.post('/:id/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证权限
    const existingTask = await TaskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingTask.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此任务',
      });
      return;
    }

    const task = await TaskService.startTask(id);

    res.status(200).json({
      success: true,
      data: { task },
      message: '开始执行任务',
    });
  } catch (error: any) {
    logger.error('Start task error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to start task',
      message: error.message || '开始执行任务失败',
    });
  }
});

/**
 * POST /api/tasks/:id/complete
 * 完成任务
 */
router.post('/:id/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { output, result } = req.body;

    // 验证权限
    const existingTask = await TaskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingTask.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此任务',
      });
      return;
    }

    const task = await TaskService.completeTask(id, output, result);

    res.status(200).json({
      success: true,
      data: { task },
      message: '完成任务',
    });
  } catch (error: any) {
    logger.error('Complete task error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to complete task',
      message: error.message || '完成任务失败',
    });
  }
});

/**
 * POST /api/tasks/:id/fail
 * 标记任务失败
 */
router.post('/:id/fail', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { errorMessage } = req.body;

    if (!errorMessage) {
      res.status(400).json({
        success: false,
        error: 'Missing errorMessage',
        message: '缺少errorMessage字段',
      });
      return;
    }

    // 验证权限
    const existingTask = await TaskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingTask.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此任务',
      });
      return;
    }

    const task = await TaskService.failTask(id, errorMessage);

    res.status(200).json({
      success: true,
      data: { task },
      message: '标记任务失败',
    });
  } catch (error: any) {
    logger.error('Fail task error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to mark task as failed',
      message: error.message || '标记任务失败失败',
    });
  }
});

/**
 * POST /api/tasks/:id/retry
 * 重试任务
 */
router.post('/:id/retry', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证权限
    const existingTask = await TaskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingTask.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此任务',
      });
      return;
    }

    const task = await TaskService.retryTask(id);

    res.status(200).json({
      success: true,
      data: { task },
      message: '重试任务',
    });
  } catch (error: any) {
    logger.error('Retry task error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to retry task',
      message: error.message || '重试任务失败',
    });
  }
});

/**
 * POST /api/tasks/:id/cancel
 * 取消任务
 */
router.post('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证权限
    const existingTask = await TaskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingTask.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此任务',
      });
      return;
    }

    const task = await TaskService.cancelTask(id);

    res.status(200).json({
      success: true,
      data: { task },
      message: '取消任务',
    });
  } catch (error: any) {
    logger.error('Cancel task error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to cancel task',
      message: error.message || '取消任务失败',
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * 删除任务
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证权限
    const existingTask = await TaskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingTask.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权删除此任务',
      });
      return;
    }

    await TaskService.deleteTask(id);

    res.status(200).json({
      success: true,
      message: '删除任务成功',
    });
  } catch (error: any) {
    logger.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete task',
      message: '删除任务失败',
    });
  }
});

/**
 * GET /api/tasks/project/:projectId
 * 获取项目的任务列表
 */
router.get('/project/:projectId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { skip, take, status, taskType } = req.query;

    // 验证权限
    const project = await ProjectService.getProjectById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此项目',
      });
      return;
    }

    const tasks = await TaskService.getProjectTasks(projectId, {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
      status: status as string,
      taskType: taskType as string,
    });

    res.status(200).json({
      success: true,
      data: {
        tasks,
        total: tasks.length,
      },
      message: '获取任务列表成功',
    });
  } catch (error: any) {
    logger.error('Get project tasks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tasks',
      message: '获取任务列表失败',
    });
  }
});

/**
 * GET /api/tasks/project/:projectId/stats
 * 获取项目的任务统计
 */
router.get('/project/:projectId/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    // 验证权限
    const project = await ProjectService.getProjectById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此项目',
      });
      return;
    }

    const stats = await TaskService.getProjectTaskStats(projectId);

    res.status(200).json({
      success: true,
      data: { stats },
      message: '获取任务统计成功',
    });
  } catch (error: any) {
    logger.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stats',
      message: '获取任务统计失败',
    });
  }
});

/**
 * GET /api/tasks/project/:projectId/pending
 * 获取项目的待执行任务
 */
router.get('/project/:projectId/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    // 验证权限
    const project = await ProjectService.getProjectById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此项目',
      });
      return;
    }

    const tasks = await TaskService.getPendingTasks(projectId);

    res.status(200).json({
      success: true,
      data: {
        tasks,
        total: tasks.length,
      },
      message: '获取待执行任务成功',
    });
  } catch (error: any) {
    logger.error('Get pending tasks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending tasks',
      message: '获取待执行任务失败',
    });
  }
});

export default router;
