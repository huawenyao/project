/**
 * useVisualization Hook
 *
 * 主可视化数据管理 Hook - 整合 WebSocket 和 API 调用
 */

import { useEffect, useCallback } from 'react';
import { useVisualizationStore } from '../stores/visualizationStore';
import { useWebSocket } from './useWebSocket';
import VisualizationAPI from '../services/VisualizationAPI';
import type { BuildSession } from '../types/visualization.types';

export function useVisualization(sessionId?: string) {
  const store = useVisualizationStore();
  const ws = useWebSocket();

  // 加载会话数据
  const loadSession = useCallback(async (id: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const session = await VisualizationAPI.getSession(id);
      store.setCurrentSession(session);

      // 加载快照数据
      const snapshot = await VisualizationAPI.getSessionSnapshot(id);

      // 更新 stores
      snapshot.agentStatuses?.forEach((status: any) => {
        store.setAgentStatus(status);
      });

      snapshot.recentDecisions?.forEach((decision: any) => {
        store.addDecision(decision);
      });

      snapshot.unresolvedErrors?.forEach((error: any) => {
        store.addError(error);
      });

      snapshot.recentCollaborations?.forEach((collab: any) => {
        store.addCollaboration(collab);
      });

      // 加入 WebSocket 房间
      ws.joinSession(id);
    } catch (error: any) {
      store.setError(error.message);
    } finally {
      store.setLoading(false);
    }
  }, [store, ws]);

  // 订阅实时更新
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribers = [
      // Agent 状态更新
      ws.subscribe('visualization:agent-status-update', (event: any) => {
        store.setAgentStatus(event.data);
      }),

      // 决策事件
      ws.subscribe('visualization:decision-made', (event: any) => {
        store.addDecision(event.data);
      }),

      // 错误事件
      ws.subscribe('visualization:error-occurred', (event: any) => {
        store.addError(event.data);
      }),

      // 协作事件
      ws.subscribe('visualization:collaboration-event', (event: any) => {
        store.addCollaboration(event.data);
      }),

      // 预览生成
      ws.subscribe('visualization:preview-generated', (event: any) => {
        store.setPreview(event.data.previewId, event.data);
      }),

      // 进度更新
      ws.subscribe('visualization:progress-update', (event: any) => {
        // Progress updates handled by AgentStatusStore
      }),

      // 会话状态更新
      ws.subscribe('visualization:session-status-update', (event: any) => {
        if (event.sessionId === sessionId) {
          store.updateSession({ status: event.status });
        }
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      ws.leaveSession(sessionId);
    };
  }, [sessionId, ws, store]);

  // 自动加载会话
  useEffect(() => {
    if (sessionId && !store.currentSession) {
      loadSession(sessionId);
    }
  }, [sessionId, store.currentSession, loadSession]);

  return {
    session: store.currentSession,
    agentStatuses: Object.values(store.agentStatuses),
    decisions: store.decisions,
    unreadDecisions: store.unreadDecisions,
    errors: store.errors,
    unresolvedErrors: store.unresolvedErrors,
    collaborations: store.collaborations,
    previews: store.previews,
    personas: store.personas,
    connected: store.connected,
    reconnecting: store.reconnecting,
    loading: store.loading,
    error: store.error,
    loadSession,
    clearSession: store.clearSession,
  };
}
