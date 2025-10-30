/**
 * T114: ErrorClassifier Service
 *
 * Phase 8 - Error Recovery & Resilience
 *
 * 功能：
 * - 对 Agent 错误进行分类 (minor vs critical)
 * - 决定是否可以自动重试
 * - 提供错误严重性评估
 * - 支持错误模式识别
 */

import { logger } from '../utils/logger';

export enum ErrorSeverity {
  MINOR = 'minor', // 可以自动重试的轻微错误
  MODERATE = 'moderate', // 需要用户确认的中等错误
  CRITICAL = 'critical', // 严重错误，需要立即停止
  FATAL = 'fatal', // 致命错误，无法恢复
}

export enum ErrorCategory {
  NETWORK = 'network', // 网络错误
  TIMEOUT = 'timeout', // 超时错误
  API_LIMIT = 'api_limit', // API 限流
  VALIDATION = 'validation', // 验证错误
  DEPENDENCY = 'dependency', // 依赖错误
  INTERNAL = 'internal', // 内部错误
  UNKNOWN = 'unknown', // 未知错误
}

export interface ErrorClassification {
  severity: ErrorSeverity;
  category: ErrorCategory;
  isRetryable: boolean;
  suggestedAction: 'retry' | 'skip' | 'abort' | 'manual';
  retryDelay?: number; // 推荐的重试延迟 (毫秒)
  maxRetries?: number; // 推荐的最大重试次数
  message: string; // 用户友好的错误说明
}

export class ErrorClassifier {
  /**
   * 分类错误
   */
  classify(error: Error | any): ErrorClassification {
    try {
      const errorMessage = error.message || String(error);
      const errorName = error.name || 'Error';

      // 1. 网络错误 (可重试)
      if (this.isNetworkError(error)) {
        return {
          severity: ErrorSeverity.MINOR,
          category: ErrorCategory.NETWORK,
          isRetryable: true,
          suggestedAction: 'retry',
          retryDelay: 2000,
          maxRetries: 3,
          message: '网络连接错误，正在自动重试...',
        };
      }

      // 2. 超时错误 (可重试)
      if (this.isTimeoutError(error)) {
        return {
          severity: ErrorSeverity.MINOR,
          category: ErrorCategory.TIMEOUT,
          isRetryable: true,
          suggestedAction: 'retry',
          retryDelay: 3000,
          maxRetries: 3,
          message: '请求超时，正在自动重试...',
        };
      }

      // 3. API 限流 (可重试，延迟更长)
      if (this.isRateLimitError(error)) {
        return {
          severity: ErrorSeverity.MODERATE,
          category: ErrorCategory.API_LIMIT,
          isRetryable: true,
          suggestedAction: 'retry',
          retryDelay: 10000, // 10秒
          maxRetries: 2,
          message: 'API 请求限流，稍后重试...',
        };
      }

      // 4. 验证错误 (不可重试)
      if (this.isValidationError(error)) {
        return {
          severity: ErrorSeverity.MODERATE,
          category: ErrorCategory.VALIDATION,
          isRetryable: false,
          suggestedAction: 'manual',
          message: '输入验证失败，请检查输入内容',
        };
      }

      // 5. 依赖错误 (可能可重试)
      if (this.isDependencyError(error)) {
        return {
          severity: ErrorSeverity.MODERATE,
          category: ErrorCategory.DEPENDENCY,
          isRetryable: true,
          suggestedAction: 'retry',
          retryDelay: 5000,
          maxRetries: 2,
          message: '依赖服务暂时不可用，正在重试...',
        };
      }

      // 6. 内部错误 (严重)
      if (this.isInternalError(error)) {
        return {
          severity: ErrorSeverity.CRITICAL,
          category: ErrorCategory.INTERNAL,
          isRetryable: false,
          suggestedAction: 'abort',
          message: '系统内部错误，请联系支持团队',
        };
      }

      // 7. 未知错误 (保守处理)
      return {
        severity: ErrorSeverity.MODERATE,
        category: ErrorCategory.UNKNOWN,
        isRetryable: false,
        suggestedAction: 'manual',
        message: `未知错误: ${errorMessage}`,
      };
    } catch (classifyError: any) {
      logger.error('[ErrorClassifier] Failed to classify error:', classifyError);

      // 分类失败，返回保守的分类
      return {
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.UNKNOWN,
        isRetryable: false,
        suggestedAction: 'abort',
        message: '错误分类失败，请手动处理',
      };
    }
  }

