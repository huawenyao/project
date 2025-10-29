/**
 * Data Model Service
 *
 * Phase 6 - US4: 智能数据模型推荐
 * T067-T069: 实现数据模型推荐算法和影响分析
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AIService } from './AIService';

const prisma = new PrismaClient();

export interface DataModelField {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  default?: any;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface DataModelRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  from: string;
  to: string;
  foreignKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  description?: string;
}

export interface DataModelIndex {
  fields: string[];
  type: 'unique' | 'index' | 'fulltext';
  name?: string;
}

export interface DataModelRecommendation {
  tableName: string;
  fields: DataModelField[];
  relationships: DataModelRelationship[];
  indexes: DataModelIndex[];
  description: string;
  reasoning: string;
  confidence: number;
}

export interface ImpactAnalysis {
  affectedTables: string[];
  affectedRelationships: string[];
  requiredMigrations: {
    type: 'add_column' | 'remove_column' | 'modify_column' | 'add_table' | 'add_relationship';
    description: string;
    risk: 'low' | 'medium' | 'high';
    sql?: string;
  }[];
  dataConsistencyIssues: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

class DataModelService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * T067-T068: 智能数据模型推荐
   * 基于项目需求推荐数据库架构
   */
  async recommendDataModels(
    projectId: string
  ): Promise<{
    success: boolean;
    data?: DataModelRecommendation[];
    error?: string;
  }> {
    try {
      logger.info(`[DataModel] Recommending data models for project ${projectId}`);

      // 获取项目需求
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          requirementText: true,
          requirementSummary: true,
          name: true,
        },
      });

      if (!project) {
        return {
          success: false,
          error: '项目不存在',
        };
      }

      // 使用 AI 分析需求并推荐数据模型
      const prompt = `作为数据库架构专家，分析以下项目需求并推荐数据模型设计：

项目名称: ${project.name}
需求描述: ${project.requirementText}

请为该项目设计合适的数据库架构，输出 JSON 格式的数据模型推荐。

要求：
1. 识别所有核心实体（表）
2. 为每个实体设计字段（名称、类型、约束）
3. 定义实体间的关系（一对一、一对多、多对多）
4. 推荐合适的索引以优化查询性能
5. 遵循数据库设计最佳实践（3NF规范化）
6. 包含 created_at、updated_at 等审计字段
7. 考虑软删除（deleted_at）

请返回以下 JSON 格式：
{
  "recommendations": [
    {
      "tableName": "users",
      "fields": [
        {
          "name": "id",
          "type": "uuid",
          "required": true,
          "unique": true,
          "description": "用户唯一标识"
        },
        {
          "name": "email",
          "type": "string",
          "required": true,
          "unique": true,
          "validation": {
            "pattern": "email"
          },
          "description": "用户邮箱"
        }
      ],
      "relationships": [
        {
          "type": "one-to-many",
          "from": "users",
          "to": "posts",
          "foreignKey": "userId",
          "onDelete": "CASCADE",
          "description": "用户可以有多个帖子"
        }
      ],
      "indexes": [
        {
          "fields": ["email"],
          "type": "unique",
          "name": "idx_users_email"
        }
      ],
      "description": "用户表，存储系统用户信息",
      "reasoning": "用户是系统核心实体，需要邮箱唯一索引来加速登录查询",
      "confidence": 0.95
    }
  ]
}`;

      const response = await this.aiService.generateResponse(prompt, {
        temperature: 0.3,
        maxTokens: 4000,
      });

      // 解析 AI 响应
      const recommendations = this.parseRecommendations(response);

      // 保存推荐到数据库
      for (const rec of recommendations) {
        await this.saveDataModel(projectId, rec);
      }

      return {
        success: true,
        data: recommendations,
      };
    } catch (error: any) {
      logger.error('[DataModel] Error recommending data models:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * T069: 影响分析
   * 分析修改数据模型对现有系统的影响
   */
  async analyzeImpact(
    projectId: string,
    changes: {
      tableName: string;
      changeType: 'add' | 'modify' | 'remove';
      details: any;
    }[]
  ): Promise<{
    success: boolean;
    data?: ImpactAnalysis;
    error?: string;
  }> {
    try {
      logger.info(`[DataModel] Analyzing impact for project ${projectId}`);

      // 获取现有数据模型
      const existingModels = await prisma.dataModel.findMany({
        where: { projectId },
      });

      // 获取现有 API 端点（检查依赖关系）
      const apiEndpoints = await prisma.aPIEndpoint.findMany({
        where: { projectId },
      });

      // 使用 AI 分析影响
      const prompt = `作为数据库架构专家，分析以下数据模型变更的影响：

现有数据模型：
${JSON.stringify(existingModels, null, 2)}

计划变更：
${JSON.stringify(changes, null, 2)}

现有 API 端点：
${JSON.stringify(apiEndpoints.map(e => ({ path: e.path, method: e.method, dataModelId: e.dataModelId })), null, 2)}

请分析：
1. 受影响的表和关系
2. 需要的数据库迁移
3. 数据一致性问题
4. API 端点的兼容性
5. 复杂度评估
6. 风险等级

返回 JSON 格式：
{
  "affectedTables": ["users", "posts"],
  "affectedRelationships": ["users -> posts"],
  "requiredMigrations": [
    {
      "type": "add_column",
      "description": "在 users 表添加 phone 字段",
      "risk": "low",
      "sql": "ALTER TABLE users ADD COLUMN phone VARCHAR(20);"
    }
  ],
  "dataConsistencyIssues": [
    "现有用户记录的 phone 字段将为 NULL"
  ],
  "estimatedComplexity": "medium",
  "recommendations": [
    "建议添加默认值或设置为可选字段",
    "在生产环境应用前，先在测试环境验证"
  ]
}`;

      const response = await this.aiService.generateResponse(prompt, {
        temperature: 0.3,
        maxTokens: 3000,
      });

      const analysis = this.parseImpactAnalysis(response);

      return {
        success: true,
        data: analysis,
      };
    } catch (error: any) {
      logger.error('[DataModel] Error analyzing impact:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取项目的所有数据模型
   */
  async getDataModels(
    projectId: string
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const models = await prisma.dataModel.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });

      return {
        success: true,
        data: models,
      };
    } catch (error: any) {
      logger.error('[DataModel] Error getting data models:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 保存数据模型
   */
  private async saveDataModel(
    projectId: string,
    recommendation: DataModelRecommendation
  ): Promise<void> {
    try {
      await prisma.dataModel.upsert({
        where: {
          projectId_tableName: {
            projectId,
            tableName: recommendation.tableName,
          },
        },
        create: {
          projectId,
          tableName: recommendation.tableName,
          fields: recommendation.fields as any,
          relationships: recommendation.relationships as any,
          indexes: recommendation.indexes as any,
          description: recommendation.description,
        },
        update: {
          fields: recommendation.fields as any,
          relationships: recommendation.relationships as any,
          indexes: recommendation.indexes as any,
          description: recommendation.description,
        },
      });
    } catch (error: any) {
      logger.error('[DataModel] Error saving data model:', error);
      throw error;
    }
  }

  /**
   * 解析 AI 推荐响应
   */
  private parseRecommendations(response: string): DataModelRecommendation[] {
    try {
      // 尝试提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.recommendations || [];
      }

      // 如果没有找到 JSON，返回默认推荐
      logger.warn('[DataModel] Could not parse AI response, using defaults');
      return this.getDefaultRecommendations();
    } catch (error) {
      logger.error('[DataModel] Error parsing recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  /**
   * 解析影响分析响应
   */
  private parseImpactAnalysis(response: string): ImpactAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // 默认影响分析
      return {
        affectedTables: [],
        affectedRelationships: [],
        requiredMigrations: [],
        dataConsistencyIssues: [],
        estimatedComplexity: 'medium',
        recommendations: ['建议在测试环境先验证变更'],
      };
    } catch (error) {
      logger.error('[DataModel] Error parsing impact analysis:', error);
      return {
        affectedTables: [],
        affectedRelationships: [],
        requiredMigrations: [],
        dataConsistencyIssues: [],
        estimatedComplexity: 'medium',
        recommendations: ['建议在测试环境先验证变更'],
      };
    }
  }

  /**
   * 默认数据模型推荐
   */
  private getDefaultRecommendations(): DataModelRecommendation[] {
    return [
      {
        tableName: 'users',
        fields: [
          {
            name: 'id',
            type: 'uuid',
            required: true,
            unique: true,
            description: '用户唯一标识',
          },
          {
            name: 'email',
            type: 'string',
            required: true,
            unique: true,
            description: '用户邮箱',
          },
          {
            name: 'name',
            type: 'string',
            required: true,
            description: '用户名称',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            required: true,
            description: '创建时间',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            required: true,
            description: '更新时间',
          },
        ],
        relationships: [],
        indexes: [
          {
            fields: ['email'],
            type: 'unique',
            name: 'idx_users_email',
          },
        ],
        description: '用户表',
        reasoning: '基本的用户表结构',
        confidence: 0.8,
      },
    ];
  }
}

export default new DataModelService();
