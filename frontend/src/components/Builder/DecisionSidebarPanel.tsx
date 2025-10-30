/**
 * Builder 右侧决策面板
 * 显示决策时间线、未读通知、筛选和搜索
 */

import React, { useState } from 'react';
import { CheckCheck, Filter, Search } from 'lucide-react';
import { Badge, Select } from 'antd';
import DecisionTimeline from '../Visualization/DecisionTimeline';
import { useBuilderStore } from '../../stores/builderStore';
import type { DecisionImpact, AgentType } from '../../types/visualization';

const { Option } = Select;

export default function DecisionSidebarPanel() {
  const { decisions, unreadDecisions, markAllDecisionsAsRead, markDecisionAsRead } =
    useBuilderStore();

  // 筛选状态
  const [filterImpact, setFilterImpact] = useState<DecisionImpact | 'all'>('all');
  const [filterAgent, setFilterAgent] = useState<AgentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 应用筛选
  const filteredDecisions = decisions.filter((decision) => {
    // 按影响力筛选
    if (filterImpact !== 'all' && decision.impact !== filterImpact) {
      return false;
    }

    // 按 Agent 筛选
    if (filterAgent !== 'all' && decision.agentType !== filterAgent) {
      return false;
    }

    // 按搜索关键词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = decision.title.toLowerCase().includes(query);
      const descMatch = decision.description?.toLowerCase().includes(query);
      return titleMatch || descMatch;
    }

    return true;
  });

  const handleDecisionClick = (decision: any) => {
    markDecisionAsRead(decision.decisionId);
    // TODO: 打开决策详情 Modal
    console.log('Decision clicked:', decision);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            决策时间线
          </h2>
          {unreadDecisions > 0 && (
            <Badge count={unreadDecisions} overflowCount={99} />
          )}
        </div>

        {/* 搜索框 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索决策..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* 筛选选项 */}
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select
            value={filterImpact}
            onChange={setFilterImpact}
            size="small"
            style={{ width: '45%' }}
          >
            <Option value="all">所有重要性</Option>
            <Option value="high">高</Option>
            <Option value="medium">中</Option>
            <Option value="low">低</Option>
          </Select>
          <Select
            value={filterAgent}
            onChange={setFilterAgent}
            size="small"
            style={{ width: '45%' }}
          >
            <Option value="all">所有 Agent</Option>
            <Option value="ui">UIAgent</Option>
            <Option value="backend">BackendAgent</Option>
            <Option value="database">DatabaseAgent</Option>
            <Option value="integration">IntegrationAgent</Option>
            <Option value="deployment">DeploymentAgent</Option>
          </Select>
        </div>

        {/* 全部标为已读按钮 */}
        {unreadDecisions > 0 && (
          <button
            onClick={markAllDecisionsAsRead}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 
                     text-sm font-medium text-primary-600 dark:text-primary-400 
                     hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>全部标为已读</span>
          </button>
        )}
      </div>

      {/* 决策时间线内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredDecisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-600 dark:text-gray-400">
              {decisions.length === 0
                ? '暂无决策记录'
                : '没有符合筛选条件的决策'}
            </p>
          </div>
        ) : (
          <DecisionTimeline
            decisions={filteredDecisions}
            onDecisionClick={handleDecisionClick}
          />
        )}
      </div>

      {/* 统计信息 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {decisions.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">总决策</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {unreadDecisions}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">未读</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {decisions.filter((d) => d.impact === 'high').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">高重要性</div>
          </div>
        </div>
      </div>
    </div>
  );
}
