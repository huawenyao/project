/**
 * Deployment Panel
 *
 * Phase 7 - User Story 5: 一键部署
 * T082-T084: 部署面板、环境配置、实时日志
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Modal,
  Table,
  Tag,
  Space,
  Tabs,
  Alert,
  Spin,
} from 'antd';
import {
  RocketOutlined,
  SettingOutlined,
  HistoryOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { DeploymentProgress, DeploymentStageInfo, DeploymentStage } from './DeploymentProgress';

const { TabPane } = Tabs;
const { Option } = Select;

export interface DeploymentPanelProps {
  projectId: string;
  projectName: string;
  className?: string;
}

interface DeploymentConfig {
  environment: 'test' | 'staging' | 'production';
  resources: {
    memory: string;
    cpu: string;
    instances: number;
  };
  env: Record<string, string>;
  domain?: string;
}

interface DeploymentRecord {
  id: string;
  environment: string;
  status: string;
  createdAt: string;
  deployedAt?: string;
  accessUrl?: string;
  errorMessage?: string;
}

export const DeploymentPanel: React.FC<DeploymentPanelProps> = ({
  projectId,
  projectName,
  className = '',
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [currentDeployment, setCurrentDeployment] = useState<any>(null);
  const [deploymentStages, setDeploymentStages] = useState<DeploymentStageInfo[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 自动滚动日志到底部
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 加载部署历史
  const loadDeployments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/deployments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setDeployments(data.data.deployments || []);
      } else {
        message.error('加载部署历史失败');
      }
    } catch (error) {
      console.error('Load deployments error:', error);
      message.error('加载部署历史失败');
    } finally {
      setLoading(false);
    }
  };

  // 开始部署
  const startDeployment = async (config: DeploymentConfig) => {
    setDeploying(true);
    setLogs([]);
    setDeploymentStages(initializeStages());

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();
      if (data.success) {
        message.success('部署已启动');
        setCurrentDeployment({
          id: data.data.deploymentId,
          environment: config.environment,
        });

        // 开始轮询部署状态
        startPollingDeploymentStatus(data.data.deploymentId);
      } else {
        message.error('启动部署失败: ' + data.error);
        setDeploying(false);
      }
    } catch (error) {
      console.error('Start deployment error:', error);
      message.error('启动部署失败');
      setDeploying(false);
    }
  };

  // 初始化部署阶段
  const initializeStages = (): DeploymentStageInfo[] => {
    const stages: DeploymentStage[] = [
      'building',
      'uploading',
      'configuring',
      'starting',
      'health_check',
    ];

    return stages.map((stage) => ({
      stage,
      status: 'pending',
    }));
  };

  // 轮询部署状态
  const startPollingDeploymentStatus = (deploymentId: string) => {
    // 清除之前的轮询
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // 立即检查一次
    pollDeploymentStatus(deploymentId);

    // 每2秒检查一次
    pollingIntervalRef.current = setInterval(() => {
      pollDeploymentStatus(deploymentId);
    }, 2000);
  };

  // 检查部署状态
  const pollDeploymentStatus = async (deploymentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/deployments/${deploymentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const deployment = data.data;
        updateDeploymentProgress(deployment);

        // 如果部署完成或失败，停止轮询
        if (deployment.status === 'success' || deployment.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setDeploying(false);

          if (deployment.status === 'success') {
            message.success('部署成功！');
          } else {
            message.error('部署失败: ' + deployment.errorMessage);
          }

          // 刷新部署历史
          await loadDeployments();
        }
      }
    } catch (error) {
      console.error('Poll deployment status error:', error);
    }
  };

  // 更新部署进度
  const updateDeploymentProgress = (deployment: any) => {
    // 根据部署状态更新阶段信息
    const newStages: DeploymentStageInfo[] = [...deploymentStages];

    // 模拟阶段进度（实际应从后端获取）
    if (deployment.status === 'building') {
      newStages[0].status = 'in_progress';
      newStages[0].progress = 50;
      newStages[0].message = '正在构建 Docker 镜像...';
      addLog('[构建] 正在构建 Docker 镜像...');
    } else if (deployment.status === 'deploying') {
      newStages[0].status = 'completed';
      newStages[1].status = 'completed';
      newStages[2].status = 'completed';
      newStages[3].status = 'in_progress';
      newStages[3].progress = 80;
      newStages[3].message = '正在启动应用...';
      addLog('[启动] 正在启动应用...');
    } else if (deployment.status === 'success') {
      newStages.forEach((stage) => {
        stage.status = 'completed';
      });
      addLog('[完成] 部署成功！');
      if (deployment.accessUrl) {
        addLog(`[访问] 应用地址: ${deployment.accessUrl}`);
      }
    } else if (deployment.status === 'failed') {
      const currentStageIndex = newStages.findIndex((s) => s.status === 'in_progress');
      if (currentStageIndex >= 0) {
        newStages[currentStageIndex].status = 'failed';
        newStages[currentStageIndex].error = deployment.errorMessage || '部署失败';
      }
      addLog(`[错误] ${deployment.errorMessage || '部署失败'}`);
    }

    setDeploymentStages(newStages);
  };

  // 添加日志
  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    setLogs((prev) => [...prev, `[${timestamp}] ${log}`]);
  };

  // 停止轮询
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // 初始加载
  useEffect(() => {
    if (projectId) {
      loadDeployments();
    }
  }, [projectId]);

  // 处理表单提交
  const handleDeploy = () => {
    form.validateFields().then((values) => {
      const config: DeploymentConfig = {
        environment: values.environment,
        resources: {
          memory: values.memory || '512MB',
          cpu: values.cpu || '0.5',
          instances: values.instances || 1,
        },
        env: values.env || {},
        domain: values.domain,
      };

      startDeployment(config);
      setConfigModalVisible(false);
    });
  };

  // 部署历史表格列定义
  const columns = [
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      render: (env: string) => {
        const colors: Record<string, string> = {
          test: 'blue',
          staging: 'orange',
          production: 'red',
        };
        return <Tag color={colors[env] || 'default'}>{env}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          pending: { color: 'default', icon: <SyncOutlined spin />, text: '等待中' },
          building: { color: 'processing', icon: <SyncOutlined spin />, text: '构建中' },
          deploying: { color: 'processing', icon: <SyncOutlined spin />, text: '部署中' },
          success: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
          failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
        };
        const config = statusMap[status] || statusMap.pending;
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '访问地址',
      dataIndex: 'accessUrl',
      key: 'accessUrl',
      render: (url: string) =>
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <LinkOutlined /> 访问
          </a>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div className={`deployment-panel ${className}`}>
      <Card
        title={
          <div className="flex items-center gap-2">
            <RocketOutlined className="text-blue-500" />
            <span>项目部署</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<RocketOutlined />}
            onClick={() => {
              form.resetFields();
              setConfigModalVisible(true);
            }}
            disabled={deploying}
          >
            一键部署
          </Button>
        }
      >
        <Tabs defaultActiveKey="progress">
          <TabPane tab="部署进度" key="progress">
            {deploying || currentDeployment ? (
              <div className="space-y-4">
                <DeploymentProgress
                  deploymentId={currentDeployment?.id || 'unknown'}
                  stages={deploymentStages}
                  currentStage={
                    deploymentStages.find((s) => s.status === 'in_progress')?.stage
                  }
                  onRetry={() => {
                    message.info('重试部署功能即将推出');
                  }}
                  onCancel={() => {
                    Modal.confirm({
                      title: '确认取消',
                      content: '确定要取消当前部署吗？',
                      onOk: () => {
                        setDeploying(false);
                        if (pollingIntervalRef.current) {
                          clearInterval(pollingIntervalRef.current);
                          pollingIntervalRef.current = null;
                        }
                        message.success('已取消部署');
                      },
                    });
                  }}
                />
              </div>
            ) : (
              <Alert
                message="暂无正在进行的部署"
                description="点击"一键部署"按钮开始部署您的项目"
                type="info"
                showIcon
                action={
                  <Button
                    type="primary"
                    icon={<RocketOutlined />}
                    onClick={() => {
                      form.resetFields();
                      setConfigModalVisible(true);
                    }}
                  >
                    开始部署
                  </Button>
                }
              />
            )}
          </TabPane>

          <TabPane tab="实时日志" key="logs">
            <Card size="small" title={<CodeOutlined />} bodyStyle={{ padding: 0 }}>
              <div
                className="bg-gray-900 text-green-400 font-mono text-sm p-4 h-96 overflow-y-auto"
                style={{ fontFamily: 'Consolas, Monaco, monospace' }}
              >
                {logs.length > 0 ? (
                  <>
                    {logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {log}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </>
                ) : (
                  <div className="text-gray-500">暂无日志输出...</div>
                )}
              </div>
            </Card>
          </TabPane>

          <TabPane tab="部署历史" key="history">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={deployments}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 部署配置模态框 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <SettingOutlined />
            <span>部署配置</span>
          </div>
        }
        open={configModalVisible}
        onOk={handleDeploy}
        onCancel={() => setConfigModalVisible(false)}
        okText="开始部署"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" initialValues={{ environment: 'test', instances: 1 }}>
          <Form.Item
            name="environment"
            label="部署环境"
            rules={[{ required: true, message: '请选择部署环境' }]}
          >
            <Select>
              <Option value="test">测试环境</Option>
              <Option value="staging">预发布环境</Option>
              <Option value="production">生产环境</Option>
            </Select>
          </Form.Item>

          <Form.Item label="资源配置">
            <Space>
              <Form.Item name="memory" noStyle>
                <Select style={{ width: 120 }} placeholder="内存">
                  <Option value="256MB">256MB</Option>
                  <Option value="512MB">512MB</Option>
                  <Option value="1GB">1GB</Option>
                  <Option value="2GB">2GB</Option>
                </Select>
              </Form.Item>
              <Form.Item name="cpu" noStyle>
                <Select style={{ width: 120 }} placeholder="CPU">
                  <Option value="0.25">0.25核</Option>
                  <Option value="0.5">0.5核</Option>
                  <Option value="1">1核</Option>
                  <Option value="2">2核</Option>
                </Select>
              </Form.Item>
              <Form.Item name="instances" noStyle>
                <InputNumber min={1} max={10} placeholder="实例数" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item name="domain" label="自定义域名（可选）">
            <Input placeholder="例如: myapp.example.com" />
          </Form.Item>

          <Alert
            message="部署说明"
            description="部署过程包括构建、上传、配置、启动和健康检查5个阶段，通常需要3-5分钟"
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  );
};

export default DeploymentPanel;
