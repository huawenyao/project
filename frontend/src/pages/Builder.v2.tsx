/**
 * Builder Page (Version 2)
 *
 * Phase 3-4: 集成自然语言输入和 Agent 协作可视化
 * 包含完整的构建工作流：
 * 1. 自然语言输入
 * 2. 需求摘要确认
 * 3. Agent 实时监控
 * 4. 对话式澄清
 */

import React, { useState, useCallback } from 'react';
import { Steps, Card, Button, Space, message, Alert } from 'antd';
import {
  EditOutlined,
  CheckOutlined,
  RobotOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { NaturalLanguageInput } from '../components/Builder/NaturalLanguageInput';
import { RequirementSummary } from '../components/Builder/RequirementSummary';
import { ChatInterface, ChatMessage } from '../components/Chat/ChatInterface';
import { AgentMonitorEnhanced } from '../components/Builder/AgentMonitorEnhanced.v2';
import { useProjectStore } from '../stores/projectStore';
import { useAgent } from '../hooks/useAgent';
import nlpService, { RequirementAnalysis } from '../services/nlpService';
import projectService from '../services/projectService';

type BuilderStep = 'input' | 'summary' | 'chat' | 'building';

export default function BuilderV2() {
  const [currentStep, setCurrentStep] = useState<BuilderStep>('input');
  const [requirementText, setRequirementText] = useState('');
  const [analysis, setAnalysis] = useState<RequirementAnalysis | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [needsClarification, setNeedsClarification] = useState(false);

  const projectStore = useProjectStore();
  const { startBuild, isBuilding } = useAgent({
    projectId: currentProjectId || undefined,
    autoConnect: true,
  });

  // 步骤索引映射
  const stepIndex = {
    input: 0,
    summary: 1,
    chat: 1,
    building: 2,
  };

  // 处理自然语言输入提交
  const handleRequirementSubmit = async (text: string) => {
    setIsLoading(true);
    setRequirementText(text);

    try {
      // 调用 NLP 服务解析需求
      const response = await nlpService.parseRequirement(text);

      if (response.success && response.data) {
        setAnalysis(response.data);

        // 检查是否需要澄清
        if (response.clarifications && response.clarifications.length > 0) {
          setNeedsClarification(true);
          setCurrentStep('chat');

          // 初始化对话
          const initialMessages: ChatMessage[] = [
            {
              id: '1',
              role: 'assistant',
              content: '我已经理解了你的基本需求，但还有几个问题需要澄清一下：',
              timestamp: new Date().toISOString(),
            },
            {
              id: '2',
              role: 'assistant',
              content: response.clarifications[0].question,
              timestamp: new Date().toISOString(),
              metadata: {
                type: 'clarification',
                options: response.clarifications[0].options,
              },
            },
          ];
          setChatMessages(initialMessages);
        } else {
          // 直接显示摘要
          setCurrentStep('summary');
        }
      } else {
        message.error(response.error || '需求解析失败');
      }
    } catch (error: any) {
      message.error(error.message || '解析失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理对话消息
  const handleChatMessage = async (text: string) => {
    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    try {
      // 这里应该调用后端 API 处理对话
      // 模拟 AI 回复
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '明白了！还有其他需要补充的吗？',
          timestamp: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error: any) {
      message.error('发送失败，请重试');
      setIsLoading(false);
    }
  };

  // 处理选项选择
  const handleOptionSelect = async (option: string) => {
    handleChatMessage(option);
  };

  // 完成对话，显示摘要
  const handleChatComplete = () => {
    setCurrentStep('summary');
    setNeedsClarification(false);
  };

  // 确认需求，开始构建
  const handleConfirmRequirements = async () => {
    if (!analysis) return;

    setIsLoading(true);

    try {
      // 创建项目
      const project = await projectService.createProject({
        name: analysis.appType,
        requirementText,
        description: analysis.features.join(', '),
      });

      setCurrentProjectId(project.id);
      projectStore.addProject(project);
      projectStore.setCurrentProject(project);

      // 开始构建
      startBuild(project.id, analysis);

      setCurrentStep('building');
      message.success('项目创建成功，开始构建！');
    } catch (error: any) {
      message.error(error.message || '创建项目失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 返回修改需求
  const handleEditRequirements = () => {
    setCurrentStep('input');
    setAnalysis(null);
    setChatMessages([]);
    setNeedsClarification(false);
  };

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <NaturalLanguageInput
            onSubmit={handleRequirementSubmit}
            isLoading={isLoading}
          />
        );

      case 'chat':
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="需求澄清"
              description="AI 需要了解更多细节来更好地理解你的需求"
              type="info"
              showIcon
            />
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleChatMessage}
              onSelectOption={handleOptionSelect}
              isLoading={isLoading}
            />
            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                onClick={handleChatComplete}
                disabled={isLoading}
              >
                完成澄清，查看摘要
              </Button>
            </div>
          </Space>
        );

      case 'summary':
        return analysis ? (
          <RequirementSummary
            analysis={analysis}
            onEdit={handleEditRequirements}
            onConfirm={handleConfirmRequirements}
            isConfirming={isLoading}
          />
        ) : null;

      case 'building':
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="构建进行中"
              description="AI Agents 正在协作构建您的应用，请耐心等待"
              type="success"
              showIcon
            />
            <AgentMonitorEnhanced
              projectId={currentProjectId || undefined}
              showDependencyGraph={true}
            />
          </Space>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <Card>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 32, marginBottom: 16 }}>
              <RobotOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              AI 应用构建器
            </h1>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 700, margin: '0 auto' }}>
              通过自然语言描述需求，AI Agents 自动协作构建完整应用
            </p>
          </div>
        </Card>

        {/* 步骤指示器 */}
        <Card>
          <Steps
            current={stepIndex[currentStep]}
            items={[
              {
                title: '描述需求',
                icon: <EditOutlined />,
              },
              {
                title: needsClarification ? '需求澄清' : '确认需求',
                icon: <CheckOutlined />,
              },
              {
                title: 'AI 构建',
                icon: <RobotOutlined />,
              },
            ]}
          />
        </Card>

        {/* 返回按钮 */}
        {currentStep !== 'input' && currentStep !== 'building' && (
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleEditRequirements}
          >
            返回修改需求
          </Button>
        )}

        {/* 步骤内容 */}
        <div>{renderStepContent()}</div>
      </Space>
    </div>
  );
}
