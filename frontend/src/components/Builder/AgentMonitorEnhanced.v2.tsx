/**
 * Enhanced Agent Monitor Component (Version 2)
 *
 * Phase 4 - User Story 2: Agent协作可视化
 * T043 增强版: 集成 AgentCard 和实时 WebSocket 更新
 */

import React, { useState } from 'react';
import { Card, Row, Col, Progress, Typography, Space, Statistic, Tag, Tabs, Modal } from 'antd';
import {
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { AgentCard } from './AgentCard';
import { AgentDependencyGraph } from './AgentDependencyGraph';
import { useAgent } from '../../hooks/useAgent';
import type { AgentType, AgentState } from '../../stores/agentStore';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export interface AgentMonitorEnhancedProps {
  projectId?: string;
  showDependencyGraph?: boolean;
  compact?: boolean;
}

export const AgentMonitorEnhanced: React.FC<AgentMonitorEnhancedProps> = ({
  projectId,
  showDependencyGraph = true,
  compact = false,
}) => {
  const {
    agents,
    dependencies,
    isBuilding,
    overallProgress,
    getActiveAgents,
    getCompletedAgents,
    getFailedAgents,
  } = useAgent({ projectId, autoConnect: true });

  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const agentTypes: AgentType[] = [
    'UIAgent',
    'BackendAgent',
    'DatabaseAgent',
    'IntegrationAgent',
    'DeploymentAgent',
  ];

  const handleAgentClick = (agent: AgentState) => {
    setSelectedAgent(agent);
    setModalVisible(true);
  };

  const activeAgents = getActiveAgents();
  const completedAgents = getCompletedAgents();
  const failedAgents = getFailedAgents();

  return (
    <div className="agent-monitor-enhanced">
      {/* 标题和总体统计 */}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space direction="vertical" size="small">
                <Title level={4} style={{ margin: 0 }}>
                  <RobotOutlined style={{ marginRight: 8 }} />
                  AI Agent 协作进度
                </Title>
                <Text type="secondary">实时监控 5 个专业 AI Agent 的工作状态</Text>
              </Space>
            </Col>
            {isBuilding && (
              <Col>
                <Tag color="processing" style={{ fontSize: 14, padding: '4px 12px' }}>
                  构建中
                </Tag>
              </Col>
            )}
          </Row>

          {/* 总体进度条 */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text strong>总体进度</Text>
              <Text strong style={{ fontSize: 16 }}>
                {overallProgress}%
              </Text>
            </div>
            <Progress
              percent={overallProgress}
              strokeColor={{
                '0%': '#1890ff',
                '100%': '#52c41a',
              }}
              status={isBuilding ? 'active' : undefined}
            />
          </div>

          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={8}>
              <Statistic
                title="工作中"
                value={activeAgents.length}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="已完成"
                value={completedAgents.length}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="失败"
                value={failedAgents.length}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
          </Row>
        </Card>

        {/* Tabs: Agent 卡片 vs 依赖图 */}
        <Card bodyStyle={{ padding: 0 }}>
          <Tabs defaultActiveKey="cards" style={{ padding: '0 24px' }}>
            <TabPane tab="Agent 状态" key="cards">
              <div style={{ padding: '16px 0' }}>
                <Row gutter={[16, 16]}>
                  {agentTypes.map((type) => {
                    const agent = agents[type];
                    return (
                      <Col xs={24} sm={12} lg={8} key={type}>
                        <AgentCard
                          agent={agent}
                          onClick={handleAgentClick}
                          compact={compact}
                        />
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </TabPane>

            {showDependencyGraph && (
              <TabPane tab="依赖关系图" key="graph">
                <div style={{ padding: '16px 0' }}>
                  <AgentDependencyGraph
                    agents={agents}
                    dependencies={dependencies}
                    height={500}
                  />
                </div>
              </TabPane>
            )}
          </Tabs>
        </Card>
      </Space>

      {/* Agent 详情 Modal */}
      <Modal
        title={`${selectedAgent?.type} 详情`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedAgent && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">当前状态</Text>
              <div style={{ marginTop: 8 }}>
                <Tag
                  color={
                    selectedAgent.status === 'completed'
                      ? 'success'
                      : selectedAgent.status === 'failed'
                      ? 'error'
                      : selectedAgent.status === 'in_progress'
                      ? 'processing'
                      : 'default'
                  }
                >
                  {selectedAgent.status === 'completed'
                    ? '已完成'
                    : selectedAgent.status === 'failed'
                    ? '失败'
                    : selectedAgent.status === 'in_progress'
                    ? '工作中'
                    : selectedAgent.status === 'pending'
                    ? '等待中'
                    : '空闲'}
                </Tag>
              </div>
            </div>

            {selectedAgent.currentTask && (
              <div>
                <Text type="secondary">当前任务</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{selectedAgent.currentTask.description}</Text>
                </div>
              </div>
            )}

            {selectedAgent.currentOperation && (
              <div>
                <Text type="secondary">��前操作</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{selectedAgent.currentOperation}</Text>
                </div>
              </div>
            )}

            <div>
              <Text type="secondary">进度</Text>
              <Progress percent={selectedAgent.progressPercentage} style={{ marginTop: 8 }} />
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="待处理任务" value={selectedAgent.taskQueue.length} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="已完成任务"
                  value={selectedAgent.completedTasks.length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>

            {selectedAgent.errorMessage && (
              <div
                style={{
                  background: '#fff2f0',
                  border: '1px solid #ffccc7',
                  borderRadius: 4,
                  padding: 12,
                }}
              >
                <Text type="danger">{selectedAgent.errorMessage}</Text>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default AgentMonitorEnhanced;
