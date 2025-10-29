import { Router, Request, Response } from 'express';
import { AgentService } from '../services/AgentService';
import { ProjectService } from '../services/ProjectService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * T021 [P] [US2]: Agent路由
 * /api/agents - AI Agent管理相关API
 */

const router = Router();

// 所有Agent路由都需要认证
router.use(authenticate);

/**
 * POST /api/agents
 * 创建新Agent
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, agentType, name, description, capabilities, config } = req.body;

    // 验证必填字段
    if (!projectId || !agentType) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: '缺少必填字段：projectId, agentType',
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

    // 创建Agent
    const agent = await AgentService.createAgent({
      projectId,
      agentType,
      name,
      description,
      capabilities,
      config,
    });

    res.status(201).json({
      success: true,
      data: { agent },
      message: '创建Agent成功',
    });
  } catch (error: any) {
    logger.error('Create agent error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create agent',
      message: error.message || '创建Agent失败',
    });
  }
});

/**
 * POST /api/agents/batch
 * 批量创建项目的所有Agent
 */
router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      res.status(400).json({
        success: false,
        error: 'Missing projectId',
        message: '缺少projectId字段',
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

    // 批量创建Agent
    const agents = await AgentService.createProjectAgents(projectId);

    res.status(201).json({
      success: true,
      data: {
        agents,
        total: agents.length,
      },
      message: '批量创建Agent成功',
    });
  } catch (error: any) {
    logger.error('Batch create agents error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create agents',
      message: error.message || '批量创建Agent失败',
    });
  }
});

/**
 * GET /api/agents/types
 * 获取所有可用的Agent类型
 */
router.get('/types', async (req: Request, res: Response): Promise<void> => {
  try {
    const types = AgentService.getAvailableAgentTypes();

    res.status(200).json({
      success: true,
      data: { types },
      message: '获取Agent类型成功',
    });
  } catch (error: any) {
    logger.error('Get agent types error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get agent types',
      message: '获取Agent类型失败',
    });
  }
});

/**
 * GET /api/agents/:id
 * 获取Agent详情
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeTasks } = req.query;

    let agent;

    if (includeTasks === 'true') {
      agent = await AgentService.getAgentWithTasks(id);
    } else {
      agent = await AgentService.getAgentById(id);
    }

    if (!agent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found',
        message: 'Agent不存在',
      });
      return;
    }

    // 验证用户权限（通过项目）
    const project = await ProjectService.getProjectById(agent.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此Agent',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { agent },
      message: '获取Agent详情成功',
    });
  } catch (error: any) {
    logger.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get agent',
      message: '获取Agent详情失败',
    });
  }
});

/**
 * GET /api/agents/:id/performance
 * 获取Agent性能指标
 */
router.get('/:id/performance', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const agent = await AgentService.getAgentById(id);
    if (!agent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found',
        message: 'Agent不存在',
      });
      return;
    }

    // 验证用户权限
    const project = await ProjectService.getProjectById(agent.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此Agent',
      });
      return;
    }

    const performance = await AgentService.getAgentPerformance(id);

    res.status(200).json({
      success: true,
      data: performance,
      message: '获取Agent性能指标成功',
    });
  } catch (error: any) {
    logger.error('Get agent performance error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get performance',
      message: '获取Agent性能指标失败',
    });
  }
});

/**
 * PUT /api/agents/:id
 * 更新Agent信息
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证Agent存在和权限
    const existingAgent = await AgentService.getAgentById(id);
    if (!existingAgent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found',
        message: 'Agent不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingAgent.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权修改此Agent',
      });
      return;
    }

    const { name, description, capabilities, status, config, metrics } = req.body;

    const agent = await AgentService.updateAgent(id, {
      name,
      description,
      capabilities,
      status,
      config,
      metrics,
    });

    res.status(200).json({
      success: true,
      data: { agent },
      message: '更新Agent成功',
    });
  } catch (error: any) {
    logger.error('Update agent error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update agent',
      message: error.message || '更新Agent失败',
    });
  }
});

/**
 * PATCH /api/agents/:id/status
 * 更新Agent状态
 */
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, currentTask } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'Missing status',
        message: '缺少status字段',
      });
      return;
    }

    // 验证权限
    const existingAgent = await AgentService.getAgentById(id);
    if (!existingAgent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found',
        message: 'Agent不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingAgent.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权修改此Agent',
      });
      return;
    }

    const agent = await AgentService.updateAgentStatus(id, status, currentTask);

    res.status(200).json({
      success: true,
      data: { agent },
      message: '更新Agent状态成功',
    });
  } catch (error: any) {
    logger.error('Update agent status error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update status',
      message: error.message || '更新Agent状态失败',
    });
  }
});

/**
 * DELETE /api/agents/:id
 * 删除Agent
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证权限
    const existingAgent = await AgentService.getAgentById(id);
    if (!existingAgent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found',
        message: 'Agent不存在',
      });
      return;
    }

    const project = await ProjectService.getProjectById(existingAgent.projectId);
    if (!project || project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权删除此Agent',
      });
      return;
    }

    await AgentService.deleteAgent(id);

    res.status(200).json({
      success: true,
      message: '删除Agent成功',
    });
  } catch (error: any) {
    logger.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete agent',
      message: '删除Agent失败',
    });
  }
});

/**
 * GET /api/agents/project/:projectId
 * 获取项目的所有Agent
 */
router.get('/project/:projectId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { skip, take, agentType, status } = req.query;

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

    const agents = await AgentService.getProjectAgents(projectId, {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
      agentType: agentType as string,
      status: status as string,
    });

    res.status(200).json({
      success: true,
      data: {
        agents,
        total: agents.length,
      },
      message: '获取Agent列表成功',
    });
  } catch (error: any) {
    logger.error('Get project agents error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get agents',
      message: '获取Agent列表失败',
    });
  }
});

/**
 * GET /api/agents/project/:projectId/summary
 * 获取项目的Agent摘要
 */
router.get('/project/:projectId/summary', async (req: Request, res: Response): Promise<void> => {
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

    const summary = await AgentService.getProjectAgentsSummary(projectId);

    res.status(200).json({
      success: true,
      data: summary,
      message: '获取Agent摘要成功',
    });
  } catch (error: any) {
    logger.error('Get agents summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get summary',
      message: '获取Agent摘要失败',
    });
  }
});

export default router;
