/**
 * NLP Routes - Natural Language Processing API
 *
 * Sprint 1 - US1: 自然语言应用创建
 */

import express from 'express';
import NLPService from '../services/NLPService';
import { authenticate as auth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/nlp/parse
 * 解析自然语言需求
 */
router.post('/parse', auth, async (req, res) => {
  try {
    const { requirementText } = req.body;

    if (!requirementText) {
      return res.status(400).json({
        success: false,
        error: '需求描述不能为空',
      });
    }

    // 验证输入
    const validation = await NLPService.validateInput(requirementText);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.reason,
      });
    }

    // 解析需求
    const result = await NLPService.parseRequirement(requirementText);

    res.json(result);
  } catch (error: any) {
    logger.error('[NLP Routes] Error parsing requirement:', error);
    res.status(500).json({
      success: false,
      error: '需求解析失败',
    });
  }
});

/**
 * POST /api/nlp/validate
 * 验证输入是否安全
 */
router.post('/validate', auth, async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        error: '输入不能为空',
      });
    }

    const result = await NLPService.validateInput(input);

    res.json(result);
  } catch (error: any) {
    logger.error('[NLP Routes] Error validating input:', error);
    res.status(500).json({
      success: false,
      error: '输入验证失败',
    });
  }
});

export default router;
