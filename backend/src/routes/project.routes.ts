import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/ProjectService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import nlpService from '../services/NLPService';
import validationService from '../services/ValidationService';
import versionService from '../services/VersionService';
import dataModelService from '../services/DataModelService';

/**
 * T020 [P] [US1]: 项目路由
 * /api/projects - 项目管理相关API
 * T025-T026: 支持 NLP 需求解析和验证
 */

const router = Router();

// 所有项目路由都需要认证
router.use(authenticate);

/**
 * POST /api/projects
 * 创建新项目（包含 NLP 需求解析）
 * T026: 实现 POST /api/projects 端点
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

    // T025: 验证输入
    const nameValidation = validationService.validateProjectName(name);
    if (!nameValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid project name',
        message: nameValidation.reason || '项目名称不合法',
      });
      return;
    }

    const textValidation = validationService.validateRequirementText(requirementText);
    if (!textValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid requirement text',
        message: textValidation.reason || '需求描述不合法',
      });
      return;
    }

    // T026: 使用 NLP 服务解析需求
    const nlpResult = await nlpService.parseRequirement(requirementText);

    // 创建项目
    const project = await ProjectService.createProject({
      userId: req.user.userId,
      name: nameValidation.sanitized || name,
      requirementText: textValidation.sanitized || requirementText,
    });

    // T029.2: 创建初始版本快照
    try {
      await versionService.createSnapshot(
        project.id,
        req.user.userId,
        '项目初始创建'
      );
    } catch (versionError) {
      logger.warn('Failed to create initial version snapshot:', versionError);
    }

    res.status(201).json({
      success: true,
      data: {
        project,
        nlpAnalysis: nlpResult.success ? nlpResult.data : undefined,
        clarifications: nlpResult.clarifications,
      },
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

/**
 * GET /api/projects/:id/versions
 * 获取项目的版本列表
 * T029.2: 版本管理 API
 */
router.get('/:id/versions', async (req: Request, res: Response): Promise<void> => {
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

    const versions = await versionService.getVersions(id);

    res.status(200).json({
      success: true,
      data: { versions },
      message: '获取版本列表成功',
    });
  } catch (error: any) {
    logger.error('Get versions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get versions',
      message: '获取版本列表失败',
    });
  }
});

/**
 * POST /api/projects/:id/versions
 * 创建项目版本快照
 * T029.2: 版本管理 API
 */
router.post('/:id/versions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { description } = req.body;

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

    const version = await versionService.createSnapshot(
      id,
      req.user!.userId,
      description
    );

    res.status(201).json({
      success: true,
      data: { version },
      message: '创建版本快照成功',
    });
  } catch (error: any) {
    logger.error('Create version error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create version',
      message: error.message || '创建版本快照失败',
    });
  }
});

/**
 * POST /api/projects/:id/versions/:versionId/restore
 * 恢复到指定版本
 * T029.2: 版本管理 API
 */
router.post('/:id/versions/:versionId/restore', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, versionId } = req.params;

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

    await versionService.restoreVersion(id, versionId, req.user!.userId);

    res.status(200).json({
      success: true,
      message: '恢复版本成功',
    });
  } catch (error: any) {
    logger.error('Restore version error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to restore version',
      message: error.message || '恢复版本失败',
    });
  }
});

/**
 * GET /api/projects/:id/versions/compare
 * 对比两个版本
 * T029.2: 版本管理 API
 */
router.get('/:id/versions/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { versionId1, versionId2 } = req.query;

    if (!versionId1 || !versionId2) {
      res.status(400).json({
        success: false,
        error: 'Missing version IDs',
        message: '缺少版本ID参数',
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
        message: '无权访问此项目',
      });
      return;
    }

    const diff = await versionService.compareVersions(
      versionId1 as string,
      versionId2 as string
    );

    res.status(200).json({
      success: true,
      data: { diff },
      message: '版本对比成功',
    });
  } catch (error: any) {
    logger.error('Compare versions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compare versions',
      message: '版本对比失败',
    });
  }
});

/**
 * GET /api/projects/:id/data-models
 * 获取项目的数据模型
 * T070: Phase 6 - 智能数据模型推荐
 */
router.get('/:id/data-models', async (req: Request, res: Response): Promise<void> => {
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

    const result = await dataModelService.getDataModels(id);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
        message: '获取数据模型失败',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { models: result.data },
      message: '获取数据模型成功',
    });
  } catch (error: any) {
    logger.error('Get data models error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get data models',
      message: '获取数据模型失败',
    });
  }
});

/**
 * POST /api/projects/:id/data-models/recommend
 * 推荐数据模型
 * T067-T068: Phase 6 - 智能数据模型推荐
 */
router.post('/:id/data-models/recommend', async (req: Request, res: Response): Promise<void> => {
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

    const result = await dataModelService.recommendDataModels(id);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
        message: '推荐数据模型失败',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { recommendations: result.data },
      message: '推荐数据模型成功',
    });
  } catch (error: any) {
    logger.error('Recommend data models error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to recommend data models',
      message: '推荐数据模型失败',
    });
  }
});

/**
 * POST /api/projects/:id/data-models/analyze-impact
 * 分析数据模型变更的影响
 * T069: Phase 6 - 影响分析
 */
router.post('/:id/data-models/analyze-impact', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { changes } = req.body;

    if (!changes || !Array.isArray(changes)) {
      res.status(400).json({
        success: false,
        error: 'Invalid changes',
        message: '缺少或无效的changes参数',
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
        message: '无权操作此项目',
      });
      return;
    }

    const result = await dataModelService.analyzeImpact(id, changes);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
        message: '影响分析失败',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { analysis: result.data },
      message: '影响分析成功',
    });
  } catch (error: any) {
    logger.error('Analyze impact error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze impact',
      message: '影响分析失败',
    });
  }
});

/**
 * POST /api/projects/:id/deploy
 * 部署项目
 * T081: Phase 7 - 一键部署
 */
router.post('/:id/deploy', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { config } = req.body;

    if (!config || !config.environment) {
      res.status(400).json({
        success: false,
        error: 'Invalid config',
        message: '缺少或无效的config参数',
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
        message: '无权操作此项目',
      });
      return;
    }

    // 导入部署服务
    const DeploymentService = (await import('../services/DeploymentService')).default;

    const result = await DeploymentService.deploy({
      projectId: id,
      config,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
        message: '部署失败',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { deploymentId: result.deploymentId },
      message: '部署已启动',
    });
  } catch (error: any) {
    logger.error('Deploy project error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deploy project',
      message: '部署项目失败',
    });
  }
});

/**
 * GET /api/projects/:id/deployments
 * 获取项目的部署历史
 * T081: Phase 7 - 一键部署
 */
router.get('/:id/deployments', async (req: Request, res: Response): Promise<void> => {
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

    // 从数据库获取部署历史
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const deployments = await prisma.deployment.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.status(200).json({
      success: true,
      data: { deployments },
      message: '获取部署历史成功',
    });
  } catch (error: any) {
    logger.error('Get deployments error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get deployments',
      message: '获取部署历史失败',
    });
  }
});

export default router;
