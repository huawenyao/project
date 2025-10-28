/**
 * Metrics Service
 *
 * 匿名化用户行为分析服务 - 隐私优先
 */

import type { EventType, EventMetadata } from '../types/visualization.types';

interface MetricsConfig {
  enabled: boolean;
  anonymize: boolean;
  endpoint?: string;
}

class MetricsService {
  private config: MetricsConfig = {
    enabled: false,
    anonymize: true,
  };
  private sessionId: string | null = null;
  private userId: string | null = null;
  private queue: Array<{ type: EventType; metadata: EventMetadata; timestamp: string }> = [];
  private flushInterval: NodeJS.Timeout | null = null;

  /**
   * 初始化 Metrics 服务
   */
  initialize(config: MetricsConfig): void {
    this.config = { ...this.config, ...config };

    // 从 localStorage 读取用户设置
    const userSettings = localStorage.getItem('settings-storage');
    if (userSettings) {
      try {
        const parsed = JSON.parse(userSettings);
        if (parsed.state?.settings?.privacy) {
          this.config.enabled = parsed.state.settings.privacy.enableAnalytics;
          this.config.anonymize = parsed.state.settings.privacy.anonymizeData;
        }
      } catch (e) {
        console.error('[Metrics] Failed to parse user settings:', e);
      }
    }

    // 如果启用，开始定期发送队列
    if (this.config.enabled) {
      this.startFlushInterval();
    }

    console.log('[Metrics] Initialized:', this.config);
  }

  /**
   * 设置当前会话 ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * 设置用户 ID（如果启用匿名化，会被哈希处理）
   */
  setUserId(userId: string): void {
    this.userId = this.config.anonymize ? this.hashUserId(userId) : userId;
  }

  /**
   * 记录事件
   */
  track(eventType: EventType, metadata: EventMetadata = {}): void {
    if (!this.config.enabled) {
      return;
    }

    // 匿名化处理
    const sanitizedMetadata = this.config.anonymize
      ? this.sanitizeMetadata(metadata)
      : metadata;

    const event = {
      type: eventType,
      metadata: sanitizedMetadata,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(event);

    // 如果队列太大，立即发送
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  /**
   * 记录点击事件
   */
  trackClick(targetElement: string, value?: any): void {
    this.track('click', { targetElement, value });
  }

  /**
   * 记录悬停事件
   */
  trackHover(targetElement: string, duration?: number): void {
    this.track('hover', { targetElement, duration });
  }

  /**
   * 记录展开/折叠事件
   */
  trackExpand(targetElement: string, expanded: boolean): void {
    this.track(expanded ? 'expand' : 'collapse', { targetElement });
  }

  /**
   * 记录过滤事件
   */
  trackFilter(filterType: string, value: any): void {
    this.track('filter', { filterType, value });
  }

  /**
   * 记录搜索事件
   */
  trackSearch(query: string): void {
    // 搜索词匿名化
    const sanitizedQuery = this.config.anonymize ? '<redacted>' : query;
    this.track('search', { query: sanitizedQuery });
  }

  /**
   * 记录导出事件
   */
  trackExport(exportType: string): void {
    this.track('export', { exportType });
  }

  /**
   * 记录页面导航
   */
  trackNavigate(from: string, to: string): void {
    this.track('navigate', { from, to });
  }

  /**
   * 立即发送队列中的所有事件
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const events = [...this.queue];
    this.queue = [];

    if (!this.config.endpoint) {
      // 如果没有配置端点，只在开发环境打印
      if (import.meta.env.DEV) {
        console.log('[Metrics] Would send events:', events);
      }
      return;
    }

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.userId,
          events,
        }),
      });
    } catch (error) {
      console.error('[Metrics] Failed to send events:', error);
      // 失败的事件不重新加入队列，避免无限增长
    }
  }

  /**
   * 启用/禁用 metrics 收集
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (enabled) {
      this.startFlushInterval();
    } else {
      this.stopFlushInterval();
      this.queue = []; // 清空队列
    }
  }

  /**
   * 设置匿名化选项
   */
  setAnonymize(anonymize: boolean): void {
    this.config.anonymize = anonymize;
  }

  /**
   * 哈希用户 ID
   */
  private hashUserId(userId: string): string {
    // 简单的哈希函数（生产环境应使用更强的算法）
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `anon_${Math.abs(hash).toString(36)}`;
  }

  /**
   * 清理元数据中的敏感信息
   */
  private sanitizeMetadata(metadata: EventMetadata): EventMetadata {
    const sanitized: EventMetadata = { ...metadata };

    // 移除可能包含 PII 的字段
    const sensitiveKeys = ['email', 'phone', 'name', 'address', 'ip', 'userId', 'sessionId'];

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        delete sanitized[key];
      }
    }

    // 清理嵌套对象
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value as EventMetadata);
      }
    }

    return sanitized;
  }

  /**
   * 启动定期发送
   */
  private startFlushInterval(): void {
    if (this.flushInterval) {
      return;
    }

    // 每 30 秒发送一次
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);
  }

  /**
   * 停止定期发送
   */
  private stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stopFlushInterval();
    this.flush(); // 发送剩余事件
  }
}

export default new MetricsService();
