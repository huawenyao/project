import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * T018 [P] [US1]: 认证路由
 * /api/auth - 用户认证相关API
 */

const router = Router();

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, fullName, avatarUrl } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: '缺少必填字段：username, email, password',
      });
      return;
    }

    // 注册用户
    const result = await UserService.register({
      username,
      email,
      password,
      fullName,
      avatarUrl,
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
      message: '注册成功',
    });
  } catch (error: any) {
    logger.error('Register error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed',
      message: error.message || '注册失败',
    });
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body;

    // 验证必填字段
    if (!usernameOrEmail || !password) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: '缺少必填字段：usernameOrEmail, password',
      });
      return;
    }

    // 登录
    const result = await UserService.login({
      usernameOrEmail,
      password,
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
      message: '登录成功',
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed',
      message: error.message || '登录失败',
    });
  }
});

/**
 * POST /api/auth/verify
 * 验证token
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Missing token',
        message: '缺少token',
      });
      return;
    }

    // 验证token
    const payload = await UserService.verifyToken(token);

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        payload,
      },
      message: 'Token有效',
    });
  } catch (error: any) {
    logger.error('Verify token error:', error);
    res.status(401).json({
      success: false,
      data: {
        valid: false,
      },
      error: error.message || 'Invalid token',
      message: 'Token无效',
    });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息（需要认证）
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '未认证',
      });
      return;
    }

    // 获取完整用户信息
    const user = await UserService.getUserById(req.user.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: '用户不存在',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user },
      message: '获取用户信息成功',
    });
  } catch (error: any) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user',
      message: '获取用户信息失败',
    });
  }
});

/**
 * POST /api/auth/change-password
 * 修改密码（需要认证）
 */
router.post('/change-password', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '未认证',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // 验证必填字段
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: '缺少必填字段：currentPassword, newPassword',
      });
      return;
    }

    // 修改密码
    await UserService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error: any) {
    logger.error('Change password error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to change password',
      message: error.message || '密码修改失败',
    });
  }
});

/**
 * POST /api/auth/logout
 * 登出（客户端需要清除token）
 */
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // 实际的登出逻辑由客户端处理（清除token）
    // 这里只是一个占位端点，可以用于记录登出日志
    logger.info(`User logged out: ${req.user?.userId}`);

    res.status(200).json({
      success: true,
      message: '登出成功',
    });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Logout failed',
      message: '登出失败',
    });
  }
});

export default router;
