/**
 * Builder WebSocket Hook
 * 处理构建会话的 WebSocket 实时通信
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBuilderStore } from '../stores/builderStore';
import WebSocketService from '../services/WebSocketService';
import type {
  AgentWorkStatus,
  DecisionRecord,
  AgentErrorRecord,
} from '../types/visualization';
import { toast } from 'react-hot-toast';

interface WebSocketEventHandlers {
  onAgentStatusUpdate?: (status: AgentWorkStatus) => void;
  onDecisionCreated?: (decision: DecisionRecord) => void;
  onError?: (error: AgentErrorRecord) => void;
  onSessionComplete?: () => void;
}

export const useBuilderWebSocket = (
  sessionId: string | null,
  handlers?: WebSocketEventHandlers
) => {
  const queryClient = useQueryClient();
  const builderStore = useBuilderStore();
  const handlersRef = useRef(handlers);

  // 更新 handlers ref
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    console.log('[useBuilderWebSocket] Subscribing to session:', sessionId);

    // 订阅会话
    WebSocketService.emit('subscribe-session', { sessionId });

    // 监听 Agent 状态更新
    const unsubAgent = WebSocketService.on('agent-status-update', (data: AgentWorkStatus) => {
      console.log('[WebSocket] Agent status update:', data);

      // 更新 Zustand store
      builderStore.updateAgentStatus(data);

      // 更新 React Query 缓存
      queryClient.setQueryData(['agent-statuses', sessionId], (old: AgentWorkStatus[] = []) => {
        const existingIndex = old.findIndex((a) => a.agentId === data.agentId);
        if (existingIndex >= 0) {
          const newData = [...old];
          newData[existingIndex] = data;
          return newData;
        }
        return [...old, data];
      });

      // 调用自定义 handler
      handlersRef.current?.onAgentStatusUpdate?.(data);
    });

    // 监听决策创建
    const unsubDecision = WebSocketService.on('decision-created', (data: DecisionRecord) => {
      console.log('[WebSocket] Decision created:', data);

      // 添加到 store
      builderStore.addDecision(data);

      // 如果是高重要性决策，显示 Toast 通知
      if (data.impact === 'high') {
        toast.success(
          <div>
            <div className="font-semibold">{data.title}</div>
            <div className="text-sm text-gray-600">{data.description}</div>
          </div>,
          {
            duration: 5000,
            icon: '🔔',
          }
        );
      }

      // 调用自定义 handler
      handlersRef.current?.onDecisionCreated?.(data);
    });

    // 监听错误
    const unsubError = WebSocketService.on('agent-error', (data: AgentErrorRecord) => {
      console.log('[WebSocket] Agent error:', data);

      // 添加到 store
      builderStore.addError(data);

      // 根据严重程度显示通知
      if (data.severity === 'critical') {
        toast.error(
          <div>
            <div className="font-semibold">Critical Error</div>
            <div className="text-sm">{data.message}</div>
          </div>,
          {
            duration: 10000,
          }
        );
      } else if (data.severity === 'error') {
        toast.error(data.message, { duration: 5000 });
      } else if (data.severity === 'warning') {
        toast(data.message, { icon: '⚠️', duration: 3000 });
      }

      // 调用自定义 handler
      handlersRef.current?.onError?.(data);
    });

    // 监听会话完成
    const unsubComplete = WebSocketService.on('session-complete', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        console.log('[WebSocket] Session complete:', sessionId);

        builderStore.setSessionStatus('completed');

        toast.success('构建完成！🎉', {
          duration: 5000,
        });

        // 调用自定义 handler
        handlersRef.current?.onSessionComplete?.();
      }
    });

    // 监听会话失败
    const unsubFailed = WebSocketService.on('session-failed', (data: { sessionId: string; reason: string }) => {
      if (data.sessionId === sessionId) {
        console.log('[WebSocket] Session failed:', data.reason);

        builderStore.setSessionStatus('failed');

        toast.error(`构建失败: ${data.reason}`, {
          duration: 10000,
        });
      }
    });

    // 清理函数
    return () => {
      console.log('[useBuilderWebSocket] Unsubscribing from session:', sessionId);
      unsubAgent();
      unsubDecision();
      unsubError();
      unsubComplete();
      unsubFailed();
      WebSocketService.emit('unsubscribe-session', { sessionId });
    };
  }, [sessionId, builderStore, queryClient]);

  return {
    isConnected: WebSocketService.isConnected(),
  };
};
