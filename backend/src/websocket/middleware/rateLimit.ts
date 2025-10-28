/**
 * WebSocket Rate Limiting Middleware
 *
 * WebSocket 速率限制中间件 - 防止滥用
 */

import { Socket } from 'socket.io';
import logger from '../../utils/logger';

interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class WebSocketRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }) {
    this.config = config;

    // 定期清理过期的限流记录
    setInterval(() => {
      this.cleanup();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 检查是否超出速率限制
   */
  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // 创建新的限流记录
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      // 超出限制
      logger.warn(`Rate limit exceeded for ${identifier}`);
      return false;
    }

    // 增加计数
    entry.count++;
    return true;
  }

  /**
   * 清理过期的限流记录
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [identifier, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(identifier);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * 重置特定标识符的限流
   */
  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  /**
   * 获取剩余请求数
   */
  getRemaining(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.config.maxRequests;
    }
    return Math.max(0, this.config.maxRequests - entry.count);
  }
}

// 创建不同类型的限流器
const connectionLimiter = new WebSocketRateLimiter({
  windowMs: 60000, // 1 分钟
  maxRequests: 10, // 最多 10 次连接
});

const messageLimiter = new WebSocketRateLimiter({
  windowMs: 1000, // 1 秒
  maxRequests: 20, // 最多 20 条消息
});

const subscriptionLimiter = new WebSocketRateLimiter({
  windowMs: 60000, // 1 分钟
  maxRequests: 50, // 最多 50 次订阅操作
});

/**
 * 连接速率限制中间件
 */
export function connectionRateLimitMiddleware(socket: Socket, next: (err?: Error) => void): void {
  try {
    // 使用 IP 地址作为标识符
    const identifier = socket.handshake.address;

    if (!connectionLimiter.checkLimit(identifier)) {
      logger.warn(`Connection rate limit exceeded for ${identifier} (socket: ${socket.id})`);
      return next(new Error('Too many connection attempts'));
    }

    next();
  } catch (error: any) {
    logger.error('Connection rate limit error:', error);
    next(error);
  }
}

/**
 * 消息速率限制包装器
 */
export function messageRateLimitWrapper(handler: (data: any) => void | Promise<void>) {
  return async function (this: Socket, data: any) {
    const socket = this;
    const identifier = socket.data.userId || socket.handshake.address;

    if (!messageLimiter.checkLimit(identifier)) {
      socket.emit('rate_limit_error', {
        message: 'Too many requests',
        retryAfter: 1000,
      });
      return;
    }

    try {
      await handler.call(socket, data);
    } catch (error: any) {
      logger.error('Handler error:', error);
      socket.emit('error', { message: 'Internal server error' });
    }
  };
}

/**
 * 订阅速率限制包装器
 */
export function subscriptionRateLimitWrapper(handler: (data: any) => void | Promise<void>) {
  return async function (this: Socket, data: any) {
    const socket = this;
    const identifier = socket.data.userId || socket.handshake.address;

    if (!subscriptionLimiter.checkLimit(identifier)) {
      socket.emit('rate_limit_error', {
        message: 'Too many subscription requests',
        retryAfter: 60000,
      });
      return;
    }

    try {
      await handler.call(socket, data);
    } catch (error: any) {
      logger.error('Subscription handler error:', error);
      socket.emit('error', { message: 'Internal server error' });
    }
  };
}

/**
 * 获取限流统计信息
 */
export function getRateLimitStats() {
  return {
    connection: {
      active: connectionLimiter['limits'].size,
    },
    message: {
      active: messageLimiter['limits'].size,
    },
    subscription: {
      active: subscriptionLimiter['limits'].size,
    },
  };
}

/**
 * 重置用户的速率限制
 */
export function resetUserRateLimit(userId: string): void {
  messageLimiter.reset(userId);
  subscriptionLimiter.reset(userId);
}

export {
  connectionLimiter,
  messageLimiter,
  subscriptionLimiter,
};
