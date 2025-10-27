/**
 * Visualization Routes
 *
 * 可视化系统的 RESTful API 路由
 */

import { Router, Request, Response } from 'express';
import {
  visualizationService,
  agentStatusService,
  decisionService,
  errorService,
  collaborationService,
} from '../services';
import logger from '../utils/logger';

const router = Router();

// ==================== Build Session Routes ====================

/**
 * POST /api/visualization/sessions
 * 创建新的构建会话
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const result = await visualizationService.createSession(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error: any) {
    logger.error('Error creating session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId
 * 获取会话详情
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await visualizationService.getSessionDetails(sessionId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error: any) {
    logger.error('Error getting session details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/snapshot
 * 获取会话实时快照
 */
router.get('/sessions/:sessionId/snapshot', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await visualizationService.getSessionSnapshot(sessionId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error: any) {
    logger.error('Error getting session snapshot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/visualization/sessions/:sessionId/status
 * 更新会话状态
 */
router.patch('/sessions/:sessionId/status', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status, endTime } = req.body;
    const result = await visualizationService.updateSessionStatus(
      sessionId,
      status,
      endTime ? new Date(endTime) : undefined
    );
    res.status(result.success ? 200 : 404).json(result);
  } catch (error: any) {
    logger.error('Error updating session status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/users/:userId/sessions
 * 获取用户的会话列表
 */
router.get('/users/:userId/sessions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const includeArchived = req.query.includeArchived === 'true';

    const result = await visualizationService.getUserSessions(userId, page, pageSize, includeArchived);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting user sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/projects/:projectId/sessions
 * 获取项目的会话列表
 */
router.get('/projects/:projectId/sessions', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await visualizationService.getProjectSessions(projectId, page, pageSize);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting project sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/visualization/sessions/:sessionId
 * 删除会话
 */
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await visualizationService.deleteSession(sessionId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error: any) {
    logger.error('Error deleting session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Agent Status Routes ====================

/**
 * POST /api/visualization/agent-statuses
 * 创建 Agent 状态记录
 */
router.post('/agent-statuses', async (req: Request, res: Response) => {
  try {
    const result = await agentStatusService.createStatus(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error: any) {
    logger.error('Error creating agent status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/visualization/agent-statuses/:statusId
 * 更新 Agent 状态
 */
router.patch('/agent-statuses/:statusId', async (req: Request, res: Response) => {
  try {
    const { statusId } = req.params;
    const result = await agentStatusService.updateStatus(statusId, req.body);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error: any) {
    logger.error('Error updating agent status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/agent-statuses
 * 获取会话的所有 Agent 状态
 */
router.get('/sessions/:sessionId/agent-statuses', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await agentStatusService.getSessionStatuses(sessionId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting agent statuses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/progress
 * 获取会话整体进度
 */
router.get('/sessions/:sessionId/progress', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await agentStatusService.calculateSessionProgress(sessionId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error calculating session progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/agent-personas
 * 获取所有 Agent 拟人化配置
 */
router.get('/agent-personas', async (req: Request, res: Response) => {
  try {
    const result = await agentStatusService.getAllAgentPersonas();
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting agent personas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Decision Routes ====================

/**
 * POST /api/visualization/decisions
 * 创建决策记录
 */
router.post('/decisions', async (req: Request, res: Response) => {
  try {
    const result = await decisionService.createDecision(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error: any) {
    logger.error('Error creating decision:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/visualization/decisions-with-preview
 * 创建决策及预览数据
 */
router.post('/decisions-with-preview', async (req: Request, res: Response) => {
  try {
    const { decision, preview } = req.body;
    const result = await decisionService.createDecisionWithPreview(decision, preview);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error: any) {
    logger.error('Error creating decision with preview:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/decisions
 * 获取会话的决策记录
 */
router.get('/sessions/:sessionId/decisions', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const result = await decisionService.getSessionDecisions(sessionId, page, pageSize);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting session decisions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/decisions/:decisionId
 * 获取决策详情
 */
router.get('/decisions/:decisionId', async (req: Request, res: Response) => {
  try {
    const { decisionId } = req.params;
    const result = await decisionService.getDecisionDetails(decisionId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error: any) {
    logger.error('Error getting decision details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/decisions/stats
 * 获取决策统计
 */
router.get('/sessions/:sessionId/decisions/stats', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await decisionService.getDecisionStats(sessionId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting decision stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/decisions/search
 * 搜索决策
 */
router.get('/sessions/:sessionId/decisions/search', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }

    const result = await decisionService.searchDecisions(sessionId, query);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error searching decisions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Error Routes ====================

/**
 * POST /api/visualization/errors
 * 记录错误
 */
router.post('/errors', async (req: Request, res: Response) => {
  try {
    const result = await errorService.recordError(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error: any) {
    logger.error('Error recording error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/visualization/errors/:errorId/resolution
 * 更新错误解决状态
 */
router.patch('/errors/:errorId/resolution', async (req: Request, res: Response) => {
  try {
    const { errorId } = req.params;
    const { resolution, resolutionNotes } = req.body;
    const result = await errorService.updateErrorResolution(errorId, resolution, resolutionNotes);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error: any) {
    logger.error('Error updating error resolution:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/errors
 * 获取会话的错误记录
 */
router.get('/sessions/:sessionId/errors', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await errorService.getSessionErrors(sessionId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting session errors:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/errors/stats
 * 获取错误统计
 */
router.get('/sessions/:sessionId/errors/stats', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await errorService.getErrorStats(sessionId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting error stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Collaboration Routes ====================

/**
 * POST /api/visualization/collaborations
 * 记录协作事件
 */
router.post('/collaborations', async (req: Request, res: Response) => {
  try {
    const result = await collaborationService.recordCollaboration(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error: any) {
    logger.error('Error recording collaboration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/collaborations
 * 获取会话的协作事件
 */
router.get('/sessions/:sessionId/collaborations', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await collaborationService.getSessionCollaborations(sessionId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting session collaborations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/collaborations/flow
 * 获取协作流程图数据
 */
router.get('/sessions/:sessionId/collaborations/flow', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await collaborationService.getCollaborationFlow(sessionId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting collaboration flow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/visualization/sessions/:sessionId/collaborations/stats
 * 获取协作统计
 */
router.get('/sessions/:sessionId/collaborations/stats', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await collaborationService.getCollaborationStats(sessionId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error getting collaboration stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
