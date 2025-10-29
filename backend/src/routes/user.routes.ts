import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * T019 [P] [US1]: 用户路由
 * /api/users - 用户管理相关API
 */

const router = Router();

// 所有用户路由都需要认证
router.use(authenticate);

/**
 * GET /api/users/:id
 * 获取用户信息
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await UserService.getUserById(id);

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
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user',
      message: '获取用户信息失败',
    });
  }
});

/**
 * PUT /api/users/:id
 * 更新用户信息（只能更新自己的信息）
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证用户只能更新自己的信息
    if (id !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权修改其他用户信息',
      });
      return;
    }

    const { fullName, avatarUrl, email } = req.body;

    const user = await UserService.updateUser(id, {
      fullName,
      avatarUrl,
      email,
    });

    res.status(200).json({
      success: true,
      data: { user },
      message: '更新用户信息成功',
    });
  } catch (error: any) {
    logger.error('Update user error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update user',
      message: error.message || '更新用户信息失败',
    });
  }
});

/**
 * DELETE /api/users/:id
 * 删除用户（软删除，只能删除自己）
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证用户只能删除自己
    if (id !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权删除其他用户',
      });
      return;
    }

    await UserService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: '删除用户成功',
    });
  } catch (error: any) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user',
      message: '删除用户失败',
    });
  }
});

/**
 * GET /api/users/:id/projects
 * 获取用户的项目列表
 */
router.get('/:id/projects', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { skip, take, status } = req.query;

    // 验证用户只能查看自己的项目
    if (id !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权查看其他用户的项目',
      });
      return;
    }

    const projects = await UserService.getUserProjects(id, {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
      status: status as string,
    });

    res.status(200).json({
      success: true,
      data: {
        projects,
        total: projects.length,
      },
      message: '获取项目列表成功',
    });
  } catch (error: any) {
    logger.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get projects',
      message: '获取项目列表失败',
    });
  }
});

/**
 * GET /api/users
 * 获取用户列表（管理功能，暂时允许所有认证用户访问）
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, status } = req.query;

    const users = await UserService.getUsers({
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
      status: status as string,
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        total: users.length,
      },
      message: '获取用户列表成功',
    });
  } catch (error: any) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get users',
      message: '获取用户列表失败',
    });
  }
});

/**
 * GET /api/users/count
 * 统计用户数量
 */
router.get('/stats/count', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const count = await UserService.countUsers(status as string);

    res.status(200).json({
      success: true,
      data: { count },
      message: '获取用户数量成功',
    });
  } catch (error: any) {
    logger.error('Count users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to count users',
      message: '获取用户数量失败',
    });
  }
});

export default router;
