import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { logger } from '../utils/logger';

/**
 * 认证中间件
 * 验证JWT token并将用户信息附加到请求对象
 */

// 扩展Express Request类型以包含user属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        email: string;
      };
    }
  }
}

/**
 * 认证中间件 - 验证JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header provided',
        message: '未提供认证凭证',
      });
      return;
    }

    // 验证Bearer token格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization header format',
        message: '认证格式错误，应为: Bearer <token>',
      });
      return;
    }

    const token = parts[1];

    // 验证token
    try {
      const payload = await UserService.verifyToken(token);

      // 将用户信息附加到请求对象
      req.user = {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
      };

      next();
    } catch (error: any) {
      logger.warn('Token verification failed:', error.message);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Token无效或已过期',
      });
      return;
    }
  } catch (error: any) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: '认证失败',
    });
  }
};

/**
 * 可选认证中间件 - 如果提供了token则验证，否则继续
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // 没有token，继续执行
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // 格式错误，继续执行但不设置user
      next();
      return;
    }

    const token = parts[1];

    try {
      const payload = await UserService.verifyToken(token);
      req.user = {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
      };
    } catch (error) {
      // Token无效，继续执行但不设置user
      logger.debug('Optional authentication failed, continuing without user');
    }

    next();
  } catch (error: any) {
    logger.error('Optional authentication middleware error:', error);
    next(); // 出错时也继续执行
  }
};

/**
 * 验证用户是否有权限访问特定资源
 */
export const authorizeResource = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: '未认证',
        });
        return;
      }

      // 从请求体、查询参数或路由参数获取资源的userId
      const resourceUserId =
        req.body[resourceUserIdField] ||
        req.query[resourceUserIdField] ||
        req.params[resourceUserIdField];

      if (!resourceUserId) {
        // 如果没有指定资源userId，跳过检查
        next();
        return;
      }

      if (resourceUserId !== req.user.userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '无权访问此资源',
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error('Authorization middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization failed',
        message: '授权验证失败',
      });
    }
  };
};

export default { authenticate, optionalAuthenticate, authorizeResource };
