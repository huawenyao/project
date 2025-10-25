import { Pool, PoolClient } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService;
  private pgPool: Pool | null = null;
  private redisClient: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    try {
      // Skip database connections for demo mode
      this.isConnected = true;
      logger.info('Running in demo mode - database connections skipped');
    } catch (error) {
      logger.error('Failed to connect to database services:', error);
      throw error;
    }
  }

  private async connectPostgreSQL(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      logger.warn('DATABASE_URL not provided, skipping PostgreSQL connection');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test the connection
      const client = await this.pgPool.connect();
      await client.query('SELECT NOW()');
      client.release();

      logger.info('PostgreSQL connected successfully');
    } catch (error) {
      logger.error('PostgreSQL connection failed:', error);
      throw error;
    }
  }

  private async connectRedis(): Promise<void> {
    if (!process.env.REDIS_URL) {
      logger.warn('REDIS_URL not provided, skipping Redis connection');
      return;
    }

    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis client error:', err);
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      this.redisClient.on('disconnect', () => {
        logger.warn('Redis disconnected');
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.pgPool) {
        await this.pgPool.end();
        this.pgPool = null;
        logger.info('PostgreSQL disconnected');
      }

      if (this.redisClient) {
        await this.redisClient.disconnect();
        this.redisClient = null;
        logger.info('Redis disconnected');
      }

      this.isConnected = false;
      logger.info('Database services disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database services:', error);
      throw error;
    }
  }

  // PostgreSQL methods
  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not connected');
    }

    const start = Date.now();
    try {
      const result = await this.pgPool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Database query executed', {
        query: text,
        duration: `${duration}ms`,
        rows: result.rowCount
      });

      return result;
    } catch (error) {
      logger.error('Database query failed:', {
        query: text,
        params,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not connected');
    }
    return await this.pgPool.connect();
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Redis methods
  public async get(key: string): Promise<string | null> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    return await this.redisClient.get(key);
  }

  public async set(key: string, value: string, options?: { EX?: number; PX?: number }): Promise<void> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    if (options) {
      await this.redisClient.set(key, value, options);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  public async del(key: string): Promise<number> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    return await this.redisClient.del(key);
  }

  public async exists(key: string): Promise<number> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    return await this.redisClient.exists(key);
  }

  public async hget(key: string, field: string): Promise<string | undefined> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    return await this.redisClient.hGet(key, field);
  }

  public async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    return await this.redisClient.hSet(key, field, value);
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    return await this.redisClient.hGetAll(key);
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    return await this.redisClient.expire(key, seconds);
  }

  public async keys(pattern: string): Promise<string[]> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    return await this.redisClient.keys(pattern);
  }

  // Cache helper methods
  public async cache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    try {
      const cached = await this.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache read failed, fetching fresh data:', error);
    }

    const data = await fetcher();
    
    try {
      await this.set(key, JSON.stringify(data), { EX: ttl });
    } catch (error) {
      logger.warn('Cache write failed:', error);
    }

    return data;
  }

  public async invalidateCache(pattern: string): Promise<void> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.del(key)));
        logger.info(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error('Cache invalidation failed:', error);
    }
  }

  // Health check methods
  public async healthCheck(): Promise<{
    postgresql: boolean;
    redis: boolean;
    overall: boolean;
  }> {
    const health = {
      postgresql: false,
      redis: false,
      overall: false
    };

    // Check PostgreSQL
    try {
      if (this.pgPool) {
        await this.query('SELECT 1');
        health.postgresql = true;
      }
    } catch (error) {
      logger.error('PostgreSQL health check failed:', error);
    }

    // Check Redis
    try {
      if (this.redisClient) {
        await this.redisClient.ping();
        health.redis = true;
      }
    } catch (error) {
      logger.error('Redis health check failed:', error);
    }

    health.overall = health.postgresql || health.redis;
    return health;
  }

  public isHealthy(): boolean {
    return this.isConnected;
  }

  public getConnectionStatus(): {
    postgresql: boolean;
    redis: boolean;
    connected: boolean;
  } {
    return {
      postgresql: !!this.pgPool,
      redis: !!this.redisClient,
      connected: this.isConnected
    };
  }
}