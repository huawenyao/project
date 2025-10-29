/**
 * Validation Service
 *
 * T024: 输入验证和安全过滤服务
 * 防止 Prompt injection 和恶意输入
 */

import { logger } from '../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  sanitized?: string;
}

class ValidationService {
  /**
   * 验证需求文本输入
   */
  validateRequirementText(text: string): ValidationResult {
    // 长度检查
    if (!text || text.trim().length === 0) {
      return {
        isValid: false,
        reason: '需求描述不能为空',
      };
    }

    if (text.length < 10) {
      return {
        isValid: false,
        reason: '需求描述太短，请提供更详细的信息（至少10个字符）',
      };
    }

    if (text.length > 5000) {
      return {
        isValid: false,
        reason: '需求描述太长，请控制在5000字符以内',
      };
    }

    // 检测 Prompt Injection 模式
    const suspiciousPatterns = [
      /ignore\s+(previous|above|all)\s+(instructions|prompts?)/i,
      /system\s*(prompt|message|instructions)/i,
      /you\s+are\s+(now|a|an)\s+(different|new)/i,
      /new\s+(instructions|prompt|system)/i,
      /forget\s+(everything|all|previous)/i,
      /\[INST\]/i,
      /<\|im_start\|>/i,
      /role\s*:\s*system/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        logger.warn('[ValidationService] Suspicious pattern detected:', { text });
        return {
          isValid: false,
          reason: '输入内容包含可疑模式，请使用正常的需求描述语言',
        };
      }
    }

    // 清理输入
    const sanitized = this.sanitizeInput(text);

    return {
      isValid: true,
      sanitized,
    };
  }

  /**
   * 清理输入文本
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // 移除脚本标签
      .replace(/javascript:/gi, '') // 移除 JavaScript 协议
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // 移除事件处理器
      .trim()
      .substring(0, 5000); // 限制长度
  }

  /**
   * 验证项目名称
   */
  validateProjectName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
      return {
        isValid: false,
        reason: '项目名称不能为空',
      };
    }

    if (name.length < 2) {
      return {
        isValid: false,
        reason: '项目名称至少需要2个字符',
      };
    }

    if (name.length > 100) {
      return {
        isValid: false,
        reason: '项目名称不能超过100个字符',
      };
    }

    // 检查是否包含非法字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      return {
        isValid: false,
        reason: '项目名称包含非法字符',
      };
    }

    return {
      isValid: true,
      sanitized: name.trim(),
    };
  }

  /**
   * 验证 API 输入
   */
  validateApiInput(data: any, schema: any): ValidationResult {
    // 简单的类型检查
    // 实际项目中应使用 Joi 或 Zod 等验证库
    try {
      if (typeof data !== 'object') {
        return {
          isValid: false,
          reason: '无效的输入格式',
        };
      }

      // 检查必需字段
      for (const field of schema.required || []) {
        if (!(field in data)) {
          return {
            isValid: false,
            reason: `缺少必需字段: ${field}`,
          };
        }
      }

      return { isValid: true };
    } catch (error: any) {
      logger.error('[ValidationService] Validation error:', error);
      return {
        isValid: false,
        reason: error.message,
      };
    }
  }

  /**
   * 安全警告检查
   */
  checkSecurityWarnings(input: string): string[] {
    const warnings: string[] = [];

    // 检查是否包含敏感关键词
    const sensitiveKeywords = [
      'password',
      'secret',
      'token',
      'api_key',
      'private_key',
      'credit_card',
    ];

    for (const keyword of sensitiveKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(input)) {
        warnings.push(`检测到敏感关键词: ${keyword}，请确保不要在需求描述中包含实际的敏感信息`);
      }
    }

    return warnings;
  }
}

export default new ValidationService();
