/**
 * Agent Dependency Graph Component
 *
 * Phase 4 - User Story 2: Agent协作可视化
 * T047: Agent依赖关系图 - 使用 ReactFlow 可视化Agent依赖
 */

import React, { useMemo } from 'react';
import { Card, Typography, Empty } from 'antd';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  ConnectionLineType,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { AgentType, AgentDependency, AgentState } from '../../stores/agentStore';

const { Title } = Typography;

export interface AgentDependencyGraphProps {
  agents: Record<AgentType, AgentState>;
  dependencies: AgentDependency[];
  height?: number;
}

const AGENT_COLORS: Record<AgentType, string> = {
  UIAgent: '#1890ff',
  BackendAgent: '#52c41a',
  DatabaseAgent: '#722ed1',
  IntegrationAgent: '#fa8c16',
  DeploymentAgent: '#eb2f96',
};

const AGENT_LABELS: Record<AgentType, string> = {
  UIAgent: 'UI 设计师',
  BackendAgent: '后端工程师',
  DatabaseAgent: '数据库专家',
  IntegrationAgent: '集成专家',
  DeploymentAgent: '部署工程师',
};

export const AgentDependencyGraph: React.FC<AgentDependencyGraphProps> = ({
  agents,
  dependencies,
  height = 500,
}) => {
  const { nodes, edges } = useMemo(() => {
    const agentTypes: AgentType[] = [
      'UIAgent',
      'BackendAgent',
      'DatabaseAgent',
      'IntegrationAgent',
      'DeploymentAgent',
    ];

    // 创建节点
    const nodes: Node[] = agentTypes.map((type, index) => {
      const agent = agents[type];
      const color = AGENT_COLORS[type];

      let nodeStyle: any = {
        background: '#fff',
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: 16,
        width: 150,
      };

      // 根据状态调整样式
      if (agent.status === 'in_progress' || agent.status === 'retrying') {
        nodeStyle.background = `${color}15`;
        nodeStyle.borderWidth = 3;
        nodeStyle.boxShadow = `0 0 15px ${color}40`;
      } else if (agent.status === 'completed') {
        nodeStyle.background = '#f6ffed';
        nodeStyle.borderColor = '#52c41a';
      } else if (agent.status === 'failed') {
        nodeStyle.background = '#fff2f0';
        nodeStyle.borderColor = '#ff4d4f';
      }

      // 布局：环形排列
      const angle = (index / agentTypes.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 200;
      const x = Math.cos(angle) * radius + 300;
      const y = Math.sin(angle) * radius + 250;

      return {
        id: type,
        type: 'default',
        position: { x, y },
        data: {
          label: (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color }}>
                {AGENT_LABELS[type]}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#666',
                  textTransform: 'capitalize',
                }}
              >
                {agent.status === 'in_progress' ? '工作中' :
                 agent.status === 'completed' ? '已完成' :
                 agent.status === 'failed' ? '失败' :
                 agent.status === 'retrying' ? '重试中' :
                 agent.status === 'pending' ? '等待中' : '空闲'}
              </div>
              {(agent.status === 'in_progress' || agent.status === 'retrying') && (
                <div style={{ fontSize: 11, color, marginTop: 4 }}>
                  {agent.progressPercentage}%
                </div>
              )}
            </div>
          ),
        },
        style: nodeStyle,
      };
    });

    // 创建边
    const edges: Edge[] = dependencies.map((dep, index) => {
      const isRequired = dep.type === 'required';
      const fromAgent = agents[dep.from];
      const toAgent = agents[dep.to];

      let edgeStyle: any = {
        stroke: isRequired ? '#1890ff' : '#d9d9d9',
        strokeWidth: isRequired ? 2 : 1,
        strokeDasharray: isRequired ? '0' : '5,5',
      };

      // 如果源 Agent 正在工作，高亮边
      if (fromAgent.status === 'in_progress' || fromAgent.status === 'retrying') {
        edgeStyle.stroke = AGENT_COLORS[dep.from];
        edgeStyle.strokeWidth = 3;
      }

      return {
        id: `${dep.from}-${dep.to}-${index}`,
        source: dep.from,
        target: dep.to,
        type: ConnectionLineType.SmoothStep,
        animated: fromAgent.status === 'in_progress' || fromAgent.status === 'retrying',
        label: dep.description || (isRequired ? '必需' : '可选'),
        labelStyle: { fontSize: 10, fill: '#666' },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
        style: edgeStyle,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeStyle.stroke,
        },
      };
    });

    return { nodes, edges };
  }, [agents, dependencies]);

  if (nodes.length === 0) {
    return (
      <Card>
        <Empty description="暂无 Agent 依赖信息" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Title level={5} style={{ margin: 0 }}>
          Agent 协作依赖图
        </Title>
      }
    >
      <div style={{ height }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            style={{
              background: '#f5f5f5',
            }}
          />
        </ReactFlow>
      </div>

      {/* 图例 */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: '#fafafa',
          borderRadius: 4,
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 30,
              height: 2,
              background: '#1890ff',
            }}
          />
          <span>必需依赖</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 30,
              height: 2,
              background: '#d9d9d9',
              borderTop: '2px dashed #d9d9d9',
            }}
          />
          <span>可选依赖</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              border: '3px solid #1890ff',
              borderRadius: 4,
              boxShadow: '0 0 10px #1890ff40',
            }}
          />
          <span>工作中</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              border: '2px solid #52c41a',
              borderRadius: 4,
              background: '#f6ffed',
            }}
          />
          <span>已完成</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              border: '2px solid #ff4d4f',
              borderRadius: 4,
              background: '#fff2f0',
            }}
          />
          <span>失败</span>
        </div>
      </div>
    </Card>
  );
};

export default AgentDependencyGraph;
