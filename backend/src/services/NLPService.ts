/**
 * NLP Service - Natural Language Processing
 *
 * Sprint 1 - US1: 自然语言应用创建
 * T023: 实现需求解析和AI理解
 */

import { AIService } from './AIService';
import { logger } from '../utils/logger';

export interface RequirementAnalysis {
  appType: string;
  appCategory: string;
  features: string[];
  entities: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number; // 分钟
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
  };
  userRoles?: string[];
  thirdPartyIntegrations?: string[];
  confidence: number; // 0-1
}

export interface ClarificationQuestion {
  question: string;
  options?: string[];
  category: 'features' | 'data' | 'users' | 'integrations';
}

class NLPService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * 解析自然语言需求描述
   */
  async parseRequirement(requirementText: string): Promise<{
    success: boolean;
    data?: RequirementAnalysis;
    clarifications?: ClarificationQuestion[];
    error?: string;
  }> {
    try {
      logger.info('[NLPService] Parsing requirement:', requirementText.substring(0, 100));

      // 使用AI分析需求
      const systemPrompt = `你是一个专业的产品需求分析师。请分析用户的需求描述，提取关键信息并评估复杂度。

请以JSON格式返回分析结果，包含以下字段：
- appType: 应用类型（如"待办应用"、"博客平台"、"电商系统"等）
- appCategory: 应用分类（如"productivity"、"social"、"ecommerce"、"cms"等）
- features: 核心功能列表（数组）
- entities: 涉及的数据实体（如"用户"、"文章"、"订单"等）
- complexity: 复杂度（"simple" | "medium" | "complex"）
- estimatedDuration: 预估构建时间（分钟）
- techStack: 推荐技术栈
  - frontend: 前端技术（如["React", "TypeScript", "TailwindCSS"]）
  - backend: 后端技术（如["Node.js", "Express", "PostgreSQL"]）
  - database: 数据库（如["PostgreSQL"]）
- userRoles: 用户角色（如["管理员", "普通用户"]）
- thirdPartyIntegrations: 第三方集成（如["支付宝", "微信支付"]）
- confidence: 分析置信度（0-1）

如果需求描述不够清晰，请在confidence字段中体现（低于0.7表示需要澄清）。`;

      const userPrompt = `需求描述：\n${requirementText}`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 1000,
      });

      if (!response) {
        return {
          success: false,
          error: 'AI分析失败',
        };
      }

      // 解析AI返回的JSON
      let analysis: RequirementAnalysis;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('无法从AI响应中提取JSON');
        }
        analysis = JSON.parse(jsonMatch[0]);
      } catch (parseError: any) {
        logger.error('[NLPService] Failed to parse AI response:', parseError);
        return {
          success: false,
          error: 'AI返回格式错误',
        };
      }

      // 如果置信度低，生成澄清问题
      let clarifications: ClarificationQuestion[] | undefined;
      if (analysis.confidence < 0.7) {
        clarifications = await this.generateClarificationQuestions(requirementText, analysis);
      }

      return {
        success: true,
        data: analysis,
        clarifications,
      };
    } catch (error: any) {
      logger.error('[NLPService] Error parsing requirement:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 生成澄清问题
   */
  private async generateClarificationQuestions(
    requirementText: string,
    analysis: RequirementAnalysis
  ): Promise<ClarificationQuestion[]> {
    try {
      const systemPrompt = `你是一个产品经理，负责帮助用户明确需求。基于初步分析结果，生成2-3个关键问题来澄清需求。

请以JSON数组格式返回问题列表，每个问题包含：
- question: 问题文本
- options: 可选项（可选）
- category: 问题类别（"features" | "data" | "users" | "integrations"）

示例：
[
  {
    "question": "这个应用的主要目标用户是谁？",
    "options": ["个人用户", "企业用户", "两者都有"],
    "category": "users"
  }
]`;

      const userPrompt = `原始需求：${requirementText}\n\n初步分析：${JSON.stringify(analysis, null, 2)}`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        temperature: 0.5,
        maxTokens: 500,
      });

      if (!response) {
        return [];
      }

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      logger.error('[NLPService] Error generating clarifications:', error);
      return [];
    }
  }

  /**
   * 验证和过滤恶意输入（防止prompt injection）
   */
  async validateInput(input: string): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    // 基本长度检查
    if (input.length < 10) {
      return {
        isValid: false,
        reason: '需求描述太短，请提供更详细的信息（至少10个字符）',
      };
    }

    if (input.length > 5000) {
      return {
        isValid: false,
        reason: '需求描述太长，请控制在5000字符以内',
      };
    }

    // 检测潜在的prompt injection
    const suspiciousPatterns = [
      /ignore\s+(previous|above)\s+instructions/i,
      /system\s+prompt/i,
      /you\s+are\s+(now|a)/i,
      /new\s+instructions/i,
      /forget\s+(everything|all)/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          reason: '输入内容包含可疑模式，请使用正常的需求描述语言',
        };
      }
    }

    return { isValid: true };
  }
}

export default new NLPService();
