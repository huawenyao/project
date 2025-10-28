/**
 * StatusBadge
 *
 * 状态徽章 UI 组件
 * 用于显示 Agent 状态的彩色徽章
 */

import React from 'react';
import type { AgentStatus } from '../../types/visualization.types';

export interface StatusBadgeProps {
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = false,
  className = '',
}) => {
  // 获取状态配置
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: '等待中',
          bgColor: 'bg-agent-pending-light',
          textColor: 'text-agent-pending-text',
          borderColor: 'border-agent-pending',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'in_progress':
        return {
          label: '进行中',
          bgColor: 'bg-agent-inProgress-light',
          textColor: 'text-agent-inProgress-text',
          borderColor: 'border-agent-inProgress',
          icon: (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
          animate: 'animate-pulse-scale',
        };
      case 'completed':
        return {
          label: '已完成',
          bgColor: 'bg-agent-completed-light',
          textColor: 'text-agent-completed-text',
          borderColor: 'border-agent-completed',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case 'failed':
        return {
          label: '失败',
          bgColor: 'bg-agent-failed-light',
          textColor: 'text-agent-failed-text',
          borderColor: 'border-agent-failed',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };
      case 'retrying':
        return {
          label: '重试中',
          bgColor: 'bg-agent-retrying-light',
          textColor: 'text-agent-retrying-text',
          borderColor: 'border-agent-retrying',
          icon: (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          animate: 'animate-pulse',
        };
      case 'skipped':
        return {
          label: '已跳过',
          bgColor: 'bg-agent-skipped-light',
          textColor: 'text-agent-skipped-text',
          borderColor: 'border-agent-skipped',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      default:
        return {
          label: status,
          bgColor: 'bg-surface-elevated',
          textColor: 'text-text-secondary',
          borderColor: 'border-border',
          icon: null,
        };
    }
  };

  // 获取尺寸类
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      case 'md':
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`
        status-badge
        inline-flex items-center space-x-1
        ${getSizeClass()}
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        border
        rounded-full
        font-medium
        ${config.animate || ''}
        ${className}
      `}
    >
      {showIcon && config.icon && (
        <span className="flex-shrink-0">{config.icon}</span>
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
