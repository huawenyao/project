/**
 * T157: Performance Monitor Utility
 *
 * Phase 12 - Performance Optimization
 *
 * 功能：
 * - FPS (帧率) 监控
 * - 内存使用监控
 * - 渲染时间监控
 * - 性能警告和日志
 */

export interface PerformanceMetrics {
  fps: number;
  memoryUsage?: number; // MB
  renderTime: number; // ms
  timestamp: Date;
}

export class PerformanceMonitor {
  private fpsHistory: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private rafId: number | null = null;
  private isMonitoring: boolean = false;
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  private readonly TARGET_FPS = 30;
  private readonly WARNING_FPS = 20;
  private readonly HISTORY_SIZE = 60; // 保留最近 60 帧

  /**
   * 开始监控
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.measureFrame();

    console.log('[PerformanceMonitor] Started monitoring');
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    console.log('[PerformanceMonitor] Stopped monitoring');
  }

  /**
   * 测量帧率
   */
  private measureFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      this.fpsHistory.push(fps);

      // 保持历史记录大小
      if (this.fpsHistory.length > this.HISTORY_SIZE) {
        this.fpsHistory.shift();
      }

      this.frameCount++;

      // 每 30 帧报告一次指标
      if (this.frameCount % 30 === 0) {
        this.reportMetrics();
      }
    }

    this.lastFrameTime = currentTime;
    this.rafId = requestAnimationFrame(this.measureFrame);
  };

  /**
   * 报告性能指标
   */
  private reportMetrics(): void {
    const averageFps = this.getAverageFPS();
    const memoryUsage = this.getMemoryUsage();
    const renderTime = averageFps > 0 ? 1000 / averageFps : 0;

    const metrics: PerformanceMetrics = {
      fps: averageFps,
      memoryUsage,
      renderTime,
      timestamp: new Date(),
    };

    // 通知监听器
    this.listeners.forEach((listener) => {
      try {
        listener(metrics);
      } catch (error) {
        console.error('[PerformanceMonitor] Listener error:', error);
      }
    });

    // 性能警告
    if (averageFps < this.WARNING_FPS) {
      console.warn(
        `[PerformanceMonitor] Low FPS detected: ${averageFps.toFixed(1)} fps (target: ${this.TARGET_FPS} fps)`
      );
    }
  }

  /**
   * 获取平均 FPS
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;

    const sum = this.fpsHistory.reduce((acc, fps) => acc + fps, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * 获取当前 FPS
   */
  getCurrentFPS(): number {
    return this.fpsHistory[this.fpsHistory.length - 1] || 0;
  }

  /**
   * 获取最小 FPS
   */
  getMinFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return Math.min(...this.fpsHistory);
  }

  /**
   * 获取最大 FPS
   */
  getMaxFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return Math.max(...this.fpsHistory);
  }

  /**
   * 获取内存使用情况 (MB)
   */
  getMemoryUsage(): number | undefined {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // 转换为 MB
    }
    return undefined;
  }

  /**
   * 检查性能是否良好
   */
  isPerformanceGood(): boolean {
    const avgFps = this.getAverageFPS();
    return avgFps >= this.TARGET_FPS;
  }

  /**
   * 获取性能摘要
   */
  getSummary(): {
    average: number;
    current: number;
    min: number;
    max: number;
    memoryUsage?: number;
    isGood: boolean;
  } {
    return {
      average: this.getAverageFPS(),
      current: this.getCurrentFPS(),
      min: this.getMinFPS(),
      max: this.getMaxFPS(),
      memoryUsage: this.getMemoryUsage(),
      isGood: this.isPerformanceGood(),
    };
  }

  /**
   * 添加指标监听器
   */
  addListener(listener: (metrics: PerformanceMetrics) => void): void {
    this.listeners.add(listener);
  }

  /**
   * 移除指标监听器
   */
  removeListener(listener: (metrics: PerformanceMetrics) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * 清除历史数据
   */
  clearHistory(): void {
    this.fpsHistory = [];
    this.frameCount = 0;
  }

  /**
   * 标记渲染开始
   */
  markRenderStart(label: string): void {
    performance.mark(`render-start-${label}`);
  }

  /**
   * 标记渲染结束并测量时间
   */
  markRenderEnd(label: string): number {
    performance.mark(`render-end-${label}`);
    performance.measure(`render-${label}`, `render-start-${label}`, `render-end-${label}`);

    const measure = performance.getEntriesByName(`render-${label}`)[0];
    const duration = measure?.duration || 0;

    // 清理标记
    performance.clearMarks(`render-start-${label}`);
    performance.clearMarks(`render-end-${label}`);
    performance.clearMeasures(`render-${label}`);

    return duration;
  }
}

// 单例实例
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

/**
 * React Hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    const listener = (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);
    };

    performanceMonitor.addListener(listener);
    performanceMonitor.start();

    return () => {
      performanceMonitor.removeListener(listener);
      performanceMonitor.stop();
    };
  }, []);

  return metrics;
}

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).__performanceMonitor = performanceMonitor;
}
