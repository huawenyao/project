/**
 * WebSocket Authentication Middleware
 *
 * WebSocket 连接认证中间件 - 验证 JWT token
 */

import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import logger from '../../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * WebSocket 认证中间件
 */
export function authenticationMiddleware(socket: Socket, next: (err?: Error) => void): void {
  try {
    // 从握手中获取 token
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      logger.warn(`WebSocket connection rejected: No token provided (socket: ${socket.id})`);
      return next(new Error('Authentication required'));
    }

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (!decoded.userId) {
      logger.warn(`WebSocket connection rejected: Invalid token payload (socket: ${socket.id})`);
      return next(new Error('Invalid token'));
    }

    // 将用户信息附加到 socket
    socket.data.userId = decoded.userId;
    socket.data.email = decoded.email;
    socket.data.role = decoded.role;

    logger.info(`WebSocket authenticated: user ${decoded.userId} (socket: ${socket.id})`);

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logger.warn(`WebSocket connection rejected: Token expired (socket: ${socket.id})`);
      return next(new Error('Token expired'));
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warn(`WebSocket connection rejected: Invalid token (socket: ${socket.id})`);
      return next(new Error('Invalid token'));
    }

    logger.error(`WebSocket authentication error (socket: ${socket.id}):`, error);
    return next(new Error('Authentication failed'));
  }
}

/**
 * 可选认证中间件（允许匿名连接，但如果提供 token 则验证）
 */
export function optionalAuthenticationMiddleware(socket: Socket, next: (err?: Error) => void): void {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      // 没有 token，允许匿名连接
      socket.data.userId = null;
      socket.data.isAnonymous = true;
      logger.info(`WebSocket connected anonymously (socket: ${socket.id})`);
      return next();
    }

    // 有 token，进行验证
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    socket.data.userId = decoded.userId;
    socket.data.email = decoded.email;
    socket.data.role = decoded.role;
    socket.data.isAnonymous = false;

    logger.info(`WebSocket authenticated: user ${decoded.userId} (socket: ${socket.id})`);

    next();
  } catch (error: any) {
    // Token 无效，但允许匿名连接
    socket.data.userId = null;
    socket.data.isAnonymous = true;
    logger.warn(`WebSocket connected with invalid token, allowing anonymous (socket: ${socket.id})`);
    next();
  }
}

/**
 * 检查 socket 是否已认证
 */
export function isAuthenticated(socket: Socket): boolean {
  return !!socket.data.userId;
}

/**
 * 获取当前用户 ID
 */
export function getUserId(socket: Socket): string | null {
  return socket.data.userId || null;
}

/**
 * 检查用户是否有特定角色
 */
export function hasRole(socket: Socket, role: string): boolean {
  return socket.data.role === role;
}

/**
 * 管理员权限检查中间件
 */
export function requireAdmin(socket: Socket, next: (err?: Error) => void): void {
  if (!isAuthenticated(socket)) {
    return next(new Error('Authentication required'));
  }

  if (!hasRole(socket, 'admin')) {
    logger.warn(`WebSocket access denied: User ${socket.data.userId} is not admin (socket: ${socket.id})`);
    return next(new Error('Admin access required'));
  }

  next();
}
