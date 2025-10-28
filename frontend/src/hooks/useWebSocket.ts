/**
 * useWebSocket Hook
 *
 * WebSocket 连接管理 Hook
 */

import { useEffect, useRef, useCallback } from 'react';
import { useVisualizationStore } from '../stores/visualizationStore';
import WebSocketService, { ConnectionStatus } from '../services/WebSocketService';
import type { VisualizationUpdateEvent } from '../types/visualization.types';

interface UseWebSocketOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = import.meta.env.VITE_WS_URL || 'http://localhost:3001',
    token,
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const store = useVisualizationStore();
  const isInitialized = useRef(false);

  // 初始化 WebSocket
  useEffect(() => {
    if (isInitialized.current) return;

    WebSocketService.initialize({
      url,
      token,
      autoConnect,
    });

    isInitialized.current = true;

    // 监听连接状态
    const unsubscribe = WebSocketService.onStatusChange((status: ConnectionStatus) => {
      if (status === 'connected') {
        store.setConnected(true);
        store.setReconnecting(false);
        onConnect?.();
      } else if (status === 'disconnected') {
        store.setConnected(false);
        onDisconnect?.();
      } else if (status === 'reconnecting') {
        store.setReconnecting(true);
      } else if (status === 'error') {
        store.setConnected(false);
        onError?.(new Error('WebSocket connection error'));
      }
    });

    return () => {
      unsubscribe();
      WebSocketService.disconnect();
      isInitialized.current = false;
    };
  }, [url, token, autoConnect, onConnect, onDisconnect, onError, store]);

  // 订阅事件的辅助函数
  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    return WebSocketService.on(event, handler);
  }, []);

  // 发送事件的辅助函数
  const emit = useCallback((event: string, data?: any) => {
    WebSocketService.emit(event, data);
  }, []);

  // 加入会话房间
  const joinSession = useCallback((sessionId: string) => {
    WebSocketService.emit('visualization:join-session', { sessionId });
  }, []);

  // 离开会话房间
  const leaveSession = useCallback((sessionId: string) => {
    WebSocketService.emit('visualization:leave-session', { sessionId });
  }, []);

  return {
    subscribe,
    emit,
    joinSession,
    leaveSession,
    isConnected: WebSocketService.isConnected(),
    getStatus: () => WebSocketService.getStatus(),
    connect: () => WebSocketService.connect(),
    disconnect: () => WebSocketService.disconnect(),
  };
}
