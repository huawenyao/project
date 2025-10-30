/**
 * Deployment Routes
 *
 * Sprint 4 - US5: 一键部署
 */

import express from 'express';
import DeploymentService from '../services/DeploymentService';
import { authenticate as auth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/deployments
 * 开始部署流程
 */
router.post('/', auth, async (req, res) => {
  try {
    const { projectId, config } = req.body;

    if (!projectId || !config) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const result = await DeploymentService.deploy({
      projectId,
      config,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('[Deployment Routes] Error starting deployment:', error);
    res.status(500).json({
      success: false,
      error: '部署启动失败',
    });
  }
});

/**
 * GET /api/deployments/:id
 * 获取部署状态
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await DeploymentService.getDeploymentStatus(id);

    res.json(result);
  } catch (error: any) {
    logger.error('[Deployment Routes] Error getting deployment status:', error);
    res.status(500).json({
      success: false,
      error: '获取部署状态失败',
    });
  }
});

/**
 * POST /api/deployments/:id/rollback
 * 回滚部署
 */
router.post('/:id/rollback', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await DeploymentService.rollback(id);

    res.json(result);
  } catch (error: any) {
    logger.error('[Deployment Routes] Error rolling back deployment:', error);
    res.status(500).json({
      success: false,
      error: '部署回滚失败',
    });
  }
});

export default router;
