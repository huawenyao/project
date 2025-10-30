/**
 * 新建项目弹窗组件
 * 将原来的 BuilderSidebar 表单改为弹窗形式
 */

import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { Zap, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useBuilderStore } from '../../stores/builderStore';

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

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onStartBuild: (requirements: BuildRequirements) => void;
}

export default function NewProjectModal({ open, onClose, onStartBuild }: NewProjectModalProps) {
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
      Modal.warning({
        title: '提示',
        content: '请填写项目名称和需求描述',
      });
      return;
    }

    const requirements: BuildRequirements = {
      projectName: projectName.trim(),
      description: description.trim(),
      techStack: { frontend, backend, database },
      advancedOptions: { authentication, api, deployment },
    };

    onStartBuild(requirements);
    onClose();
  };

  const handleClear = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定清空所有输入？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setProjectName('');
        setDescription('');
        setFrontend('react');
        setBackend('node');
        setDatabase('postgresql');
        setAuthentication(true);
        setApi('rest');
        setDeployment('docker');
      },
    });
  };

  const handleSaveDraft = () => {
    // TODO: 实现保存草稿功能
    Modal.info({
      title: '提示',
      content: '草稿已保存（功能开发中）',
    });
  };

  return (
    <Modal
      title={
        <div>
          <h2 className="text-xl font-bold">新建项目</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            描述你的需求，AI Agents 会帮你构建应用
          </p>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={680}
      footer={null}
      centered
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
        },
      }}
    >
      <div className="space-y-6 pt-4">
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
            rows={6}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="node">Node.js</option>
                <option value="django">Django</option>
                <option value="rails">Rails</option>
                <option value="spring">Spring Boot</option>
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
        </div>

        {/* 高级选项（可折叠） */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 dark:text-white py-2"
          >
            <span>高级选项</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleClear}
            disabled={isBuilding}
            danger
          >
            清空
          </Button>
          <Button
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveDraft}
            disabled={isBuilding}
          >
            保存草稿
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<Zap className="w-4 h-4" />}
            onClick={handleStartBuild}
            disabled={isBuilding}
            loading={isBuilding}
            className="h-10"
          >
            {isBuilding ? '构建中...' : '开始构建'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
