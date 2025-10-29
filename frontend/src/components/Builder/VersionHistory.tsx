/**
 * Version History
 * T062.1: 版本历史管理组件
 */

import React, { useState, useEffect } from 'react';
import { History, RotateCcw, GitBranch, Clock, User } from 'lucide-react';

export interface Version {
  id: string;
  versionNumber: string;
  description: string;
  createdAt: string;
  createdByUser?: {
    username: string;
  };
}

export interface VersionHistoryProps {
  projectId: string;
  onRestore?: (versionId: string) => void;
  onCompare?: (versionId1: string, versionId2: string) => void;
  className?: string;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  projectId,
  onRestore,
  onCompare,
  className = '',
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  useEffect(() => {
    loadVersions();
  }, [projectId]);

  const loadVersions = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/versions`);
      const result = await response.json();

      if (result.success && result.data) {
        setVersions(result.data.versions);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm('确定要恢复到这个版本吗？当前状态会被保存为新版本。')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}/restore`,
        { method: 'POST' }
      );

      const result = await response.json();

      if (result.success) {
        alert('版本恢复成功！');
        if (onRestore) {
          onRestore(versionId);
        }
        loadVersions();
      } else {
        alert(`恢复失败: ${result.message}`);
      }
    } catch (error: any) {
      alert(`恢复失败: ${error.message}`);
    }
  };

  const handleSelectVersion = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter((id) => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    } else {
      setSelectedVersions([selectedVersions[1], versionId]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompare) {
      onCompare(selectedVersions[0], selectedVersions[1]);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* 标题 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              版本历史
            </h3>
          </div>
          {selectedVersions.length === 2 && (
            <button
              onClick={handleCompare}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm
                       font-medium transition-colors"
            >
              对比版本
            </button>
          )}
        </div>
        {selectedVersions.length > 0 && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            已选择 {selectedVersions.length}/2 个版本进行对比
          </p>
        )}
      </div>

      {/* 版本列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : versions.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-600 py-8">
            <GitBranch className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无版本历史</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, idx) => (
              <div
                key={version.id}
                className={`border-2 rounded-lg p-4 transition-all cursor-pointer
                  ${
                    selectedVersions.includes(version.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                onClick={() => handleSelectVersion(version.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        v{version.versionNumber}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {version.description}
                    </p>
                  </div>
                  {idx !== 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(version.id);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded
                               transition-colors group"
                      title="恢复到此版本"
                    >
                      <RotateCcw className="w-4 h-4 text-gray-500 group-hover:text-blue-500" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(version.createdAt).toLocaleString('zh-CN')}
                  </div>
                  {version.createdByUser && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {version.createdByUser.username}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
