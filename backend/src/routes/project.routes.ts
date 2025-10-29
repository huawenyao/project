import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/ProjectService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * T020 [P] [US1]: 项目路由
 * /api/projects - 项目管理相关API
 */

const router = Router();

// 所有项目路由都需要认证
router.use(authenticate);

/**
 * POST /api/projects
 * 创建新项目
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '未认证',
      });
      return;
    }

    const { name, requirementText } = req.body;

    // 验证必填字段
    if (!name || !requirementText) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: '缺少必填字段：name, requirementText',
      });
      return;
    }

    // 创建项目
    const project = await ProjectService.createProject({
      userId: req.user.userId,
      name,
      requirementText,
    });

    res.status(201).json({
      success: true,
      data: { project },
      message: '创建项目成功',
    });
  } catch (error: any) {
    logger.error('Create project error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create project',
      message: error.message || '创建项目失败',
    });
  }
});

/**
 * GET /api/projects
 * 获取当前用户的项目列表
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '未认证',
      });
      return;
    }

    const { skip, take, status } = req.query;

    const projects = await ProjectService.getUserProjects(req.user.userId, {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
      status: status as string,
    });

    res.status(200).json({
      success: true,
      data: {
        projects,
        total: projects.length,
      },
      message: '获取项目列表成功',
    });
  } catch (error: any) {
    logger.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get projects',
      message: '获取项目列表失败',
    });
  }
});

/**
 * GET /api/projects/search
 * 搜索项目
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '未认证',
      });
      return;
    }

    const { q, skip, take } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        error: 'Missing search query',
        message: '缺少搜索关键词',
      });
      return;
    }

    const projects = await ProjectService.searchProjects(
      req.user.userId,
      q as string,
      {
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        projects,
        total: projects.length,
      },
      message: '搜索项目成功',
    });
  } catch (error: any) {
    logger.error('Search projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search projects',
      message: '搜索项目失败',
    });
  }
});

/**
 * GET /api/projects/:id
 * 获取项目详情
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeStats } = req.query;

    let project;

    if (includeStats === 'true') {
      project = await ProjectService.getProjectWithStats(id);
    } else {
      project = await ProjectService.getProjectById(id);
    }

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    // 验证用户权限
    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此项目',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { project },
      message: '获取项目详情成功',
    });
  } catch (error: any) {
    logger.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get project',
      message: '获取项目详情失败',
    });
  }
});

/**
 * GET /api/projects/:id/full
 * 获取项目完整信息（包含所有关联数据）
 */
router.get('/:id/full', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await ProjectService.getProjectWithRelations(id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    // 验证用户权限
    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此项目',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { project },
      message: '获取项目完整信息成功',
    });
  } catch (error: any) {
    logger.error('Get full project error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get project',
      message: '获取项目完整信息失败',
    });
  }
});

/**
 * PUT /api/projects/:id
 * 更新项目信息
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 先获取项目验证权限
    const existingProject = await ProjectService.getProjectById(id);

    if (!existingProject) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (existingProject.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权修改此项目',
      });
      return;
    }

    const { name, requirementText, status, progress, metadata } = req.body;

    const project = await ProjectService.updateProject(id, {
      name,
      requirementText,
      status,
      progress,
      metadata,
    });

    res.status(200).json({
      success: true,
      data: { project },
      message: '更新项目成功',
    });
  } catch (error: any) {
    logger.error('Update project error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update project',
      message: error.message || '更新项目失败',
    });
  }
});

/**
 * PATCH /api/projects/:id/status
 * 更新项目状态
 */
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'Missing status',
        message: '缺少status字段',
      });
      return;
    }

    // 验证权限
    const existingProject = await ProjectService.getProjectById(id);
    if (!existingProject) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (existingProject.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权修改此项目',
      });
      return;
    }

    const project = await ProjectService.updateProjectStatus(id, status, {
      progress,
    });

    res.status(200).json({
      success: true,
      data: { project },
      message: '更新项目状态成功',
    });
  } catch (error: any) {
    logger.error('Update project status error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update status',
      message: error.message || '更新项目状态失败',
    });
  }
});

/**
 * PATCH /api/projects/:id/progress
 * 更新项目进度
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
    const existingProject = await ProjectService.getProjectById(id);
    if (!existingProject) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (existingProject.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权修改此项目',
      });
      return;
    }

    const project = await ProjectService.updateProjectProgress(id, progress);

    res.status(200).json({
      success: true,
      data: { project },
      message: '更新项目进度成功',
    });
  } catch (error: any) {
    logger.error('Update project progress error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update progress',
      message: error.message || '更新项目进度失败',
    });
  }
});

/**
 * POST /api/projects/:id/build
 * 开始构建项目
 */
router.post('/:id/build', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证权限
    const existingProject = await ProjectService.getProjectById(id);
    if (!existingProject) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (existingProject.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此项目',
      });
      return;
    }

    const project = await ProjectService.startBuild(id);

    res.status(200).json({
      success: true,
      data: { project },
      message: '开始构建项目',
    });
  } catch (error: any) {
    logger.error('Start build error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to start build',
      message: error.message || '开始构建失败',
    });
  }
});

/**
 * GET /api/projects/:id/progress
 * 获取构建进度
 */
router.get('/:id/progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证权限
    const existingProject = await ProjectService.getProjectById(id);
    if (!existingProject) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (existingProject.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此项目',
      });
      return;
    }

    const progress = await ProjectService.getBuildProgress(id);

    res.status(200).json({
      success: true,
      data: progress,
      message: '获取构建进度成功',
    });
  } catch (error: any) {
    logger.error('Get build progress error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get progress',
      message: '获取构建进度失败',
    });
  }
});

/**
 * DELETE /api/projects/:id
 * 删除项目
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证权限
    const existingProject = await ProjectService.getProjectById(id);
    if (!existingProject) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (existingProject.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权删除此项目',
      });
      return;
    }

    await ProjectService.deleteProject(id);

    res.status(200).json({
      success: true,
      message: '删除项目成功',
    });
  } catch (error: any) {
    logger.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete project',
      message: '删除项目失败',
    });
  }
});

/**
 * GET /api/projects/stats/count
 * 统计当前用户的项目数量
 */
router.get('/stats/count', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '未认证',
      });
      return;
    }

    const count = await ProjectService.countUserProjects(req.user.userId);

    res.status(200).json({
      success: true,
      data: { count },
      message: '获取项目数量成功',
    });
  } catch (error: any) {
    logger.error('Count projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to count projects',
      message: '获取项目数量失败',
    });
  }
});

/**
 * GET /api/projects/stats/by-status
 * 统计当前用户的项目数量（按状态分组）
 */
router.get('/stats/by-status', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '未认证',
      });
      return;
    }

    const stats = await ProjectService.countUserProjectsByStatus(req.user.userId);

    res.status(200).json({
      success: true,
      data: { stats },
      message: '获取项目统计成功',
    });
  } catch (error: any) {
    logger.error('Count projects by status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stats',
      message: '获取项目统计失败',
    });
  }
});

export default router;
