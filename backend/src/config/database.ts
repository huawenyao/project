/**
 * Database Configuration
 *
 * Sequelize ORM 配置和数据库连接初始化
 */

import { Sequelize } from 'sequelize-typescript';
import * as path from 'path';
import logger from '../utils/logger';
import * as models from '../models';

// 从环境变量获取数据库配置
const databaseUrl = process.env.DATABASE_URL || '';
const poolSize = parseInt(process.env.DATABASE_POOL_SIZE || '20', 10);

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

/**
 * Sequelize 实例
 * 配置了连接池、日志、时区等选项
 */
export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: (sql: string) => {
    // 在开发环境下记录 SQL 查询
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`SQL: ${sql}`);
    }
  },
  pool: {
    max: poolSize,
    min: 5,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    // SSL 配置（生产环境可能需要）
    ...(process.env.DATABASE_SSL === 'true' && {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }),
  },
  // 时区设置
  timezone: '+08:00',
  // 定义选项
  define: {
    // 使用下划线命名法（与数据库表结构一致）
    underscored: true,
    // 启用时间戳
    timestamps: true,
    // 字段名映射
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// 手动添加模型
sequelize.addModels(Object.values(models));

/**
 * 测试数据库连接
 */
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection has been established successfully.');
    return true;
  } catch (error: any) {
    logger.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
}

/**
 * 同步数据库模型
 * 注意：仅在开发环境使用，生产环境应使用迁移
 */
export async function syncDatabase(options: { force?: boolean; alter?: boolean } = {}): Promise<void> {
  try {
    await sequelize.sync(options);
    logger.info('✅ Database models synchronized successfully.');
  } catch (error: any) {
    logger.error('❌ Failed to sync database models:', error.message);
    throw error;
  }
}

/**
 * 关闭数据库连接
 */
export async function closeConnection(): Promise<void> {
  try {
    await sequelize.close();
    logger.info('Database connection closed.');
  } catch (error: any) {
    logger.error('Error closing database connection:', error.message);
    throw error;
  }
}

export default sequelize;
