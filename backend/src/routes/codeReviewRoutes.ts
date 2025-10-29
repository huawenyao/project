/**
 * Code Review Routes
 *
 * Sprint 5 - US6: 智能代码审查与优化建议
 */

import express from 'express';
import CodeReviewService from '../services/CodeReviewService';
import { auth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/code-review
 * 审查代码
 */
router.post('/', auth, async (req, res) => {
  try {
    const { code, language, filename, context } = req.body;

    if (!code || !language || !filename) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const result = await CodeReviewService.reviewCode({
      code,
      language,
      filename,
      context,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('[Code Review Routes] Error reviewing code:', error);
    res.status(500).json({
      success: false,
      error: '代码审查失败',
    });
  }
});

/**
 * POST /api/code-review/project/:id
 * 审查整个项目
 */
router.post('/project/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await CodeReviewService.reviewProject(id);

    res.json(result);
  } catch (error: any) {
    logger.error('[Code Review Routes] Error reviewing project:', error);
    res.status(500).json({
      success: false,
      error: '项目审查失败',
    });
  }
});

/**
 * POST /api/code-review/impact
 * 分析代码修改影响
 */
router.post('/impact', auth, async (req, res) => {
  try {
    const { originalCode, modifiedCode, projectId } = req.body;

    if (!originalCode || !modifiedCode || !projectId) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const result = await CodeReviewService.analyzeImpact({
      originalCode,
      modifiedCode,
      projectId,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('[Code Review Routes] Error analyzing impact:', error);
    res.status(500).json({
      success: false,
      error: '影响分析失败',
    });
  }
});

/**
 * POST /api/code-review/documentation
 * 生成代码文档
 */
router.post('/documentation', auth, async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const result = await CodeReviewService.generateDocumentation(code, language);

    res.json(result);
  } catch (error: any) {
    logger.error('[Code Review Routes] Error generating documentation:', error);
    res.status(500).json({
      success: false,
      error: '文档生成失败',
    });
  }
});

export default router;
