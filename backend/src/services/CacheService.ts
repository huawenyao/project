/**
 * Cache Service
 *
 * Phase 9 - T098: AI 响应缓存
 *
 * 使用 Redis 缓存 AI 响应，相同需求复用结果
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class CacheService {
  private static instance: CacheService;
  private client: RedisClientType | null = null;
  private connected: boolean = false;

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * 连接到 Redis
   */
  async connect(): Promise<void> {
    if (this.connected && this.client) {
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.client.on('error', (err) => {
        logger.error('[CacheService] Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        logger.info('[CacheService] Connected to Redis');
      });

      await this.client.connect();
      this.connected = true;
    } catch (error: any) {
      logger.error('[CacheService] Failed to connect to Redis:', error);
      this.client = null;
      this.connected = false;
    }
  }

  /**
   * 断开 Redis 连接
   */
  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
      this.client = null;
      logger.info('[CacheService] Disconnected from Redis');
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(prefix: string, data: any): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * 获取缓存的 AI 响应
   */
  async getAIResponse(params: {
    provider: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
  }): Promise<string | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    try {
      const key = this.generateCacheKey('ai-response', params);
      const cached = await this.client.get(key);

      if (cached) {
        logger.info(`[CacheService] AI response cache hit for key: ${key.substring(0, 20)}...`);
        return cached;
      }

      return null;
    } catch (error: any) {
      logger.error('[CacheService] Error getting AI response from cache:', error);
      return null;
    }
  }

  /**
   * 缓存 AI 响应
   */
  async setAIResponse(
    params: {
      provider: string;
      model: string;
      prompt: string;
      systemPrompt?: string;
      temperature?: number;
    },
    response: string,
    ttlSeconds: number = 3600 // 默认 1 小时
  ): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const key = this.generateCacheKey('ai-response', params);
      await this.client.setEx(key, ttlSeconds, response);
      logger.info(`[CacheService] AI response cached for ${ttlSeconds}s`);
    } catch (error: any) {
      logger.error('[CacheService] Error caching AI response:', error);
    }
  }

  /**
   * 获取缓存数据（通用）
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    try {
      const cached = await this.client.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
      return null;
    } catch (error: any) {
      logger.error(`[CacheService] Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置缓存数据（通用）
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error: any) {
      logger.error(`[CacheService] Error setting cache for key ${key}:`, error);
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error: any) {
      logger.error(`[CacheService] Error deleting cache for key ${key}:`, error);
    }
  }

  /**
   * 删除匹配模式的所有缓存
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info(`[CacheService] Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error: any) {
      logger.error(`[CacheService] Error deleting pattern ${pattern}:`, error);
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error(`[CacheService] Error checking existence for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 获取缓存过期时间（秒）
   */
  async getTTL(key: string): Promise<number> {
    if (!this.client || !this.connected) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error: any) {
      logger.error(`[CacheService] Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * 获取缓存统计
   */
  async getStats(): Promise<{
    connected: boolean;
    keys: number;
    memory: string;
  }> {
    if (!this.client || !this.connected) {
      return {
        connected: false,
        keys: 0,
        memory: '0',
      };
    }

    try {
      const info = await this.client.info('memory');
      const keys = await this.client.dbSize();

      // 解析内存使用
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : '0';

      return {
        connected: true,
        keys,
        memory,
      };
    } catch (error: any) {
      logger.error('[CacheService] Error getting stats:', error);
      return {
        connected: false,
        keys: 0,
        memory: '0',
      };
    }
  }

  /**
   * 清空所有缓存
   */
  async flush(): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      await this.client.flushDb();
      logger.info('[CacheService] Cache flushed');
    } catch (error: any) {
      logger.error('[CacheService] Error flushing cache:', error);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error: any) {
      logger.error('[CacheService] Health check failed:', error);
      return false;
    }
  }
}

export default CacheService.getInstance();
