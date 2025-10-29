/**
 * Data Model Viewer
 *
 * Phase 2 Week 6 - ERD图可视化
 * 使用ReactFlow显示数据库实体关系图
 */

import React, { useCallback } from 'react';
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
import { Database } from 'lucide-react';

export interface DataModel {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    primaryKey?: boolean;
    foreignKey?: string;
    required?: boolean;
  }>;
}

export interface DataModelViewerProps {
  models: DataModel[];
  className?: string;
}

/**
 * 自定义表节点组件
 */
const TableNode: React.FC<{
  data: {
    name: string;
    fields: DataModel['fields'];
  };
}> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-lg overflow-hidden min-w-[250px]">
      {/* 表头 */}
      <div className="bg-blue-500 text-white px-4 py-2 flex items-center gap-2">
        <Database className="w-4 h-4" />
        <span className="font-bold">{data.name}</span>
      </div>

      {/* 字段列表 */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {data.fields.map((field, index) => (
          <div
            key={index}
            className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-2">
              {field.primaryKey && (
                <span className="text-yellow-500 font-bold text-xs">🔑</span>
              )}
              {field.foreignKey && (
                <span className="text-blue-500 font-bold text-xs">🔗</span>
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {field.name}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {field.type}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const nodeTypes = {
  table: TableNode,
};

/**
 * 从数据模型生成节点和边
 */
const generateNodesAndEdges = (models: DataModel[]) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 为每个模型创建节点
  models.forEach((model, index) => {
    nodes.push({
      id: model.name,
      type: 'table',
      position: {
        x: (index % 3) * 350,
        y: Math.floor(index / 3) * 300,
      },
      data: {
        name: model.name,
        fields: model.fields,
      },
    });

    // 查找外键关系
    model.fields.forEach((field) => {
      if (field.foreignKey) {
        edges.push({
          id: `${model.name}-${field.foreignKey}`,
          source: model.name,
          target: field.foreignKey,
          label: field.name,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#3B82F6' },
          animated: false,
        });
      }
    });
  });

  return { nodes, edges };
};

export const DataModelViewer: React.FC<DataModelViewerProps> = ({
  models,
  className = '',
}) => {
  const initialData = generateNodesAndEdges(models);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 标题 */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          数据模型 ERD 图
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          查看数据库表结构和关系
        </p>
      </div>

      {/* ERD图 */}
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

      {/* 统计和图例 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 统计 */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            统计信息
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">表数量:</span>
              <span className="ml-2 font-bold text-gray-900 dark:text-white">
                {models.length}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">关系数:</span>
              <span className="ml-2 font-bold text-gray-900 dark:text-white">
                {edges.length}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">总字段:</span>
              <span className="ml-2 font-bold text-gray-900 dark:text-white">
                {models.reduce((sum, m) => sum + m.fields.length, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            图例说明
          </h4>
          <div className="grid gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">🔑</span>
              <span className="text-gray-700 dark:text-gray-300">主键 (Primary Key)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">🔗</span>
              <span className="text-gray-700 dark:text-gray-300">外键 (Foreign Key)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-500">*</span>
              <span className="text-gray-700 dark:text-gray-300">必填字段</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataModelViewer;
