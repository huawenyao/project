import { PrismaClient, User, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * T008 [P] [US1]: User数据模型
 * 提供用户相关的数据访问操作
 */

const prisma = new PrismaClient();

export class UserModel {
  /**
   * 创建新用户
   */
  static async create(data: {
    username: string;
    email: string;
    passwordHash: string;
    fullName?: string;
    avatarUrl?: string;
  }): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl,
          status: 'active',
          lastLoginAt: new Date(),
        },
      });

      logger.info(`User created: ${user.id} (${user.username})`);
      return user;
    } catch (error: any) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找用户
   */
  static async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error: any) {
      logger.error(`Failed to find user by id ${id}:`, error);
      throw error;
    }
  }

  /**
   * 根据用户名查找用户
   */
  static async findByUsername(username: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { username },
      });
    } catch (error: any) {
      logger.error(`Failed to find user by username ${username}:`, error);
      throw error;
    }
  }

  /**
   * 根据邮箱查找用户
   */
  static async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error: any) {
      logger.error(`Failed to find user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  static async update(
    id: string,
    data: Partial<{
      username: string;
      email: string;
      passwordHash: string;
      fullName: string;
      avatarUrl: string;
      status: string;
      lastLoginAt: Date;
    }>
  ): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
      });

      logger.info(`User updated: ${user.id}`);
      return user;
    } catch (error: any) {
      logger.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  }

  /**
   * 更新最后登录时间
   */
  static async updateLastLogin(id: string): Promise<User> {
    try {
      return await this.update(id, {
        lastLoginAt: new Date(),
      });
    } catch (error: any) {
      logger.error(`Failed to update last login for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * 删除用户（软删除，更新状态为deleted）
   */
  static async softDelete(id: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { status: 'deleted' },
      });

      logger.info(`User soft deleted: ${user.id}`);
      return user;
    } catch (error: any) {
      logger.error(`Failed to soft delete user ${id}:`, error);
      throw error;
    }
  }

  /**
   * 硬删除用户（永久删除）
   */
  static async hardDelete(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });

      logger.info(`User hard deleted: ${id}`);
    } catch (error: any) {
      logger.error(`Failed to hard delete user ${id}:`, error);
      throw error;
    }
  }

  /**
   * 获取用户列表（分页）
   */
  static async findMany(options: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  } = {}): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        skip: options.skip,
        take: options.take,
        where: options.where,
        orderBy: options.orderBy,
      });
    } catch (error: any) {
      logger.error('Failed to find users:', error);
      throw error;
    }
  }

  /**
   * 统计用户数量
   */
  static async count(where?: Prisma.UserWhereInput): Promise<number> {
    try {
      return await prisma.user.count({ where });
    } catch (error: any) {
      logger.error('Failed to count users:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有项目
   */
  static async getProjects(userId: string, options: {
    skip?: number;
    take?: number;
    where?: Prisma.ProjectWhereInput;
  } = {}) {
    try {
      return await prisma.project.findMany({
        where: {
          userId,
          ...options.where,
        },
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error(`Failed to get projects for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 检查用户名是否已存在
   */
  static async usernameExists(username: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      return !!user;
    } catch (error: any) {
      logger.error('Failed to check username existence:', error);
      throw error;
    }
  }

  /**
   * 检查邮箱是否已存在
   */
  static async emailExists(email: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      return !!user;
    } catch (error: any) {
      logger.error('Failed to check email existence:', error);
      throw error;
    }
  }
}

export default UserModel;
