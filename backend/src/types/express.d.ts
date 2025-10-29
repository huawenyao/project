/**
 * 此文件已废弃
 * 请使用 src/@types/express.d.ts 中的统一类型定义
 *
 * 为保持向后兼容，暂时保留此文件
 */

declare global {
  namespace Express {
    interface Request {
      /**
       * 认证用户信息
       * 统一格式 - 所有新代码应使用此格式
       */
      user?: {
        userId: string;    // 主要用户ID
        username: string;  // 用户名
        email: string;     // 邮箱
        // 向后兼容字段（废弃）
        id?: string;       // 废弃：使用 userId
        tier?: string;     // 废弃：使用 subscription
        role?: string;     // 废弃：待实现角色系统
      };
    }
  }
}

export {};