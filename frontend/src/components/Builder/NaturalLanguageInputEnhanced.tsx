/**
 * Enhanced Natural Language Input Component
 *
 * Phase 2 - 集成NLP API和状态管理
 */

import React, { useState } from 'react';
import { Send, Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import nlpService, { type RequirementAnalysis, type ClarificationQuestion } from '../../services/nlpService';
import { useProjectStore } from '../../stores/projectStore';

export interface NaturalLanguageInputEnhancedProps {
  onSuccess?: (analysis: RequirementAnalysis) => void;
  onError?: (error: string) => void;
}

export const NaturalLanguageInputEnhanced: React.FC<NaturalLanguageInputEnhancedProps> = ({
  onSuccess,
  onError,
}) => {
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [clarifications, setClarifications] = useState<ClarificationQuestion[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});

  const { addProject } = useProjectStore();

  // 验证输入
  const validateMutation = useMutation({
    mutationFn: (text: string) => nlpService.validateInput(text),
    onSuccess: (result) => {
      if (!result.isValid) {
        setValidationError(result.reason || '输入无效');
      } else {
        setValidationError(null);
      }
    },
  });

  // 解析需求
  const parseMutation = useMutation({
    mutationFn: (text: string) => nlpService.parseRequirement(text),
    onSuccess: (response) => {
      if (response.success && response.data) {
        // 检查是否需要澄清
        if (response.clarifications && response.clarifications.length > 0) {
          setClarifications(response.clarifications);
        } else {
          // 创建项目
          const project = {
            id: `project_${Date.now()}`,
            userId: 'current_user', // TODO: 从认证状态获取
            name: response.data.appType,
            requirementText: inputText,
            parsedRequirement: response.data,
            status: 'ready' as const,
            techStack: response.data.techStack,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          addProject(project);

          if (onSuccess) {
            onSuccess(response.data);
          }

          // 清空输入
          setInputText('');
          setClarifications([]);
        }
      } else {
        const errorMsg = response.error || '解析失败';
        setValidationError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      }
    },
    onError: (error: any) => {
      const errorMsg = error.message || '解析失败';
      setValidationError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    },
  });

  // 提交澄清答案
  const clarifySutation = useMutation({
    mutationFn: () => nlpService.submitClarifications(inputText, clarificationAnswers),
    onSuccess: (response) => {
      if (response.success && response.data) {
        const project = {
          id: `project_${Date.now()}`,
          userId: 'current_user',
          name: response.data.appType,
          requirementText: inputText,
          parsedRequirement: response.data,
          status: 'ready' as const,
          techStack: response.data.techStack,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        addProject(project);

        if (onSuccess) {
          onSuccess(response.data);
        }

        setInputText('');
        setClarifications([]);
        setClarificationAnswers({});
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    // 先验证
    const validationResult = await validateMutation.mutateAsync(trimmedText);
    if (validationResult.isValid) {
      // 验证通过，解析需求
      parseMutation.mutate(trimmedText);
    }
  };

  const handleClarificationSubmit = () => {
    clarifySutation.mutate();
  };

  const handleExampleClick = (example: string) => {
    setInputText(example);
    setValidationError(null);
  };

  const isValid = inputText.trim().length >= 10;
  const isLoading = parseMutation.isPending || clarifySutation.isPending;

  const examples = [
    '我需要一个博客平台，支持文章发布、评论和分类',
    '创建一个客户关系管理系统（CRM），包含客户信息、销售跟进和报表分析',
    '构建一个在线商城，包含商品管理、购物车、订单处理和支付功能',
    '开发一个项目管理工具，支持任务分配、进度跟踪和团队协作',
  ];

  // 如果有澄清问题，显示澄清界面
  if (clarifications.length > 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            需要一些额外信息
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            请回答以下问题，帮助我们更好地理解你的需求
          </p>
        </div>

        <div className="space-y-4">
          {clarifications.map((q, index) => (
            <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {q.question}
              </label>
              {q.options ? (
                <select
                  value={clarificationAnswers[q.question] || ''}
                  onChange={(e) =>
                    setClarificationAnswers((prev) => ({
                      ...prev,
                      [q.question]: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择...</option>
                  {q.options.map((option, i) => (
                    <option key={i} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={clarificationAnswers[q.question] || ''}
                  onChange={(e) =>
                    setClarificationAnswers((prev) => ({
                      ...prev,
                      [q.question]: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入..."
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => {
              setClarifications([]);
              setClarificationAnswers({});
            }}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                     text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                     transition-colors"
          >
            返回修改
          </button>
          <button
            onClick={handleClarificationSubmit}
            disabled={
              Object.keys(clarificationAnswers).length < clarifications.length ||
              clarifySutation.isPending
            }
            className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg
                     disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors
                     flex items-center justify-center gap-2"
          >
            {clarifySutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>处理中...</span>
              </>
            ) : (
              <span>提交答案</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 标题和说明 */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            用自然语言描述你的应用
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          告诉我们你想要什么，AI会为你自动构建应用
        </p>
      </div>

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            relative rounded-2xl border-2 transition-all duration-200
            ${
              isFocused
                ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                : validationError
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-700'
            }
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setValidationError(null);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="描述你想要创建的应用，例如：我需要一个待办事项管理应用..."
            disabled={isLoading}
            rows={6}
            className="w-full px-6 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl resize-none focus:outline-none"
          />

          {/* 验证状态 */}
          {isValid && !validationError && (
            <div className="absolute top-4 right-4 text-green-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          )}

          {/* 字符计数 */}
          <div className="absolute bottom-4 left-6 text-sm text-gray-500">
            {inputText.length} / 5000
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`
              absolute bottom-4 right-4 px-6 py-2 rounded-lg font-medium
              flex items-center gap-2 transition-all duration-200
              ${
                isValid && !isLoading
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>分析中...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>开始构建</span>
              </>
            )}
          </button>
        </div>

        {/* 验证错误 */}
        {validationError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
          </div>
        )}
      </form>

      {/* 示例 */}
      {!inputText && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            试试这些示例：
          </p>
          <div className="grid gap-2">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700
                         hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                         text-sm text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>提示：</strong>
          描述越详细，AI生成的应用越符合你的需求。你可以包括：
          <br />
          • 应用的主要功能
          <br />
          • 目标用户群体
          <br />
          • 需要的数据结构
          <br />• 特殊的业务规则
        </p>
      </div>
    </div>
  );
};

export default NaturalLanguageInputEnhanced;
