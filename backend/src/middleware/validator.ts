import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * T023: 请求验证中间件
 * 提供通用的参数验证功能
 */

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  body?: ValidationRule[];
  query?: ValidationRule[];
  params?: ValidationRule[];
}

/**
 * 创建验证中间件
 */
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // 验证body
    if (schema.body) {
      const bodyErrors = validateFields(req.body, schema.body, 'body');
      errors.push(...bodyErrors);
    }

    // 验证query
    if (schema.query) {
      const queryErrors = validateFields(req.query, schema.query, 'query');
      errors.push(...queryErrors);
    }

    // 验证params
    if (schema.params) {
      const paramsErrors = validateFields(req.params, schema.params, 'params');
      errors.push(...paramsErrors);
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: '参数验证失败',
        details: errors,
      });
      return;
    }

    next();
  };
};

/**
 * 验证字段
 */
function validateFields(
  data: any,
  rules: ValidationRule[],
  source: string
): string[] {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    // 检查必填
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${source}.${rule.field} is required`);
      continue;
    }

    // 如果不是必填且值为空，跳过其他验证
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // 类型验证
    const typeError = validateType(value, rule, source);
    if (typeError) {
      errors.push(typeError);
      continue;
    }

    // 长度/范围验证
    if (rule.min !== undefined || rule.max !== undefined) {
      const rangeError = validateRange(value, rule, source);
      if (rangeError) {
        errors.push(rangeError);
      }
    }

    // 正则验证
    if (rule.pattern) {
      if (typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`${source}.${rule.field} format is invalid`);
      }
    }

    // 自定义验证
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        const errorMsg = typeof customResult === 'string'
          ? customResult
          : `${source}.${rule.field} custom validation failed`;
        errors.push(errorMsg);
      }
    }
  }

  return errors;
}

/**
 * 类型验证
 */
function validateType(value: any, rule: ValidationRule, source: string): string | null {
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        return `${source}.${rule.field} must be a string`;
      }
      break;

    case 'number':
      if (typeof value !== 'number' && isNaN(Number(value))) {
        return `${source}.${rule.field} must be a number`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return `${source}.${rule.field} must be a boolean`;
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value !== 'string' || !emailRegex.test(value)) {
        return `${source}.${rule.field} must be a valid email`;
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return `${source}.${rule.field} must be an array`;
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        return `${source}.${rule.field} must be an object`;
      }
      break;
  }

  return null;
}

/**
 * 范围验证
 */
function validateRange(value: any, rule: ValidationRule, source: string): string | null {
  if (rule.type === 'string' || Array.isArray(value)) {
    const length = typeof value === 'string' ? value.length : value.length;

    if (rule.min !== undefined && length < rule.min) {
      return `${source}.${rule.field} length must be at least ${rule.min}`;
    }

    if (rule.max !== undefined && length > rule.max) {
      return `${source}.${rule.field} length must not exceed ${rule.max}`;
    }
  } else if (rule.type === 'number') {
    const num = Number(value);

    if (rule.min !== undefined && num < rule.min) {
      return `${source}.${rule.field} must be at least ${rule.min}`;
    }

    if (rule.max !== undefined && num > rule.max) {
      return `${source}.${rule.field} must not exceed ${rule.max}`;
    }
  }

  return null;
}

/**
 * 快捷验证函数
 */

// 验证UUID
export const validateUUID = (field: string, source: 'params' | 'query' | 'body' = 'params') => {
  return validate({
    [source]: [{
      field,
      type: 'string',
      required: true,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    }],
  });
};

// 验证分页参数
export const validatePagination = validate({
  query: [
    {
      field: 'skip',
      type: 'number',
      required: false,
      min: 0,
    },
    {
      field: 'take',
      type: 'number',
      required: false,
      min: 1,
      max: 100,
    },
  ],
});

export default { validate, validateUUID, validatePagination };
