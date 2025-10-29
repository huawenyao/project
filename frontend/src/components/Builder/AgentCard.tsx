/**
 * Agent Card Component
 *
 * Phase 4 - User Story 2: Agent协作可视化
 * T042: 单个Agent卡片组件 - 显示Agent状态、进度、任务
 */

import React from 'react';
import { Card, Progress, Tag, Typography, Space, Badge, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ApiOutlined,
  CodeOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { AgentState, AgentType, AgentStatus } from '../../stores/agentStore';

const { Text, Paragraph } = Typography;

export interface AgentCardProps {
  agent: AgentState;
  onClick?: (agent: AgentState) => void;
  compact?: boolean;
}

const AGENT_CONFIG: Record<
  AgentType,
  {
    name: string;
    icon: React.ReactNode;
    description: string;
    color: string;
  }
> = {
  UIAgent: {
    name: 'UI 设计师',
    icon: <AppstoreOutlined />,
    description: '负责组件选择和布局设计',
    color: '#1890ff',
  },
  BackendAgent: {
    name: '后端工程师',
    icon: <CodeOutlined />,
    description: '负责 API 设计和业务逻辑',
    color: '#52c41a',
  },
  DatabaseAgent: {
    name: '数据库专家',
    icon: <DatabaseOutlined />,
    description: '负责数据模型设计',
    color: '#722ed1',
  },
  IntegrationAgent: {
    name: '集成专家',
    icon: <ApiOutlined />,
    description: '负责第三方集成',
    color: '#fa8c16',
  },
  DeploymentAgent: {
    name: '部署工程师',
    icon: <CloudServerOutlined />,
    description: '负责环境配置和部署',
    color: '#eb2f96',
  },
};

const STATUS_CONFIG: Record<
  AgentStatus,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    badge: 'success' | 'processing' | 'default' | 'error' | 'warning';
  }
> = {
  idle: {
    label: '空闲',
    icon: <ClockCircleOutlined />,
    color: '#d9d9d9',
    badge: 'default',
  },
  pending: {
    label: '等待中',
    icon: <ClockCircleOutlined />,
    color: '#faad14',
    badge: 'warning',
  },
  in_progress: {
    label: '工作中',
    icon: <LoadingOutlined spin />,
    color: '#1890ff',
    badge: 'processing',
  },
  completed: {
    label: '已完成',
    icon: <CheckCircleOutlined />,
    color: '#52c41a',
    badge: 'success',
  },
  failed: {
    label: '失败',
    icon: <CloseCircleOutlined />,
    color: '#ff4d4f',
    badge: 'error',
  },
  retrying: {
    label: '重试中',
    icon: <SyncOutlined spin />,
    color: '#fa8c16',
    badge: 'warning',
  },
};

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onClick,
  compact = false,
}) => {
  const config = AGENT_CONFIG[agent.type];
  const statusConfig = STATUS_CONFIG[agent.status];

  const isActive = agent.status === 'in_progress' || agent.status === 'retrying';
  const isCompleted = agent.status === 'completed';
  const isFailed = agent.status === 'failed';

  return (
    <Badge.Ribbon
      text={statusConfig.label}
      color={statusConfig.color}
      style={{ display: compact ? 'none' : 'block' }}
    >
      <Card
        hoverable
        onClick={() => onClick?.(agent)}
        style={{
          height: '100%',
          borderColor: isActive ? config.color : undefined,
          borderWidth: isActive ? 2 : 1,
          transition: 'all 0.3s ease',
        }}
        styles={{
          body: {
            padding: compact ? 12 : 16,
          },
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 头部 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: compact ? 40 : 48,
                height: compact ? 40 : 48,
                borderRadius: 8,
                background: `${config.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: compact ? 20 : 24,
                color: config.color,
              }}
            >
              {config.icon}
            </div>
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: compact ? 14 : 16, display: 'block' }}>
                {config.name}
              </Text>
              {!compact && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {config.description}
                </Text>
              )}
            </div>
          </div>

          {/* 状态标签 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge status={statusConfig.badge} />
            <Text style={{ fontSize: 13 }}>{statusConfig.label}</Text>
            {agent.retryCount > 0 && (
              <Tag color="warning" style={{ margin: 0 }}>
                重试 {agent.retryCount}
              </Tag>
            )}
          </div>

          {/* 当前任务 */}
          {agent.currentTask && !compact && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                当前任务
              </Text>
              <Tooltip title={agent.currentTask.description}>
                <Paragraph
                  ellipsis={{ rows: 2 }}
                  style={{ margin: '4px 0 0 0', fontSize: 13 }}
                >
                  {agent.currentTask.description}
                </Paragraph>
              </Tooltip>
            </div>
          )}

          {/* 当前操作 */}
          {agent.currentOperation && isActive && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                <LoadingOutlined spin style={{ marginRight: 4 }} />
                {agent.currentOperation}
              </Text>
            </div>
          )}

          {/* 错误信息 */}
          {agent.errorMessage && isFailed && (
            <div
              style={{
                background: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: 4,
                padding: 8,
              }}
            >
              <Text type="danger" style={{ fontSize: 12 }}>
                <CloseCircleOutlined style={{ marginRight: 4 }} />
                {agent.errorMessage}
              </Text>
            </div>
          )}

          {/* 进度条 */}
          {(isActive || agent.progressPercentage > 0) && !isCompleted && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  进度
                </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {agent.progressPercentage}%
                </Text>
              </div>
              <Progress
                percent={agent.progressPercentage}
                strokeColor={config.color}
                showInfo={false}
                status={isFailed ? 'exception' : 'active'}
              />
            </div>
          )}

          {/* 完成标记 */}
          {isCompleted && (
            <div
              style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 4,
                padding: 8,
                textAlign: 'center',
              }}
            >
              <Text style={{ color: '#52c41a', fontSize: 13 }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                任务已完成
              </Text>
            </div>
          )}

          {/* 任务统计 */}
          {!compact && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                paddingTop: 8,
                borderTop: '1px solid #f0f0f0',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                  待处理
                </Text>
                <Text strong style={{ fontSize: 16 }}>
                  {agent.taskQueue.length}
                </Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                  已完成
                </Text>
                <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                  {agent.completedTasks.length}
                </Text>
              </div>
            </div>
          )}
        </Space>
      </Card>
    </Badge.Ribbon>
  );
};

export default AgentCard;
