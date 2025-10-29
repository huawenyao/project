/**
 * Version Comparison
 * T062.2: 版本对比界面
 */

import React, { useState, useEffect } from 'react';
import { GitCompare, Plus, Minus, Edit } from 'lucide-react';

export interface VersionDiff {
  added: Array<{ type: string; items: any[] }>;
  modified: Array<{ type: string; items: any[] }>;
  removed: Array<{ type: string; items: any[] }>;
}

export interface VersionComparisonProps {
  projectId: string;
  versionId1: string;
  versionId2: string;
  onClose?: () => void;
  className?: string;
}

export const VersionComparison: React.FC<VersionComparisonProps> = ({
  projectId,
  versionId1,
  versionId2,
  onClose,
  className = '',
}) => {
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiff();
  }, [versionId1, versionId2]);

  const loadDiff = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/compare?versionId1=${versionId1}&versionId2=${versionId2}`
      );

      const result = await response.json();

      if (result.success && result.data) {
        setDiff(result.data.diff);
      }
    } catch (error) {
      console.error('Failed to load diff:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">加载对比数据...</p>
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">无法加载对比数据</p>
      </div>
    );
  }

  const hasChanges =
    diff.added.length > 0 || diff.modified.length > 0 || diff.removed.length > 0;

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* 标题 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              版本对比
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              关闭
            </button>
          )}
        </div>
      </div>

      {/* 对比内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasChanges ? (
          <div className="text-center text-gray-400 dark:text-gray-600 py-8">
            <GitCompare className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm">两个版本没有差异</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 新增项 */}
            {diff.added.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400 mb-3">
                  <Plus className="w-4 h-4" />
                  新增 ({diff.added.reduce((sum, group) => sum + group.items.length, 0)})
                </h4>
                <div className="space-y-3">
                  {diff.added.map((group, idx) => (
                    <div key={idx} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-2">
                        {group.type}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item: any, itemIdx: number) => (
                          <div
                            key={itemIdx}
                            className="text-sm text-gray-700 dark:text-gray-300 pl-3 border-l-2 border-green-500"
                          >
                            {item.name || item.id}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 修改项 */}
            {diff.modified.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-yellow-700 dark:text-yellow-400 mb-3">
                  <Edit className="w-4 h-4" />
                  修改 ({diff.modified.reduce((sum, group) => sum + group.items.length, 0)})
                </h4>
                <div className="space-y-3">
                  {diff.modified.map((group, idx) => (
                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                        {group.type}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item: any, itemIdx: number) => (
                          <div
                            key={itemIdx}
                            className="text-sm text-gray-700 dark:text-gray-300 pl-3 border-l-2 border-yellow-500"
                          >
                            {item.name || item.id}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 删除项 */}
            {diff.removed.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400 mb-3">
                  <Minus className="w-4 h-4" />
                  删除 ({diff.removed.reduce((sum, group) => sum + group.items.length, 0)})
                </h4>
                <div className="space-y-3">
                  {diff.removed.map((group, idx) => (
                    <div key={idx} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-2">
                        {group.type}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item: any, itemIdx: number) => (
                          <div
                            key={itemIdx}
                            className="text-sm text-gray-700 dark:text-gray-300 pl-3 border-l-2 border-red-500"
                          >
                            {item.name || item.id}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionComparison;