  /**
   * 判断是否为网络错误
   */
  private isNetworkError(error: any): boolean {
    const networkPatterns = [
      /network/i,
      /ECONNREFUSED/,
      /ECONNRESET/,
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ENETUNREACH/,
      /socket hang up/i,
    ];

    const errorString = String(error.message || error);
    return networkPatterns.some((pattern) => pattern.test(errorString));
  }

  /**
   * 判断是否为超时错误
   */
  private isTimeoutError(error: any): boolean {
    const timeoutPatterns = [/timeout/i, /ETIMEDOUT/, /timed out/i, /time out/i];

    const errorString = String(error.message || error);
    return timeoutPatterns.some((pattern) => pattern.test(errorString));
  }

  /**
   * 判断是否为 API 限流错误
   */
  private isRateLimitError(error: any): boolean {
    const rateLimitPatterns = [
      /rate limit/i,
      /too many requests/i,
      /429/,
      /quota exceeded/i,
      /throttle/i,
    ];

    const errorString = String(error.message || error);
    const statusCode = error.response?.status || error.statusCode;

    return (
      rateLimitPatterns.some((pattern) => pattern.test(errorString)) || statusCode === 429
    );
  }

  /**
   * 判断是否为验证错误
   */
  private isValidationError(error: any): boolean {
    const validationPatterns = [
      /validation/i,
      /invalid/i,
      /required/i,
      /must be/i,
      /should be/i,
      /400/,
    ];

    const errorString = String(error.message || error);
    const errorName = error.name;
    const statusCode = error.response?.status || error.statusCode;

    return (
      errorName === 'ValidationError' ||
      validationPatterns.some((pattern) => pattern.test(errorString)) ||
      statusCode === 400
    );
  }

  /**
   * 判断是否为依赖错误
   */
  private isDependencyError(error: any): boolean {
    const dependencyPatterns = [
      /service unavailable/i,
      /503/,
      /502/,
      /504/,
      /upstream/i,
      /dependency/i,
    ];

    const errorString = String(error.message || error);
    const statusCode = error.response?.status || error.statusCode;

    return (
      dependencyPatterns.some((pattern) => pattern.test(errorString)) ||
      statusCode === 503 ||
      statusCode === 502 ||
      statusCode === 504
    );
  }

  /**
   * 判断是否为内部错误
   */
  private isInternalError(error: any): boolean {
    const internalPatterns = [
      /internal server error/i,
      /500/,
      /uncaught exception/i,
      /fatal/i,
    ];

    const errorString = String(error.message || error);
    const statusCode = error.response?.status || error.statusCode;

    return (
      internalPatterns.some((pattern) => pattern.test(errorString)) || statusCode === 500
    );
  }

  /**
   * 计算指数退避延迟
   */
  calculateBackoffDelay(retryCount: number, baseDelay: number = 1000): number {
    // 指数退避: 1s, 2s, 4s, 8s...
    // 最大延迟: 10s
    const delay = baseDelay * Math.pow(2, retryCount);
    return Math.min(delay, 10000);
  }

  /**
   * 判断是否应该重试
   */
  shouldRetry(classification: ErrorClassification, currentRetryCount: number): boolean {
    if (!classification.isRetryable) {
      return false;
    }

    const maxRetries = classification.maxRetries || 3;
    return currentRetryCount < maxRetries;
  }
}

export default new ErrorClassifier();
