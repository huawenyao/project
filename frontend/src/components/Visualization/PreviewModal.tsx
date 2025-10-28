/**
 * PreviewModal
 *
 * 预览弹窗组件 - 支持多种类型的预览内容渲染
 * T091: Preview modal with image/HTML/JSON/diagram/code rendering
 */

import React, { useState, useEffect } from 'react';

export type PreviewType = 'image' | 'html' | 'json' | 'diagram' | 'code';

export interface PreviewData {
  previewId: string;
  type: PreviewType;
  content: any;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PreviewModalProps {
  preview: PreviewData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  preview,
  isOpen,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isFullscreen, onClose]);

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !preview) return null;

  const getTypeIcon = () => {
    const icons = {
      image: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      html: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      json: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      diagram: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      code: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    };
    return icons[preview.type] || icons.code;
  };

  const renderPreviewContent = () => {
    switch (preview.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center p-6 bg-surface-elevated rounded-lg">
            <img
              src={preview.content}
              alt={preview.description || 'Preview'}
              className="max-w-full max-h-[70vh] rounded shadow-lg"
            />
          </div>
        );

      case 'html':
        return (
          <div className="p-6 bg-surface-elevated rounded-lg">
            <iframe
              srcDoc={preview.content}
              title={preview.description || 'HTML Preview'}
              className="w-full h-[60vh] border-0 rounded bg-white"
              sandbox="allow-scripts"
            />
          </div>
        );

      case 'json':
        return (
          <div className="p-6 bg-surface-elevated rounded-lg">
            <pre className="p-4 bg-surface text-text-primary rounded text-sm overflow-auto max-h-[60vh] font-mono">
              {JSON.stringify(preview.content, null, 2)}
            </pre>
          </div>
        );

      case 'code':
        return (
          <div className="p-6 bg-surface-elevated rounded-lg">
            <pre className="p-4 bg-surface text-text-primary rounded text-sm overflow-auto max-h-[60vh] font-mono whitespace-pre-wrap">
              {preview.content}
            </pre>
          </div>
        );

      case 'diagram':
        return (
          <div className="flex items-center justify-center p-6 bg-surface-elevated rounded-lg">
            <div className="text-center text-text-tertiary">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>图表预览功能即将推出</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 text-center text-text-tertiary">
            <p>不支持的预览类型: {preview.type}</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-modal-backdrop backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed z-modal bg-surface rounded-xl shadow-2xl border border-border animate-scale-in ${
          isFullscreen
            ? 'inset-4'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[90vh]'
        } overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface-elevated flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="text-primary">{getTypeIcon()}</div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-primary">
                {preview.description || '预览'}
              </h2>
              {preview.metadata && Object.keys(preview.metadata).length > 0 && (
                <p className="text-xs text-text-tertiary mt-1">
                  {Object.entries(preview.metadata)
                    .slice(0, 3)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(' • ')}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
              title="关闭"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderPreviewContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-surface-elevated flex items-center justify-between">
          <div className="text-xs text-text-tertiary">
            预览 ID: {preview.previewId.slice(0, 8)}...
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
            >
              {isFullscreen ? '退出全屏' : '全屏查看'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium bg-primary text-text-on-primary hover:bg-primary-dark rounded transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PreviewModal;
