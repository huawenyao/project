/**
 * Builder 页面 - AI 驱动的应用构建器
 * 两列布局：中央 Agent 工作区 | 右侧决策时间线
 * 新建项目改为浮动按钮触发弹窗
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Button } from 'antd';
import { Plus } from 'lucide-react';
import NewProjectModal, { type BuildRequirements } from '../components/Builder/NewProjectModal';
import BuilderWorkspace from '../components/Builder/BuilderWorkspace';
import DecisionSidebarPanel from '../components/Builder/DecisionSidebarPanel';
import CollaborationPanel from '../components/Builder/CollaborationPanel';
import { useBuilderStore } from '../stores/builderStore';
import { useBuilderWebSocket } from '../hooks/useBuilderWebSocket.tsx';

export default function Builder() {
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();
  const { currentSessionId, setSessionId, setSessionStatus, reset } = useBuilderStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 使用 URL 中的 sessionId 或当前会话 ID
  const activeSessionId = urlSessionId || currentSessionId;

  // 初始化 WebSocket 连接
  useBuilderWebSocket(activeSessionId, {
    onAgentStatusUpdate: (status) => {
      console.log('[Builder] Agent status updated:', status);
    },
    onDecisionCreated: (decision) => {
      console.log('[Builder] Decision created:', decision);
    },
    onError: (error) => {
      console.error('[Builder] Agent error:', error);
    },
    onSessionComplete: () => {
      console.log('[Builder] Build session completed!');
    },
  });

  // 组件挂载时设置 sessionId
  useEffect(() => {
    if (urlSessionId && urlSessionId !== currentSessionId) {
      setSessionId(urlSessionId);
      // TODO: 加载会话数据
    }
  }, [urlSessionId, currentSessionId, setSessionId]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 如果没有活动会话，清理 store
      if (!activeSessionId) {
        reset();
      }
    };
  }, [activeSessionId, reset]);

  // 处理开始构建
  const handleStartBuild = async (requirements: BuildRequirements) => {
    try {
      console.log('[Builder] Starting build with requirements:', requirements);

      // TODO: 调用后端 API 创建构建会话
      // const response = await fetch('/api/builder/sessions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(requirements),
      // });
      // const { sessionId } = await response.json();

      // 临时：生成模拟 sessionId
      const mockSessionId = `session-${Date.now()}`;
      setSessionId(mockSessionId);
      setSessionStatus('building');

      // TODO: 移除模拟数据，使用真实 WebSocket 数据
      // 模拟添加 5 个 Agents
      const mockAgents = [
        {
          statusId: 'status-1',
          sessionId: mockSessionId,
          agentId: 'agent-ui',
          agentType: 'ui' as const,
          status: 'in_progress' as const,
          progressPercentage: 30,
          taskDescription: '正在设计 UI 组件...',
          personalityTone: 'friendly' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          statusId: 'status-2',
          sessionId: mockSessionId,
          agentId: 'agent-backend',
          agentType: 'backend' as const,
          status: 'pending' as const,
          progressPercentage: 0,
          taskDescription: '等待 UI Agent 完成...',
          personalityTone: 'professional' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          statusId: 'status-3',
          sessionId: mockSessionId,
          agentId: 'agent-database',
          agentType: 'database' as const,
          status: 'pending' as const,
          progressPercentage: 0,
          taskDescription: '等待后端 Agent 定义数据需求...',
          personalityTone: 'technical' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          statusId: 'status-4',
          sessionId: mockSessionId,
          agentId: 'agent-integration',
          agentType: 'integration' as const,
          status: 'pending' as const,
          progressPercentage: 0,
          taskDescription: '准备集成第三方服务...',
          personalityTone: 'friendly' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          statusId: 'status-5',
          sessionId: mockSessionId,
          agentId: 'agent-deployment',
          agentType: 'deployment' as const,
          status: 'pending' as const,
          progressPercentage: 0,
          taskDescription: '等待应用完成构建...',
          personalityTone: 'professional' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      useBuilderStore.getState().setAgents(mockAgents);
    } catch (error) {
      console.error('[Builder] Failed to start build:', error);
      setSessionStatus('failed');
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Toast 通知容器 */}
      <Toaster position="top-right" />

      {/* 新建项目弹窗 */}
      <NewProjectModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartBuild={handleStartBuild}
      />

      {/* 浮动的新建项目按钮 */}
      <Button
        type="primary"
        size="large"
        icon={<Plus className="w-5 h-5" />}
        onClick={() => setIsModalOpen(true)}
        className="fixed top-20 left-6 z-50 shadow-lg h-12 px-6 text-base font-semibold"
        style={{
          borderRadius: '24px',
        }}
      >
        新建项目
      </Button>

      {/* 主内容区 - 两列布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 中央工作区 - 75% */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <BuilderWorkspace />
        </div>

        {/* 右侧边栏 - 25% */}
        <div className="w-[25%] min-w-[300px] max-w-[400px] flex-shrink-0">
          <DecisionSidebarPanel />
        </div>
      </div>

      {/* 底部可折叠区 - Agent 协作关系图 */}
      <CollaborationPanel sessionId={activeSessionId} />
    </div>
  );
}