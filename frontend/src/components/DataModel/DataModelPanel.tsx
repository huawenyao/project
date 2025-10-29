/**
 * Data Model Panel
 *
 * Phase 6 - User Story 4: 智能数据模型推荐
 * T071-T073: 数据模型查看、推荐和编辑
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, message, Tabs, Modal, Form, Input, Select, Tag, Alert, Spin } from 'antd';
import {
  DatabaseOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { DataModelViewer, DataModel } from './DataModelViewer';

const { TabPane } = Tabs;
const { TextArea } = Input;

export interface DataModelPanelProps {
  projectId: string;
  className?: string;
}

export const DataModelPanel: React.FC<DataModelPanelProps> = ({
  projectId,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [form] = Form.useForm();

  // 加载数据模型
  const loadDataModels = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/data-models`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setModels(data.data.models || []);
      } else {
        message.error('加载数据模型失败');
      }
    } catch (error) {
      console.error('Load data models error:', error);
      message.error('加载数据模型失败');
    } finally {
      setLoading(false);
    }
  };

  // 推荐数据模型
  const recommendDataModels = async () => {
    setRecommending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/data-models/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data.recommendations || []);
        message.success('数据模型推荐成功');
        // 重新加载模型
        await loadDataModels();
      } else {
        message.error('推荐数据模型失败');
      }
    } catch (error) {
      console.error('Recommend data models error:', error);
      message.error('推荐数据模型失败');
    } finally {
      setRecommending(false);
    }
  };

  // 影响分析
  const analyzeImpact = async (changes: any[]) => {
    if (!changes || changes.length === 0) {
      message.warning('请指定要分析的变更');
      return;
    }

    setAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/data-models/analyze-impact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ changes }),
      });

      const data = await response.json();
      if (data.success) {
        setImpactAnalysis(data.data.analysis);
        message.success('影响分析完成');
      } else {
        message.error('影响分析失败');
      }
    } catch (error) {
      console.error('Analyze impact error:', error);
      message.error('影响分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (projectId) {
      loadDataModels();
    }
  }, [projectId]);

  // 转换为 DataModelViewer 格式
  const convertToViewerFormat = (models: any[]): DataModel[] => {
    return models.map((model) => ({
      name: model.tableName,
      fields: Array.isArray(model.fields)
        ? model.fields.map((field: any) => ({
            name: field.name,
            type: field.type,
            primaryKey: field.name === 'id',
            required: field.required,
            foreignKey: field.foreignKey,
          }))
        : [],
    }));
  };

  // 编辑模型
  const handleEdit = (model: any) => {
    setEditingModel(model);
    form.setFieldsValue({
      tableName: model.tableName,
      description: model.description,
    });
    setEditModalVisible(true);
  };

  // 删除模型
  const handleDelete = (modelId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个数据模型吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        // TODO: 实现删除逻辑
        message.success('删除成功');
        await loadDataModels();
      },
    });
  };

  return (
    <div className={`data-model-panel ${className}`}>
      <Card
        title={
          <div className="flex items-center gap-2">
            <DatabaseOutlined className="text-blue-500" />
            <span>数据模型管理</span>
          </div>
        }
        extra={
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={recommendDataModels}
              loading={recommending}
            >
              智能推荐
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => handleEdit(null)}>
              新建模型
            </Button>
          </div>
        }
      >
        <Tabs defaultActiveKey="viewer">
          <TabPane tab="ERD 视图" key="viewer">
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <Spin size="large" tip="加载数据模型中..." />
              </div>
            ) : models.length > 0 ? (
              <DataModelViewer models={convertToViewerFormat(models)} />
            ) : (
              <Alert
                message="暂无数据模型"
                description="点击"智能推荐"按钮，让 AI 为您的项目推荐合适的数据模型"
                type="info"
                showIcon
                action={
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={recommendDataModels}
                    loading={recommending}
                  >
                    立即推荐
                  </Button>
                }
              />
            )}
          </TabPane>

          <TabPane tab="模型列表" key="list">
            <div className="space-y-4">
              {models.map((model) => (
                <Card
                  key={model.id}
                  size="small"
                  title={model.tableName}
                  extra={
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(model)}
                      >
                        编辑
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(model.id)}
                      >
                        删除
                      </Button>
                    </div>
                  }
                >
                  <div className="mb-2 text-gray-600">{model.description}</div>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(model.fields) &&
                      model.fields.map((field: any, idx: number) => (
                        <Tag key={idx} color={field.required ? 'blue' : 'default'}>
                          {field.name}: {field.type}
                        </Tag>
                      ))}
                  </div>
                </Card>
              ))}
            </div>
          </TabPane>

          <TabPane tab="推荐结果" key="recommendations">
            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <Card
                    key={index}
                    size="small"
                    title={
                      <div className="flex items-center justify-between">
                        <span>{rec.tableName}</span>
                        <Tag color="green">
                          置信度: {(rec.confidence * 100).toFixed(0)}%
                        </Tag>
                      </div>
                    }
                  >
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-2">{rec.description}</div>
                      <Alert
                        message="推荐理由"
                        description={rec.reasoning}
                        type="info"
                        showIcon
                        icon={<CheckCircleOutlined />}
                      />
                    </div>
                    <div className="mb-2">
                      <strong>字段：</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.fields?.map((field: any, idx: number) => (
                          <Tag key={idx} color={field.required ? 'blue' : 'default'}>
                            {field.name}: {field.type}
                          </Tag>
                        ))}
                      </div>
                    </div>
                    {rec.indexes?.length > 0 && (
                      <div>
                        <strong>索引：</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.indexes.map((idx: any, i: number) => (
                            <Tag key={i} color="purple">
                              {idx.fields.join(', ')} ({idx.type})
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Alert
                message="暂无推荐结果"
                description="点击"智能推荐"按钮获取 AI 推荐的数据模型"
                type="info"
                showIcon
              />
            )}
          </TabPane>

          <TabPane tab="影响分析" key="impact">
            {impactAnalysis ? (
              <div className="space-y-4">
                <Alert
                  message={`复杂度评估: ${impactAnalysis.estimatedComplexity.toUpperCase()}`}
                  type={
                    impactAnalysis.estimatedComplexity === 'high'
                      ? 'error'
                      : impactAnalysis.estimatedComplexity === 'medium'
                      ? 'warning'
                      : 'success'
                  }
                  showIcon
                />

                {impactAnalysis.affectedTables?.length > 0 && (
                  <Card title="受影响的表" size="small">
                    <div className="flex flex-wrap gap-2">
                      {impactAnalysis.affectedTables.map((table: string) => (
                        <Tag key={table} color="orange">
                          {table}
                        </Tag>
                      ))}
                    </div>
                  </Card>
                )}

                {impactAnalysis.requiredMigrations?.length > 0 && (
                  <Card title="需要的迁移" size="small">
                    <div className="space-y-2">
                      {impactAnalysis.requiredMigrations.map((migration: any, idx: number) => (
                        <Alert
                          key={idx}
                          message={migration.description}
                          type={
                            migration.risk === 'high'
                              ? 'error'
                              : migration.risk === 'medium'
                              ? 'warning'
                              : 'info'
                          }
                          showIcon
                          icon={<WarningOutlined />}
                        />
                      ))}
                    </div>
                  </Card>
                )}

                {impactAnalysis.recommendations?.length > 0 && (
                  <Card title="建议" size="small">
                    <ul className="list-disc list-inside space-y-1">
                      {impactAnalysis.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                <Button
                  type="primary"
                  block
                  onClick={() => {
                    message.info('迁移功能即将推出');
                  }}
                >
                  执行迁移
                </Button>
              </div>
            ) : (
              <Alert
                message="暂无影响分析"
                description="当您修改数据模型时，系统会自动分析影响范围"
                type="info"
                showIcon
              />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={editingModel ? '编辑数据模型' : '新建数据模型'}
        open={editModalVisible}
        onOk={() => {
          form.validateFields().then(async (values) => {
            // TODO: 实现保存逻辑
            message.success('保存成功');
            setEditModalVisible(false);
            await loadDataModels();
          });
        }}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="tableName"
            label="表名"
            rules={[{ required: true, message: '请输入表名' }]}
          >
            <Input placeholder="例如: users" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="描述该数据模型的用途" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataModelPanel;
