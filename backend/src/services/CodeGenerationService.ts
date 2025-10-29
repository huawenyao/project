/**
 * Code Generation Service
 *
 * Sprint 2 - US3: AI辅助可视化编辑
 * T053: 实现代码生成引擎
 */

import { AIService } from './AIService';
import { logger } from '../utils/logger';
import type { Component, DataModel, APIEndpoint } from '@prisma/client';

export interface GeneratedCode {
  language: string;
  framework: string;
  files: {
    path: string;
    content: string;
    description: string;
  }[];
}

export interface ComponentCode {
  componentName: string;
  tsx: string;
  css?: string;
  test?: string;
}

export interface APICode {
  route: string;
  controller: string;
  service: string;
  test: string;
}

class CodeGenerationService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * 生成React组件代码
   */
  async generateComponentCode(component: any): Promise<{
    success: boolean;
    data?: ComponentCode;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Generating component: ${component.name}`);

      const systemPrompt = `你是一个React开发专家。请根据组件定义生成高质量的React代码。

要求：
- 使用TypeScript
- 使用函数组件和Hooks
- 使用TailwindCSS进行样式
- 遵循最佳实践和代码规范
- 添加必要的类型定义和注释
`;

      const userPrompt = `组件定义：
名称: ${component.name}
类型: ${component.type}
属性: ${JSON.stringify(component.props, null, 2)}
样式: ${JSON.stringify(component.styles, null, 2)}
数据绑定: ${JSON.stringify(component.dataBinding, null, 2)}
事件: ${JSON.stringify(component.events, null, 2)}

请生成完整的TSX代码。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        userPrompt,
        temperature: 0.2,
        maxTokens: 2000,
      });

      if (!response || !response) {
        return {
          success: false,
          error: '代码生成失败',
        };
      }

      return {
        success: true,
        data: {
          componentName: component.name,
          tsx: response,
        },
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating component:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 生成API端点代码
   */
  async generateAPICode(endpoint: any): Promise<{
    success: boolean;
    data?: APICode;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Generating API: ${endpoint.method} ${endpoint.path}`);

      const systemPrompt = `你是一个Node.js后端开发专家。请根据API定义生成高质量的Express代码。

要求：
- 使用TypeScript
- 使用Express.js框架
- 包含输入验证
- 包含错误处理
- 遵循RESTful规范
- 添加必要的注释
`;

      const userPrompt = `API端点定义：
路径: ${endpoint.path}
方法: ${endpoint.method}
请求Schema: ${JSON.stringify(endpoint.requestSchema, null, 2)}
响应Schema: ${JSON.stringify(endpoint.responseSchema, null, 2)}
业务逻辑: ${endpoint.businessLogic || '基本CRUD操作'}

请生成完整的代码，包括路由、控制器和服务层。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        userPrompt,
        temperature: 0.2,
        maxTokens: 2000,
      });

      if (!response || !response) {
        return {
          success: false,
          error: '代码生成失败',
        };
      }

      return {
        success: true,
        data: {
          route: response,
          controller: response,
          service: response,
          test: '',
        },
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating API:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 生成数据库迁移脚本
   */
  async generateMigrationScript(dataModel: any): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Generating migration for: ${dataModel.tableName}`);

      const systemPrompt = `你是一个数据库专家。请根据数据模型定义生成Prisma迁移脚本。

要求：
- 使用Prisma Schema语法
- 包含所有字段定义
- 包含索引和关系
- 包含必要的注释
`;

      const userPrompt = `数据模型定义：
表名: ${dataModel.tableName}
字段: ${JSON.stringify(dataModel.fields, null, 2)}
关系: ${JSON.stringify(dataModel.relationships, null, 2)}
索引: ${JSON.stringify(dataModel.indexes, null, 2)}

请生成Prisma Schema定义。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        userPrompt,
        temperature: 0.1,
        maxTokens: 1000,
      });

      if (!response || !response) {
        return {
          success: false,
          error: '迁移脚本生成失败',
        };
      }

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating migration:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 导出完整项目代码
   */
  async exportProjectCode(projectId: string): Promise<{
    success: boolean;
    data?: GeneratedCode;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Exporting project code: ${projectId}`);

      // TODO: 实际实现需要从数据库获取所有组件、API、数据模型
      // 然后为每个生成代码并组织成文件结构

      return {
        success: true,
        data: {
          language: 'TypeScript',
          framework: 'React + Express',
          files: [],
        },
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error exporting project:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 生成测试代码
   */
  async generateTestCode(target: {
    type: 'component' | 'api';
    code: string;
    name: string;
  }): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Generating test for ${target.type}: ${target.name}`);

      const systemPrompt = `你是一个测试工程师。请为给定的代码生成完整的单元测试。

要求：
- 使用Jest测试框架
- ${target.type === 'component' ? '使用React Testing Library' : '使用Supertest'}
- 覆盖主要功能和边界情况
- 包含清晰的测试描述
`;

      const userPrompt = `${target.type === 'component' ? '组件' : 'API'}代码：\n${target.code}\n\n请生成完整的测试代码。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        userPrompt,
        temperature: 0.2,
        maxTokens: 1500,
      });

      if (!response || !response) {
        return {
          success: false,
          error: '测试代码生成失败',
        };
      }

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating test:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new CodeGenerationService();
