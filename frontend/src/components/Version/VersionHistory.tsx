/**
 * Version History Component
 *
 * Phase 2 Week 6 - 版本历史
 * 显示项目版本历史、对比和回滚
 */

import React, { useState } from 'react';
import {
  GitBranch,
  Clock,
  User,
  FileText,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  GitCommit,
  Tag,
} from 'lucide-react';

export interface Version {
  id: string;
  versionNumber: string;
  projectId: string;
  description: string;
  createdBy: string;
  createdAt: string;
  changes: Array<{
    type: 'added' | 'modified' | 'deleted';
    file: string;
    description: string;
  }>;
  tags?: string[];
  isProduction?: boolean;
}

export interface VersionHistoryProps {
  versions: Version[];
  currentVersionId?: string;
  onViewVersion?: (versionId: string) => void;
  onRestoreVersion?: (versionId: string) => void;
  onCompareVersions?: (versionId1: string, versionId2: string) => void;
  className?: string;
}

/**
 * 单个版本卡片
 */
const VersionCard: React.FC<{
  version: Version;
  isCurrent?: boolean;
  onView?: () => void;
  onRestore?: () => void;
}> = ({ version, isCurrent, onView, onRestore }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`
        p-4 rounded-lg border-2 transition-all
        ${
          isCurrent
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
      `}
    >
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div
            className={`
            p-2 rounded-lg
            ${isCurrent ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}
          `}
          >
            <GitCommit
              className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900 dark:text-white">
                v{version.versionNumber}
              </h4>
              {isCurrent && (
                <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-full font-medium">
                  当前版本
                </span>
              )}
              {version.isProduction && (
                <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full font-medium flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  生产环境
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {version.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {version.createdBy}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(version.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={onView}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="查看详情"
          >
            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          {!isCurrent && (
            <button
              onClick={onRestore}
              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              title="恢复到此版本"
            >
              <RotateCcw className="w-4 h-4 text-blue-600" />
            </button>
          )}
        </div>
      </div>

      {/* 标签 */}
      {version.tags && version.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          {version.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 变更列表 */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>
            {version.changes.length} 个变更
          </span>
        </button>

        {expanded && (
          <div className="ml-6 space-y-2">
            {version.changes.map((change, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm"
              >
                <span
                  className={`
                    w-16 flex-shrink-0 text-xs px-2 py-1 rounded font-medium
                    ${
                      change.type === 'added'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : change.type === 'modified'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }
                  `}
                >
                  {change.type === 'added' && '新增'}
                  {change.type === 'modified' && '修改'}
                  {change.type === 'deleted' && '删除'}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {change.file}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {change.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 版本历史主组件
 */
export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentVersionId,
  onViewVersion,
  onRestoreVersion,
  onCompareVersions,
  className = '',
}) => {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const handleVersionSelect = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter((id) => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompareVersions) {
      onCompareVersions(selectedVersions[0], selectedVersions[1]);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 标题 */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <GitBranch className="w-6 h-6" />
          版本历史
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          查看所有版本，对比变更，或回滚到之前的版本
        </p>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">{versions.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">总版本数</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">
            {versions.filter((v) => v.isProduction).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">生产版本</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-600">
            {versions.reduce((sum, v) => sum + v.changes.length, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">总变更数</div>
        </div>
      </div>

      {/* 对比按钮 */}
      {selectedVersions.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            已选择 {selectedVersions.length} 个版本
            {selectedVersions.length < 2 && ' (再选择一个以对比)'}
          </span>
          {selectedVersions.length === 2 && (
            <button
              onClick={handleCompare}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              对比版本
            </button>
          )}
        </div>
      )}

      {/* 版本时间线 */}
      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
            <div className="text-6xl mb-4">📜</div>
            <p className="text-lg font-medium">暂无版本历史</p>
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`
                  ${selectedVersions.includes(version.id) ? 'ring-2 ring-blue-500' : ''}
                `}
                onClick={() => handleVersionSelect(version.id)}
              >
                <VersionCard
                  version={version}
                  isCurrent={version.id === currentVersionId}
                  onView={() => onViewVersion?.(version.id)}
                  onRestore={() => onRestoreVersion?.(version.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
