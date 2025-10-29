import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import UserModel from '../models/User';
import { logger } from '../utils/logger';

/**
 * T013 [P] [US1]: UserService
 * 提供用户相关的业务逻辑，包括认证、授权、用户管理
 */

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

export class UserService {
  /**
   * 用户注册
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // 1. 验证输入
      this.validateRegisterData(data);

      // 2. 检查用户名是否已存在
      const usernameExists = await UserModel.usernameExists(data.username);
      if (usernameExists) {
        throw new Error('用户名已被使用');
      }

      // 3. 检查邮箱是否已存在
      const emailExists = await UserModel.emailExists(data.email);
      if (emailExists) {
        throw new Error('邮箱已被使用');
      }

      // 4. 加密密码
      const passwordHash = await this.hashPassword(data.password);

      // 5. 创建用户
      const user = await UserModel.create({
        username: data.username,
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
      });

      // 6. 生成JWT token
      const token = this.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
      });

      logger.info(`User registered: ${user.username} (${user.id})`);

      // 7. 返回用户信息和token（不包含密码哈希）
      return {
        user: this.sanitizeUser(user),
        token,
      };
    } catch (error: any) {
      logger.error('User registration failed:', error);
      throw error;
    }
  }

  /**
   * 用户登录
   */
  static async login(data: LoginData): Promise<AuthResponse> {
    try {
      // 1. 查找用户（支持用户名或邮箱登录）
      let user: User | null = null;

      if (data.usernameOrEmail.includes('@')) {
        user = await UserModel.findByEmail(data.usernameOrEmail);
      } else {
        user = await UserModel.findByUsername(data.usernameOrEmail);
      }

      if (!user) {
        throw new Error('用户名或密码错误');
      }

      // 2. 验证密码
      const isPasswordValid = await this.verifyPassword(data.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('用户名或密码错误');
      }

      // 3. 检查用户状态
      if (user.status !== 'active') {
        throw new Error('用户账号已被禁用');
      }

      // 4. 更新最后登录时间
      await UserModel.updateLastLogin(user.id);

      // 5. 生成JWT token
      const token = this.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
      });

      logger.info(`User logged in: ${user.username} (${user.id})`);

      return {
        user: this.sanitizeUser(user),
        token,
      };
    } catch (error: any) {
      logger.error('User login failed:', error);
      throw error;
    }
  }

  /**
   * 验证JWT token
   */
  static async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error: any) {
      logger.error('Token verification failed:', error);
      throw new Error('无效的token');
    }
  }

  /**
   * 根据token获取用户信息
   */
  static async getUserByToken(token: string): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const payload = await this.verifyToken(token);
      const user = await UserModel.findById(payload.userId);

      if (!user || user.status !== 'active') {
        return null;
      }

      return this.sanitizeUser(user);
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const user = await UserModel.findById(userId);
      return user ? this.sanitizeUser(user) : null;
    } catch (error: any) {
      logger.error(`Failed to get user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUser(
    userId: string,
    data: {
      fullName?: string;
      avatarUrl?: string;
      email?: string;
    }
  ): Promise<Omit<User, 'passwordHash'>> {
    try {
      // 如果更新邮箱，检查是否已被使用
      if (data.email) {
        const existingUser = await UserModel.findByEmail(data.email);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('邮箱已被使用');
        }
      }

      const user = await UserModel.update(userId, data);
      logger.info(`User updated: ${user.username} (${user.id})`);

      return this.sanitizeUser(user);
    } catch (error: any) {
      logger.error(`Failed to update user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // 1. 验证密码强度
      this.validatePassword(newPassword);

      // 2. 获取用户
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 3. 验证当前密码
      const isPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('当前密码错误');
      }

      // 4. 加密新密码
      const newPasswordHash = await this.hashPassword(newPassword);

      // 5. 更新密码
      await UserModel.update(userId, { passwordHash: newPasswordHash });

      logger.info(`Password changed for user: ${user.username} (${user.id})`);
    } catch (error: any) {
      logger.error(`Failed to change password for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 重置密码（管理员或忘记密码场景）
   */
  static async resetPassword(userId: string, newPassword: string): Promise<void> {
    try {
      // 1. 验证密码强度
      this.validatePassword(newPassword);

      // 2. 加密新密码
      const passwordHash = await this.hashPassword(newPassword);

      // 3. 更新密码
      await UserModel.update(userId, { passwordHash });

      logger.info(`Password reset for user: ${userId}`);
    } catch (error: any) {
      logger.error(`Failed to reset password for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 删除用户（软删除）
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      await UserModel.softDelete(userId);
      logger.info(`User soft deleted: ${userId}`);
    } catch (error: any) {
      logger.error(`Failed to delete user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 获取用户列表
   */
  static async getUsers(options: {
    skip?: number;
    take?: number;
    status?: string;
  } = {}): Promise<Omit<User, 'passwordHash'>[]> {
    try {
      const where: any = {};
      if (options.status) {
        where.status = options.status;
      }

      const users = await UserModel.findMany({
        skip: options.skip,
        take: options.take,
        where,
        orderBy: { createdAt: 'desc' },
      });

      return users.map(user => this.sanitizeUser(user));
    } catch (error: any) {
      logger.error('Failed to get users:', error);
      throw error;
    }
  }

  /**
   * 获取用户的项目列表
   */
  static async getUserProjects(
    userId: string,
    options: {
      skip?: number;
      take?: number;
      status?: string;
    } = {}
  ) {
    try {
      const where: any = {};
      if (options.status) {
        where.status = options.status;
      }

      return await UserModel.getProjects(userId, {
        skip: options.skip,
        take: options.take,
        where,
      });
    } catch (error: any) {
      logger.error(`Failed to get projects for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 统计用户数量
   */
  static async countUsers(status?: string): Promise<number> {
    try {
      const where: any = {};
      if (status) {
        where.status = status;
      }

      return await UserModel.count(where);
    } catch (error: any) {
      logger.error('Failed to count users:', error);
      throw error;
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 加密密码
   */
  private static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * 生成JWT token
   */
  private static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as string | number,
    } as jwt.SignOptions);
  }

  /**
   * 移除敏感信息（密码哈希）
   */
  private static sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * 验证注册数据
   */
  private static validateRegisterData(data: RegisterData): void {
    // 验证用户名
    if (!data.username || data.username.length < 3 || data.username.length > 50) {
      throw new Error('用户名长度必须在3-50个字符之间');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      throw new Error('用户名只能包含字母、数字、下划线和连字符');
    }

    // 验证邮箱
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('请输入有效的邮箱地址');
    }

    // 验证密码
    this.validatePassword(data.password);
  }

  /**
   * 验证密码强度
   */
  private static validatePassword(password: string): void {
    if (!password || password.length < 6) {
      throw new Error('密码长度至少为6个字符');
    }

    if (password.length > 100) {
      throw new Error('密码长度不能超过100个字符');
    }

    // 可以添加更多密码强度验证规则
    // 例如：必须包含大小写字母、数字、特殊字符等
  }

  /**
   * 验证邮箱格式
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default UserService;
