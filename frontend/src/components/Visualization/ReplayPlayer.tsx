/**
 * T127: ReplayPlayer Component
 *
 * Phase 9 - Historical Replay & Data Archiving
 *
 * 功能：
 * - 回放历史构建会话
 * - 播放控制（播放/暂停/快进/后退）
 * - 时间线拖动
 * - 加载冷数据提示
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';

export interface ReplayEvent {
  timestamp: number;
  type: 'agent-status' | 'decision' | 'collaboration' | 'error';
  data: any;
}

export interface ReplaySessionData {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  events: ReplayEvent[];
  archived: boolean;
}

interface ReplayPlayerProps {
  sessionData: ReplaySessionData | null;
  loading?: boolean;
  onEventChange?: (currentEvent: ReplayEvent, progress: number) => void;
  className?: string;
}

export const ReplayPlayer: React.FC<ReplayPlayerProps> = ({
  sessionData,
  loading = false,
  onEventChange,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const events = sessionData?.events || [];
  const totalEvents = events.length;
  const currentEvent = events[currentIndex];

  // 计算进度百分比
  const progress = totalEvents > 0 ? (currentIndex / (totalEvents - 1)) * 100 : 0;

  // 播放/暂停
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // 快进
  const fastForward = () => {
    setCurrentIndex((prev) => Math.min(prev + 10, totalEvents - 1));
  };

  // 后退
  const rewind = () => {
    setCurrentIndex((prev) => Math.max(prev - 10, 0));
  };

  // 重新开始
  const restart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  // 改变速度
  const cycleSpeed = () => {
    setPlaybackSpeed((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      return 1;
    });
  };

  // 时间线拖动
  const handleTimelineSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newIndex = Math.floor(percentage * (totalEvents - 1));
    setCurrentIndex(Math.max(0, Math.min(newIndex, totalEvents - 1)));
  };

  // 自动播放逻辑
  useEffect(() => {
    if (isPlaying && currentIndex < totalEvents - 1) {
      const baseDelay = 500; // 基础延迟 500ms
      const delay = baseDelay / playbackSpeed;

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= totalEvents - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isPlaying, currentIndex, totalEvents, playbackSpeed]);

  // 当前事件变化时通知父组件
  useEffect(() => {
    if (currentEvent && onEventChange) {
      onEventChange(currentEvent, progress);
    }
  }, [currentEvent, progress, onEventChange]);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 格式化时长
  const formatDuration = () => {
    if (!sessionData?.startTime || !sessionData?.endTime) return '--:--';
    const duration = new Date(sessionData.endTime).getTime() - new Date(sessionData.startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 如果正在加载
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600">正在加载回放数据...</span>
        </div>
        {sessionData?.archived && (
          <p className="mt-3 text-sm text-gray-500 text-center">
            从归档存储加载可能需要几秒钟
          </p>
        )}
      </div>
    );
  }

  // 如果没有数据
  if (!sessionData || totalEvents === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <p className="text-center text-gray-500">暂无回放数据</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">会话回放</h3>
          <p className="text-sm text-gray-500">
            {sessionData.startTime && formatTime(new Date(sessionData.startTime).getTime())} -{' '}
            {sessionData.endTime && formatTime(new Date(sessionData.endTime).getTime())}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            事件 {currentIndex + 1} / {totalEvents}
          </div>
          <div className="text-xs text-gray-500">总时长: {formatDuration()}</div>
        </div>
      </div>

      {/* 时间线 */}
      <div className="mb-4">
        <div
          className="relative h-2 bg-gray-200 rounded-full cursor-pointer group"
          onClick={handleTimelineSeek}
        >
          {/* 进度条 */}
          <div
            className="absolute h-full bg-primary-600 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />

          {/* 拖动手柄 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-600 rounded-full border-2 border-white shadow-md transition-all duration-200 group-hover:scale-125"
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* 当前时间显示 */}
        {currentEvent && (
          <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
            <ClockIcon className="w-3 h-3 mr-1" />
            {formatTime(currentEvent.timestamp)}
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-center gap-3">
        {/* 重新开始 */}
        <button
          onClick={restart}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="重新开始"
        >
          <ArrowPathIcon className="w-5 h-5 text-gray-600" />
        </button>

        {/* 后退 */}
        <button
          onClick={rewind}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="后退 10 步"
          disabled={currentIndex === 0}
        >
          <BackwardIcon className="w-5 h-5 text-gray-600" />
        </button>

        {/* 播放/暂停 */}
        <button
          onClick={togglePlay}
          className="p-3 rounded-full bg-primary-600 hover:bg-primary-700 transition-colors"
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <PauseIcon className="w-6 h-6 text-white" />
          ) : (
            <PlayIcon className="w-6 h-6 text-white" />
          )}
        </button>

        {/* 快进 */}
        <button
          onClick={fastForward}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="快进 10 步"
          disabled={currentIndex >= totalEvents - 1}
        >
          <ForwardIcon className="w-5 h-5 text-gray-600" />
        </button>

        {/* 速度控制 */}
        <button
          onClick={cycleSpeed}
          className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
          title="改变播放速度"
        >
          {playbackSpeed}x
        </button>
      </div>

      {/* 冷数据提示 */}
      {sessionData.archived && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-sm text-blue-800">
            📦 该会话已归档，数据从冷存储加载
          </p>
        </div>
      )}
    </div>
  );
};

export default ReplayPlayer;
