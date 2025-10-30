/**
 * T162: Connection Status Indicator Component
 * 显示 WebSocket 连接状态的可视化指示器
 */

import React, { useEffect, useState } from 'react';
import WebSocketService, { ConnectionStatus } from '../services/WebSocketService';

export const ConnectionIndicator: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    // 监听连接状态变化
    const unsubscribe = WebSocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'reconnecting') {
        setReconnectAttempts(WebSocketService.getReconnectAttempts());
      }
    });

    // 监听 toast 事件
    const handleConnectionLost = () => {
      // 可以在这里触发 toast 通知
      console.log('显示连接断开提示');
    };

    const handleConnectionRestored = () => {
      // 可以在这里触发 toast 通知
      console.log('显示连接恢复提示');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('websocket:connection-lost', handleConnectionLost);
      window.addEventListener('websocket:connection-restored', handleConnectionRestored);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('websocket:connection-lost', handleConnectionLost);
        window.removeEventListener('websocket:connection-restored', handleConnectionRestored);
      }
    };
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: '实时连接',
          icon: '●',
          animate: 'animate-none',
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          text: '连接中...',
          icon: '●',
          animate: 'animate-pulse',
        };
      case 'reconnecting':
        return {
          color: 'bg-orange-500',
          text: `重连中... (${reconnectAttempts})`,
          icon: '●',
          animate: 'animate-pulse',
        };
      case 'disconnected':
        return {
          color: 'bg-gray-500',
          text: '已断开',
          icon: '●',
          animate: 'animate-none',
        };
      case 'error':
        return {
          color: 'bg-red-500',
          text: '连接错误',
          icon: '✕',
          animate: 'animate-none',
        };
      default:
        return {
          color: 'bg-gray-500',
          text: '未知状态',
          icon: '?',
          animate: 'animate-none',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">
      <span className={`${config.color} ${config.animate} w-2 h-2 rounded-full`} />
      <span className="text-gray-700 dark:text-gray-300 font-medium">
        {config.text}
      </span>
    </div>
  );
};

export default ConnectionIndicator;
