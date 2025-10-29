/**
 * 统一的Express类型定义
 * 解决Request.user类型冲突问题
 */

declare namespace Express {
  export interface Request {
    /**
     * 认证用户信息
     * 通过auth middleware注入
     */
    user?: {
      userId: string;
      username: string;
      email: string;
    };
  }
}

export {};
