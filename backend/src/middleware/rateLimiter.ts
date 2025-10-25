import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';
import { rateLimitErrorHandler } from './errorHandler';

interface RateLimitConfig {
  keyPrefix: string;
  points: number;
  duration: number;
  blockDuration?: number;
  execEvenly?: boolean;
}

class RateLimiterService {
  private limiters: Map<string, RateLimiterRedis | RateLimiterMemory> = new Map();
  private dbService: DatabaseService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
    this.initializeLimiters();
  }

  private initializeLimiters(): void {
    const configs: Record<string, RateLimitConfig> = {
      // General API rate limiting
      general: {
        keyPrefix: 'general_rl',
        points: 100, // Number of requests
        duration: 60, // Per 60 seconds
        blockDuration: 60, // Block for 60 seconds if limit exceeded
        execEvenly: true
      },

      // Authentication endpoints
      auth: {
        keyPrefix: 'auth_rl',
        points: 5, // 5 attempts
        duration: 900, // Per 15 minutes
        blockDuration: 900 // Block for 15 minutes
      },

      // AI agent requests (more restrictive)
      agent: {
        keyPrefix: 'agent_rl',
        points: 10, // 10 requests
        duration: 60, // Per minute
        blockDuration: 120 // Block for 2 minutes
      },

      // File upload endpoints
      upload: {
        keyPrefix: 'upload_rl',
        points: 5, // 5 uploads
        duration: 300, // Per 5 minutes
        blockDuration: 300
      },

      // Webhook endpoints
      webhook: {
        keyPrefix: 'webhook_rl',
        points: 100, // 100 webhooks
        duration: 60, // Per minute
        blockDuration: 60
      },

      // Password reset attempts
      passwordReset: {
        keyPrefix: 'pwd_reset_rl',
        points: 3, // 3 attempts
        duration: 3600, // Per hour
        blockDuration: 3600
      }
    };

    Object.entries(configs).forEach(([name, config]) => {
      this.limiters.set(name, this.createLimiter(config));
    });

    logger.info('Rate limiters initialized', {
      limiters: Array.from(this.limiters.keys())
    });
  }

  private createLimiter(config: RateLimitConfig): RateLimiterRedis | RateLimiterMemory {
    const dbStatus = this.dbService.getConnectionStatus();
    
    if (dbStatus.redis) {
      // Use Redis-based rate limiter if Redis is available
      return new RateLimiterRedis({
        storeClient: this.dbService['redisClient'], // Access private property
        keyPrefix: config.keyPrefix,
        points: config.points,
        duration: config.duration,
        blockDuration: config.blockDuration,
        execEvenly: config.execEvenly || false
      });
    } else {
      // Fallback to memory-based rate limiter
      logger.warn(`Using memory-based rate limiter for ${config.keyPrefix} (Redis not available)`);
      return new RateLimiterMemory({
        keyPrefix: config.keyPrefix,
        points: config.points,
        duration: config.duration,
        blockDuration: config.blockDuration,
        execEvenly: config.execEvenly || false
      });
    }
  }

  public getLimiter(name: string): RateLimiterRedis | RateLimiterMemory | undefined {
    return this.limiters.get(name);
  }

  public async checkLimit(
    limiterName: string,
    key: string,
    points: number = 1
  ): Promise<{ allowed: boolean; remainingPoints?: number; msBeforeNext?: number }> {
    const limiter = this.getLimiter(limiterName);
    if (!limiter) {
      logger.warn(`Rate limiter '${limiterName}' not found`);
      return { allowed: true };
    }

    try {
      const result = await limiter.consume(key, points);
      return {
        allowed: true,
        remainingPoints: result.remainingPoints,
        msBeforeNext: result.msBeforeNext
      };
    } catch (rejRes: any) {
      return {
        allowed: false,
        remainingPoints: rejRes.remainingPoints || 0,
        msBeforeNext: rejRes.msBeforeNext || 0
      };
    }
  }

  public async resetLimit(limiterName: string, key: string): Promise<void> {
    const limiter = this.getLimiter(limiterName);
    if (limiter) {
      await limiter.delete(key);
    }
  }
}

