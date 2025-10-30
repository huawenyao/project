/**
 * Builder 左侧面板 - 需求输入表单
 * 用户输入项目需求、技术栈选择、高级选项
 */

import React, { useState } from 'react';
import { Zap, Save, Trash2, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from 'antd';
import { useBuilderStore } from '../../stores/builderStore';

interface BuilderSidebarProps {
  onStartBuild: (requirements: BuildRequirements) => void;
}

export interface BuildRequirements {
  projectName: string;
  description: string;
  techStack: {
    frontend: string;
    backend: string;
    database: string;
  };
  advancedOptions: {
    authentication: boolean;
    api: string;
    deployment: string;
  };
}

export default function BuilderSidebar({ onStartBuild }: BuilderSidebarProps) {
  const { sessionStatus } = useBuilderStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 表单状态
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [frontend, setFrontend] = useState('react');
  const [backend, setBackend] = useState('node');
  const [database, setDatabase] = useState('postgresql');
  const [authentication, setAuthentication] = useState(true);
  const [api, setApi] = useState('rest');
  const [deployment, setDeployment] = useState('docker');

  const isBuilding = sessionStatus === 'building';

  const handleStartBuild = () => {
    if (!projectName.trim() || !description.trim()) {
      alert('请填写项目名称和需求描述');
      return;
    }

    const requirements: BuildRequirements = {
      projectName: projectName.trim(),
      description: description.trim(),
      techStack: { frontend, backend, database },
      advancedOptions: { authentication, api, deployment },
    };

    onStartBuild(requirements);
  };

  const handleClear = () => {
    if (confirm('确定清空所有输入？')) {
      setProjectName('');
      setDescription('');
      setFrontend('react');
      setBackend('node');
      setDatabase('postgresql');
      setAuthentication(true);
      setApi('rest');
      setDeployment('docker');
    }
  };

  const handleSaveDraft = () => {
    // TODO: 实现保存草稿功能
    alert('草稿已保存（功能开发中）');
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* 标题 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            新建项目
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            描述你的需求，AI Agents 会帮你构建应用
          </p>
        </div>

        {/* 项目名称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            项目名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="例如：电商管理系统"
            disabled={isBuilding}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* 需求描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            需求描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="详细描述你的应用功能需求...&#10;&#10;例如：&#10;- 用户注册和登录&#10;- 商品管理（增删改查）&#10;- 订单系统&#10;- 支付集成"
            disabled={isBuilding}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
        </div>

        {/* 技术栈选择 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            技术栈
          </h3>

          {/* 前端框架 */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              前端框架
            </label>
            <select
              value={frontend}
              onChange={(e) => setFrontend(e.target.value)}
              disabled={isBuilding}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="react">React</option>
              <option value="vue">Vue</option>
              <option value="angular">Angular</option>
              <option value="svelte">Svelte</option>
            </select>
          </div>

          {/* 后端框架 */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              后端框架
            </label>
            <select
              value={backend}
              onChange={(e) => setBackend(e.target.value)}
              disabled={isBuilding}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="node">Node.js / Express</option>
              <option value="django">Python / Django</option>
              <option value="rails">Ruby on Rails</option>
              <option value="spring">Java / Spring Boot</option>
            </select>
          </div>

          {/* 数据库 */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              数据库
            </label>
            <select
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              disabled={isBuilding}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
        </div>

        {/* 高级选项（可折叠） */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 dark:text-white"
          >
            <span>高级选项</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {/* 认证 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="authentication"
                  checked={authentication}
                  onChange={(e) => setAuthentication(e.target.checked)}
                  disabled={isBuilding}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label
                  htmlFor="authentication"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  包含用户认证系统
                </label>
              </div>

              {/* API 类型 */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  API 类型
                </label>
                <select
                  value={api}
                  onChange={(e) => setApi(e.target.value)}
                  disabled={isBuilding}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="rest">REST API</option>
                  <option value="graphql">GraphQL</option>
                  <option value="grpc">gRPC</option>
                </select>
              </div>

              {/* 部署方式 */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  部署方式
                </label>
                <select
                  value={deployment}
                  onChange={(e) => setDeployment(e.target.value)}
                  disabled={isBuilding}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="docker">Docker</option>
                  <option value="kubernetes">Kubernetes</option>
                  <option value="serverless">Serverless</option>
                  <option value="traditional">Traditional</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3 pt-4">
          <Button
            type="primary"
            size="large"
            icon={<Zap className="w-4 h-4" />}
            onClick={handleStartBuild}
            disabled={isBuilding}
            loading={isBuilding}
            block
            className="h-12 text-base font-semibold"
          >
            {isBuilding ? '构建中...' : '开始构建'}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveDraft}
              disabled={isBuilding}
            >
              保存草稿
            </Button>
            <Button
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleClear}
              disabled={isBuilding}
              danger
            >
              清空
            </Button>
          </div>
        </div>

        {/* 构建历史快捷入口 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              最近构建
            </h3>
            <History className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              暂无历史构建记录
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
