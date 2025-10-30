/**
 * T118: ErrorCard Component
 *
 * Phase 8 - Error Recovery & Resilience
 *
 * 功能：
 * - 显示 Agent 错误详情
 * - 提供用户操作按钮 (retry/skip/abort)
 * - 显示重试进度
 * - 显示错误分类和建议
 */

import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

export interface ErrorClassification {
  severity: 'minor' | 'moderate' | 'critical' | 'fatal';
  category: 'network' | 'timeout' | 'api_limit' | 'validation' | 'dependency' | 'internal' | 'unknown';
  isRetryable: boolean;
  suggestedAction: 'retry' | 'skip' | 'abort' | 'manual';
  message: string;
}

export interface AgentErrorData {
  sessionId: string;
  agentType: string;
  error: string;
  classification: ErrorClassification;
  retryCount: number;
  maxRetries: number;
  retrying: boolean;
  delay?: number;
  critical?: boolean;
  timestamp: Date;
}

interface ErrorCardProps {
  errorData: AgentErrorData;
  onRetry?: () => void;
  onSkip?: () => void;
  onAbort?: () => void;
  onDismiss?: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  errorData,
  onRetry,
  onSkip,
  onAbort,
  onDismiss,
}) => {
  const {
    agentType,
    error,
    classification,
    retryCount,
    maxRetries,
    retrying,
    delay,
    critical,
  } = errorData;

  // 根据严重程度选择颜色
  const getSeverityColor = () => {
    switch (classification.severity) {
      case 'fatal':
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'moderate':
        return 'border-yellow-500 bg-yellow-50';
      case 'minor':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  // 根据严重程度选择图标颜色
  const getIconColor = () => {
    switch (classification.severity) {
      case 'fatal':
      case 'critical':
        return 'text-red-600';
      case 'moderate':
        return 'text-yellow-600';
      case 'minor':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  // 格式化 Agent 名称
  const formatAgentName = (type: string) => {
    const names: Record<string, string> = {
      'UIAgent': 'UI设计师',
      'BackendAgent': '后端工程师',
      'DatabaseAgent': '数据库工程师',
      'IntegrationAgent': '集成工程师',
      'DeploymentAgent': '部署工程师',
    };
    return names[type] || type;
  };

  // 翻译错误分类
  const translateCategory = (category: string) => {
    const translations: Record<string, string> = {
      'network': '网络错误',
      'timeout': '超时错误',
      'api_limit': 'API限流',
      'validation': '验证错误',
      'dependency': '依赖错误',
      'internal': '内部错误',
      'unknown': '未知错误',
    };
    return translations[category] || category;
  };

  return (
    <div
      className={`
        relative border-2 rounded-lg p-4 shadow-md
        ${getSeverityColor()}
        transition-all duration-300
        animate-slideIn
      `}
    >
      {/* 关闭按钮 */}
      {onDismiss && !retrying && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="关闭"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}

      {/* 头部 */}
      <div className="flex items-start gap-3 mb-3">
        {/* 错误图标 */}
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          <ExclamationTriangleIcon className="w-6 h-6" />
        </div>

        {/* 标题和分类 */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {formatAgentName(agentType)} 遇到错误
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="px-2 py-0.5 bg-white rounded border border-gray-300">
              {translateCategory(classification.category)}
            </span>
            <span>•</span>
            <span>{classification.severity.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* 错误消息 */}
      <div className="mb-3 p-3 bg-white rounded border border-gray-200">
        <p className="text-sm text-gray-700 leading-relaxed">{error}</p>
      </div>

      {/* AI 建议 */}
      {classification.message && (
        <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">💡 建议：</span>
            {classification.message}
          </p>
        </div>
      )}

      {/* 重试状态 */}
      {retrying && (
        <div className="mb-3 p-3 bg-purple-50 rounded border border-purple-200">
          <div className="flex items-center gap-2 text-purple-800 mb-2">
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">
              正在重试 ({retryCount}/{maxRetries})
            </span>
          </div>
          {delay && (
            <p className="text-xs text-purple-600">
              下次重试将在 {Math.round(delay / 1000)} 秒后进行...
            </p>
          )}
          {/* 重试进度条 */}
          <div className="mt-2 w-full bg-purple-200 rounded-full h-1.5">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(retryCount / maxRetries) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      {!retrying && (
        <div className="flex gap-2">
          {/* 重试按钮 */}
          {classification.isRetryable && onRetry && (
            <button
              onClick={onRetry}
              className="
                flex-1 px-4 py-2 bg-blue-600 text-white rounded-md
                hover:bg-blue-700 active:bg-blue-800
                transition-colors duration-200
                flex items-center justify-center gap-2
                font-medium text-sm
              "
            >
              <ArrowPathIcon className="w-4 h-4" />
              手动重试
            </button>
          )}

          {/* 跳过按钮 */}
          {!critical && onSkip && (
            <button
              onClick={onSkip}
              className="
                flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md
                hover:bg-gray-300 active:bg-gray-400
                transition-colors duration-200
                flex items-center justify-center gap-2
                font-medium text-sm
              "
            >
              <CheckCircleIcon className="w-4 h-4" />
              跳过此步骤
            </button>
          )}

          {/* 终止按钮 */}
          {onAbort && (
            <button
              onClick={onAbort}
              className="
                flex-1 px-4 py-2 bg-red-600 text-white rounded-md
                hover:bg-red-700 active:bg-red-800
                transition-colors duration-200
                flex items-center justify-center gap-2
                font-medium text-sm
              "
            >
              <XCircleIcon className="w-4 h-4" />
              终止构建
            </button>
          )}
        </div>
      )}

      {/* 致命错误提示 */}
      {critical && !retrying && (
        <div className="mt-3 p-2 bg-red-100 rounded border border-red-300">
          <p className="text-xs text-red-800 flex items-center gap-1">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="font-medium">这是关键错误，必须解决后才能继续</span>
          </p>
        </div>
      )}

      {/* 时间戳 */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            <span>{new Date(errorData.timestamp).toLocaleTimeString('zh-CN')}</span>
          </div>
          {retryCount > 0 && (
            <span className="text-gray-400">已重试 {retryCount} 次</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorCard;
