/**
 * Smart Warnings
 * T062: 智能警告系统
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useBuilderStore } from '../../stores/builderStore';

export interface SmartWarning {
  level: 'error' | 'warning' | 'info';
  category: 'accessibility' | 'usability' | 'performance' | 'consistency';
  message: string;
  componentId?: string;
  suggestion?: string;
}

export interface SmartWarningsProps {
  projectId: string;
  className?: string;
}

export const SmartWarnings: React.FC<SmartWarningsProps> = ({
  projectId,
  className = '',
}) => {
  const { components } = useBuilderStore();
  const [warnings, setWarnings] = useState<SmartWarning[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    const checkWarnings = async () => {
      try {
        const response = await fetch(`/api/builder/smart-warnings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            components: Object.values(components),
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          setWarnings(result.data);
        }
      } catch (error) {
        console.error('Failed to check warnings:', error);
      }
    };

    if (Object.keys(components).length > 0) {
      checkWarnings();
    }
  }, [components, projectId]);

  const getIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'border-red-300 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-blue-300 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const visibleWarnings = warnings.filter((_, idx) => !dismissed.has(idx));

  if (visibleWarnings.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {visibleWarnings.map((warning, idx) => (
        <div
          key={idx}
          className={`border-2 rounded-lg p-3 ${getColor(warning.level)}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{getIcon(warning.level)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {warning.message}
                  </p>
                  {warning.suggestion && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      💡 {warning.suggestion}
                    </p>
                  )}
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {warning.category}
                  </span>
                </div>
                <button
                  onClick={() => setDismissed(new Set([...dismissed, idx]))}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SmartWarnings;
