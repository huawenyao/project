/**
 * Agent Dependency Graph
 *
 * Phase 2 Week 5 - Agent依赖关系图
 * 使用ReactFlow显示Agent间的依赖和数据流
 */

import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAgentStatusStore } from '../../stores/agentStatusStore';

export interface AgentDependencyGraphProps {
  sessionId?: string;
  className?: string;
}

// Agent类型配置
const AGENT_CONFIG = {
  UIAgent: {
    name: 'UI设计师',
    icon: '🎨',
    color: '#3B82F6',
  },
  BackendAgent: {
    name: '后端工程师',
    icon: '⚙️',
    color: '#10B981',
  },
  DatabaseAgent: {
    name: '数据库专家',
    icon: '🗄️',
    color: '#8B5CF6',
  },
  IntegrationAgent: {
    name: '集成专家',
    icon: '🔗',
    color: '#F59E0B',
  },
  DeploymentAgent: {
    name: '部署工程师',
    icon: '🚀',
    color: '#EF4444',
  },
};

/**
 * 自定义Agent节点组件
 */
const AgentNode: React.FC<{
  data: {
    label: string;
    icon: string;
    status: string;
    progress: number;
    color: string;
  };
}> = ({ data }) => {
  return (
    <div
      className="px-6 py-4 rounded-xl shadow-lg border-2 bg-white dark:bg-gray-800"
      style={{ borderColor: data.color }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="text-4xl">{data.icon}</div>
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          {data.label}
        </div>
        <div
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{
            backgroundColor: `${data.color}20`,
            color: data.color,
          }}
        >
          {data.status === 'in_progress' && '工作中'}
          {data.status === 'completed' && '已完成'}
          {data.status === 'pending' && '等待中'}
          {data.status === 'idle' && '空闲'}
          {data.status === 'failed' && '失败'}
        </div>
        {data.status === 'in_progress' && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${data.progress}%`,
                backgroundColor: data.color,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  agent: AgentNode,
};

/**
 * 生成初始节点和边
 */
const generateInitialNodesAndEdges = (statuses: any) => {
  const nodes: Node[] = [
    {
      id: 'UIAgent',
      type: 'agent',
      position: { x: 250, y: 50 },
      data: {
        label: AGENT_CONFIG.UIAgent.name,
        icon: AGENT_CONFIG.UIAgent.icon,
        status: statuses.UIAgent?.status || 'idle',
        progress: statuses.UIAgent?.progressPercentage || 0,
        color: AGENT_CONFIG.UIAgent.color,
      },
    },
    {
      id: 'BackendAgent',
      type: 'agent',
      position: { x: 50, y: 200 },
      data: {
        label: AGENT_CONFIG.BackendAgent.name,
        icon: AGENT_CONFIG.BackendAgent.icon,
        status: statuses.BackendAgent?.status || 'idle',
        progress: statuses.BackendAgent?.progressPercentage || 0,
        color: AGENT_CONFIG.BackendAgent.color,
      },
    },
    {
      id: 'DatabaseAgent',
      type: 'agent',
      position: { x: 450, y: 200 },
      data: {
        label: AGENT_CONFIG.DatabaseAgent.name,
        icon: AGENT_CONFIG.DatabaseAgent.icon,
        status: statuses.DatabaseAgent?.status || 'idle',
        progress: statuses.DatabaseAgent?.progressPercentage || 0,
        color: AGENT_CONFIG.DatabaseAgent.color,
      },
    },
    {
      id: 'IntegrationAgent',
      type: 'agent',
      position: { x: 150, y: 350 },
      data: {
        label: AGENT_CONFIG.IntegrationAgent.name,
        icon: AGENT_CONFIG.IntegrationAgent.icon,
        status: statuses.IntegrationAgent?.status || 'idle',
        progress: statuses.IntegrationAgent?.progressPercentage || 0,
        color: AGENT_CONFIG.IntegrationAgent.color,
      },
    },
    {
      id: 'DeploymentAgent',
      type: 'agent',
      position: { x: 250, y: 500 },
      data: {
        label: AGENT_CONFIG.DeploymentAgent.name,
        icon: AGENT_CONFIG.DeploymentAgent.icon,
        status: statuses.DeploymentAgent?.status || 'idle',
        progress: statuses.DeploymentAgent?.progressPercentage || 0,
        color: AGENT_CONFIG.DeploymentAgent.color,
      },
    },
  ];

  const edges: Edge[] = [
    {
      id: 'e1',
      source: 'UIAgent',
      target: 'BackendAgent',
      label: '组件规格',
      animated: statuses.BackendAgent?.status === 'in_progress',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#3B82F6' },
    },
    {
      id: 'e2',
      source: 'UIAgent',
      target: 'DatabaseAgent',
      label: '数据需求',
      animated: statuses.DatabaseAgent?.status === 'in_progress',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#8B5CF6' },
    },
    {
      id: 'e3',
      source: 'BackendAgent',
      target: 'IntegrationAgent',
      label: 'API定义',
      animated: statuses.IntegrationAgent?.status === 'in_progress',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#10B981' },
    },
    {
      id: 'e4',
      source: 'DatabaseAgent',
      target: 'BackendAgent',
      label: 'Schema',
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#8B5CF6', strokeDasharray: '5,5' },
    },
    {
      id: 'e5',
      source: 'IntegrationAgent',
      target: 'DeploymentAgent',
      label: '集成配置',
      animated: statuses.DeploymentAgent?.status === 'in_progress',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#F59E0B' },
    },
    {
      id: 'e6',
      source: 'BackendAgent',
      target: 'DeploymentAgent',
      label: '应用代码',
      animated: statuses.DeploymentAgent?.status === 'in_progress',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#10B981' },
    },
  ];

  return { nodes, edges };
};

export const AgentDependencyGraph: React.FC<AgentDependencyGraphProps> = ({
  sessionId,
  className = '',
}) => {
  const { statuses } = useAgentStatusStore();

  // 从statuses创建状态映射
  const statusMap = Object.values(statuses).reduce((acc, status) => {
    acc[status.agentType] = status;
    return acc;
  }, {} as any);

  const initialData = generateInitialNodesAndEdges(statusMap);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // 当agent状态变化时更新节点
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const agentStatus = statusMap[node.id];
        if (agentStatus) {
          return {
            ...node,
            data: {
              ...node.data,
              status: agentStatus.status,
              progress: agentStatus.progressPercentage,
            },
          };
        }
        return node;
      })
    );

    // 更新边的动画状态
    setEdges((eds) =>
      eds.map((edge) => {
        const targetStatus = statusMap[edge.target];
        return {
          ...edge,
          animated: targetStatus?.status === 'in_progress',
        };
      })
    );
  }, [statuses, statusMap, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Agent协作依赖图
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          实时显示Agent间的数据流和依赖关系
        </p>
      </div>

      <div className="h-[600px] bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* 图例 */}
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          图例说明
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">工作中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-700 dark:text-gray-300">已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">空闲</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">数据流</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-purple-500" />
            <span className="text-gray-700 dark:text-gray-300">反馈</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-4 h-0.5 bg-blue-500 animate-pulse" />
              <div className="w-0 h-0 border-t-2 border-t-transparent border-b-2 border-b-transparent border-l-4 border-l-blue-500" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">活跃</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDependencyGraph;
