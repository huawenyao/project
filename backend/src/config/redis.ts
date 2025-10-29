import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// 加载环境变量
dotenv.config();

/**
 * Redis配置
 * T006 [P]: 配置Redis连接池
 */

// Redis客户端实例
let redisClient: RedisClientType | null = null;

/**
 * Redis连接配置
 */
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logger.error('Redis重连次数超过限制，停止重连');
        return new Error('Redis重连失败');
      }
      // 指数退避重连策略: 100ms, 200ms, 400ms, 800ms, ...
      const delay = Math.min(retries * 100, 3000);
      logger.info(`Redis重连中... (第${retries}次，${delay}ms后重试)`);
      return delay;
    },
    connectTimeout: 10000, // 10秒连接超时
  },
};

/**
 * 获取Redis客户端实例
 * 单例模式，确保全局只有一个连接
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    logger.info('正在初始化Redis连接...');

    redisClient = createClient(redisConfig);

    // 错误处理
    redisClient.on('error', (err) => {
      logger.error('Redis客户端错误:', err);
    });

    // 连接事件
    redisClient.on('connect', () => {
      logger.info('Redis连接已建立');
    });

    redisClient.on('ready', () => {
      logger.info('Redis客户端就绪');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis正在重连...');
    });

    redisClient.on('end', () => {
      logger.info('Redis连接已关闭');
    });

    // 连接到Redis
    await redisClient.connect();

    logger.info('✅ Redis连接成功');
    return redisClient;
  } catch (error: any) {
    logger.error('❌ Redis连接失败:', error.message);
    throw error;
  }
}

/**
 * 测试Redis连接
 * 用于健康检查和验证连接配置
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = await getRedisClient();

    // 执行PING命令测试连接
    const pong = await client.ping();

    if (pong === 'PONG') {
      logger.info('✅ Redis连接测试成功');

      // 测试SET/GET操作
      const testKey = 'connection_test';
      const testValue = `test_${Date.now()}`;

      await client.set(testKey, testValue, { EX: 10 }); // 10秒后过期
      const retrievedValue = await client.get(testKey);

      if (retrievedValue === testValue) {
        logger.info('✅ Redis SET/GET操作测试成功');
        await client.del(testKey); // 清理测试数据
        return true;
      } else {
        logger.error('❌ Redis SET/GET操作测试失败');
        return false;
      }
    }

    return false;
  } catch (error: any) {
    logger.error('❌ Redis连接测试失败:', error.message);
    return false;
  }
}

/**
 * 关闭Redis连接
 * 用于优雅关闭应用程序
 */
export async function closeRedisConnection(): Promise<void> {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis连接已关闭');
    }
  } catch (error: any) {
    logger.error('关闭Redis连接时出错:', error.message);
  }
}

/**
 * Redis缓存辅助函数
 */
export class RedisCache {
  /**
   * 设置缓存（带过期时间）
   */
  static async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    const client = await getRedisClient();
    if (expirySeconds) {
      await client.set(key, value, { EX: expirySeconds });
    } else {
      await client.set(key, value);
    }
  }

  /**
   * 获取缓存
   */
  static async get(key: string): Promise<string | null> {
    const client = await getRedisClient();
    return await client.get(key);
  }

  /**
   * 设置JSON对象缓存
   */
  static async setJSON(key: string, value: any, expirySeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), expirySeconds);
  }

  /**
   * 获取JSON对象缓存
   */
  static async getJSON(key: string): Promise<any | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  /**
   * 删除缓存
   */
  static async del(key: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(key);
  }

  /**
   * 检查key是否存在
   */
  static async exists(key: string): Promise<boolean> {
    const client = await getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  }

  /**
   * 设置过期时间
   */
  static async expire(key: string, seconds: number): Promise<void> {
    const client = await getRedisClient();
    await client.expire(key, seconds);
  }

  /**
   * 获取剩余TTL
   */
  static async ttl(key: string): Promise<number> {
    const client = await getRedisClient();
    return await client.ttl(key);
  }
}

// 导出默认客户端获取函数
export default getRedisClient;
