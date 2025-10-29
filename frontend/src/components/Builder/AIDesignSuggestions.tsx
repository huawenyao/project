/**
 * AI Design Suggestions
 * T061: AI设计建议生成和显示
 */

import React, { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useBuilderStore } from '../../stores/builderStore';

export interface DesignSuggestion {
  type: 'improvement' | 'accessibility' | 'performance' | 'ux';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface AIDesignSuggestionsProps {
  projectId: string;
  className?: string;
}

export const AIDesignSuggestions: React.FC<AIDesignSuggestionsProps> = ({
  projectId,
  className = '',
}) => {
  const { components } = useBuilderStore();
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/builder/design-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          components: Object.values(components),
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setSuggestions(result.data);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(components).length > 0) {
      loadSuggestions();
    }
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accessibility':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'performance':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'ux':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-300 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-green-300 bg-green-50 dark:bg-green-900/20';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* 标题 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              设计建议
            </h3>
          </div>
          <button
            onClick={loadSuggestions}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
            title="刷新建议"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          AI分析您的设计并提供改进建议
        </p>
      </div>

      {/* 建议列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              正在分析您的设计...
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-600 py-8">
            <Lightbulb className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无设计建议</p>
            <p className="text-xs mt-2">添加一些组件后再试试</p>
          </div>
        ) : (
          suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className={`border-2 rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {suggestion.title}
                    </h4>
                    <span
                      className={`
                        text-xs px-2 py-0.5 rounded-full font-medium
                        ${
                          suggestion.priority === 'high'
                            ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                            : suggestion.priority === 'medium'
                            ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                            : 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                        }
                      `}
                    >
                      {suggestion.priority === 'high'
                        ? '高优先级'
                        : suggestion.priority === 'medium'
                        ? '中优先级'
                        : '低优先级'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {suggestion.description}
                  </p>
                  {suggestion.actionable && (
                    <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      应用此建议
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AIDesignSuggestions;