// Singleton instance
const rateLimiterService = new RateLimiterService();

// Middleware factory
export const createRateLimitMiddleware = (
  limiterName: string,
  keyGenerator?: (req: Request) => string,
  points?: number
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown';
      const result = await rateLimiterService.checkLimit(limiterName, key, points);

      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          limiter: limiterName,
          key,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          remainingPoints: result.remainingPoints,
          msBeforeNext: result.msBeforeNext
        });

        // Add rate limit headers
        res.set({
          'Retry-After': Math.round((result.msBeforeNext || 0) / 1000) || 1,
          'X-RateLimit-Limit': 'Exceeded',
          'X-RateLimit-Remaining': result.remainingPoints?.toString() || '0',
          'X-RateLimit-Reset': new Date(Date.now() + (result.msBeforeNext || 0)).toISOString()
        });

        throw rateLimitErrorHandler();
      }

      // Add rate limit info to headers
      res.set({
        'X-RateLimit-Remaining': result.remainingPoints?.toString() || 'Unknown',
        'X-RateLimit-Reset': new Date(Date.now() + (result.msBeforeNext || 0)).toISOString()
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Pre-configured middleware
export const generalRateLimit = createRateLimitMiddleware('general');

export const authRateLimit = createRateLimitMiddleware(
  'auth',
  (req: Request) => `${req.ip}_${req.body?.email || req.body?.username || 'unknown'}`
);

export const agentRateLimit = createRateLimitMiddleware(
  'agent',
  (req: Request) => `${req.ip}_${req.user?.id || 'anonymous'}`
);

export const uploadRateLimit = createRateLimitMiddleware(
  'upload',
  (req: Request) => `${req.ip}_${req.user?.id || 'anonymous'}`
);

export const webhookRateLimit = createRateLimitMiddleware(
  'webhook',
  (req: Request) => req.ip || 'unknown'
);

export const passwordResetRateLimit = createRateLimitMiddleware(
  'passwordReset',
  (req: Request) => `${req.ip}_${req.body?.email || 'unknown'}`
);

// User-specific rate limiting
export const userRateLimit = (points: number = 50, duration: number = 60) => {
  return createRateLimitMiddleware(
    'general',
    (req: Request) => `user_${req.user?.id || req.ip}`,
    points
  );
};

// API key rate limiting
export const apiKeyRateLimit = (points: number = 1000, duration: number = 3600) => {
  return createRateLimitMiddleware(
    'general',
    (req: Request) => `api_key_${req.headers['x-api-key'] || req.ip}`,
    points
  );
};

// Adaptive rate limiting based on user tier
export const adaptiveRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userTier = req.user?.tier || 'free';
    const limits = {
      free: { points: 10, duration: 60 },
      pro: { points: 100, duration: 60 },
      enterprise: { points: 1000, duration: 60 }
    };

    const limit = limits[userTier as keyof typeof limits] || limits.free;
    const key = `adaptive_${req.user?.id || req.ip}`;
    
    const result = await rateLimiterService.checkLimit('general', key, 1);

    if (!result.allowed) {
      res.set({
        'Retry-After': Math.round((result.msBeforeNext || 0) / 1000) || 1,
        'X-RateLimit-Limit': limit.points.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + (result.msBeforeNext || 0)).toISOString()
      });

      throw rateLimitErrorHandler();
    }

    res.set({
      'X-RateLimit-Limit': limit.points.toString(),
      'X-RateLimit-Remaining': result.remainingPoints?.toString() || 'Unknown'
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Export the service for manual rate limit checks
export { rateLimiterService };

// Default export
export const rateLimiter = generalRateLimit;