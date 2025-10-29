/**
 * NLP Service
 *
 * 自然语言处理API服务 - 与后端NLP路由通信
 */

import apiClient from './apiClient';

export interface RequirementAnalysis {
  appType: string;
  appCategory: string;
  features: string[];
  entities: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number;
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
  };
  userRoles?: string[];
  thirdPartyIntegrations?: string[];
  confidence: number;
}

export interface ClarificationQuestion {
  question: string;
  options?: string[];
  category: 'features' | 'data' | 'users' | 'integrations';
}

export interface ParseRequirementResponse {
  success: boolean;
  data?: RequirementAnalysis;
  clarifications?: ClarificationQuestion[];
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

class NLPService {
  /**
   * 验证输入
   */
  async validateInput(text: string): Promise<ValidationResult> {
    try {
      const result = await apiClient.post<ValidationResult>('/api/nlp/validate', {
        input: text,
      });
      return result;
    } catch (error: any) {
      console.error('[NLPService] Validation error:', error);
      return {
        isValid: false,
        reason: error.message || '验证失败',
      };
    }
  }

  /**
   * 解析需求
   */
  async parseRequirement(requirementText: string): Promise<ParseRequirementResponse> {
    try {
      const response = await apiClient.post<ParseRequirementResponse>('/api/nlp/parse', {
        requirementText,
      });
      return response;
    } catch (error: any) {
      console.error('[NLPService] Parse requirement error:', error);
      return {
        success: false,
        error: error.message || '需求解析失败',
      };
    }
  }

  /**
   * 提交澄清答案
   */
  async submitClarifications(
    originalText: string,
    answers: Record<string, string>
  ): Promise<ParseRequirementResponse> {
    try {
      const response = await apiClient.post<ParseRequirementResponse>(
        '/api/nlp/clarify',
        {
          originalText,
          answers,
        }
      );
      return response;
    } catch (error: any) {
      console.error('[NLPService] Submit clarifications error:', error);
      return {
        success: false,
        error: error.message || '提交失败',
      };
    }
  }
}

export const nlpService = new NLPService();
export default nlpService;
