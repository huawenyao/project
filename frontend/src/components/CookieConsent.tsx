/**
 * T145: Cookie Consent Banner
 *
 * Phase 11 - Anonymized Metrics Collection
 *
 * 功能：
 * - GDPR/CCPA 合规的 Cookie 同意横幅
 * - 用户可选择接受或拒绝数据收集
 * - 提供隐私政策链接
 * - 偏好持久化到 localStorage
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 检查用户是否已经做过选择
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // 延迟 1 秒显示，避免干扰页面加载
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('metrics-collection', 'enabled');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    localStorage.setItem('metrics-collection', 'disabled');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
      <div className="bg-white border-t-2 border-primary-600 shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* 图标 */}
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="w-10 h-10 text-primary-600" />
            </div>

            {/* 内容 */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🍪 我们重视您的隐私
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                我们使用匿名化数据收集来改进产品体验。您的个人信息不会被收集或分享。
                我们收集的数据包括功能使用情况、交互模式等聚合统计信息。
                阅读我们的{' '}
                <a
                  href="/privacy-policy"
                  className="text-primary-600 underline hover:text-primary-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  隐私政策
                </a>{' '}
                了解详情。
              </p>
            </div>

            {/* 按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={handleAccept}
                className="
                  px-6 py-2 bg-primary-600 text-white rounded-md
                  hover:bg-primary-700 active:bg-primary-800
                  transition-colors duration-200
                  font-medium text-sm
                  whitespace-nowrap
                "
              >
                接受
              </button>
              <button
                onClick={handleDecline}
                className="
                  px-6 py-2 bg-gray-200 text-gray-700 rounded-md
                  hover:bg-gray-300 active:bg-gray-400
                  transition-colors duration-200
                  font-medium text-sm
                  whitespace-nowrap
                "
              >
                拒绝
              </button>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={handleDecline}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors md:relative md:top-0 md:right-0"
              aria-label="关闭"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
