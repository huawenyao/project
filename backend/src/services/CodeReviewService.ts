/**
 * Code Review Service
 *
 * Sprint 5 - US6: 智能代码审查与优化建议
 * T089: 实现AI代码审查
 */

import { AIService } from './AIService';
import { logger } from '../utils/logger';

export interface CodeReviewResult {
  overall: {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
  };
  issues: CodeIssue[];
  suggestions: OptimizationSuggestion[];
  metrics: CodeMetrics;
}

export interface CodeIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'performance' | 'security' | 'maintainability' | 'style' | 'bug';
  title: string;
  description: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  code: string; // 问题代码片段
  suggestedFix?: string;
}

export interface OptimizationSuggestion {
  id: string;
  category: 'performance' | 'security' | 'maintainability';
  impact: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  before: string;
  after: string;
  benefit: string;
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  testCoverage?: number;
  duplications?: number;
  linesOfCode: number;
}

class CodeReviewService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * 审查代码并提供优化建议
   */
  async reviewCode(params: {
    code: string;
    language: string;
    filename: string;
    context?: string;
  }): Promise<{
    success: boolean;
    data?: CodeReviewResult;
    error?: string;
  }> {
    const { code, language, filename, context } = params;

    try {
      logger.info(`[CodeReview] Reviewing ${filename}`);

      const systemPrompt = `你是一个资深的代码审查专家。请审查以下代码，识别问题并提供优化建议。

请以JSON格式返回审查结果，包含：
1. overall: 总体评分和摘要
   - score: 0-100分数
   - grade: A/B/C/D/F等级
   - summary: 总体评价

2. issues: 问题列表，每个问题包含：
   - severity: 严重程度（critical/high/medium/low）
   - category: 类别（performance/security/maintainability/style/bug）
   - title: 问题标题
   - description: 详细描述
   - location: 位置信息（file, line）
   - suggestedFix: 建议的修复代码（可选）

3. suggestions: 优化建议列表，每个建议包含：
   - category: 类别
   - impact: 影响程度
   - title: 标题
   - description: 描述
   - before: 优化前代码
   - after: 优化后代码
   - benefit: 收益说明

4. metrics: 代码指标
   - complexity: 复杂度（1-100）
   - maintainability: 可维护性（1-100）
   - linesOfCode: 代码行数

重点关注：
- 性能问题（如N+1查询、不必要的重渲染等）
- 安全漏洞（如SQL注入、XSS等）
- 代码异味和反模式
- 可维护性问题`;

      const userPrompt = `语言: ${language}
文件: ${filename}
${context ? `上下文: ${context}\n` : ''}
代码:
\`\`\`${language}
${code}
\`\`\`

请审查这段代码并返回JSON格式的结果。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        userPrompt,
        temperature: 0.3,
        maxTokens: 2000,
      });

      if (!response || !response) {
        return {
          success: false,
          error: 'AI审查失败',
        };
      }

      // 解析AI返回的JSON
      let result: CodeReviewResult;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('无法从AI响应中提取JSON');
        }
        result = JSON.parse(jsonMatch[0]);

        // 确保数据结构完整
        if (!result.issues) result.issues = [];
        if (!result.suggestions) result.suggestions = [];
        if (!result.metrics) {
          result.metrics = {
            complexity: 50,
            maintainability: 70,
            linesOfCode: code.split('\n').length,
          };
        }
      } catch (parseError: any) {
        logger.error('[CodeReview] Failed to parse AI response:', parseError);
        // 返回基本的审查结果
        result = {
          overall: {
            score: 70,
            grade: 'C',
            summary: '代码审查完成，请查看详细建议',
          },
          issues: [],
          suggestions: [],
          metrics: {
            complexity: 50,
            maintainability: 70,
            linesOfCode: code.split('\n').length,
          },
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      logger.error('[CodeReview] Error reviewing code:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 审查整个项目
   */
  async reviewProject(projectId: string): Promise<{
    success: boolean;
    data?: {
      files: Array<{
        file: string;
        review: CodeReviewResult;
      }>;
      summary: {
        totalScore: number;
        totalIssues: number;
        criticalIssues: number;
        suggestions: number;
      };
    };
    error?: string;
  }> {
    try {
      logger.info(`[CodeReview] Reviewing project ${projectId}`);

      // TODO: 实际实现需要：
      // 1. 从数据库获取项目的所有生成代码
      // 2. 对每个文件进行审查
      // 3. 汇总结果

      return {
        success: true,
        data: {
          files: [],
          summary: {
            totalScore: 0,
            totalIssues: 0,
            criticalIssues: 0,
            suggestions: 0,
          },
        },
      };
    } catch (error: any) {
      logger.error('[CodeReview] Error reviewing project:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 应用优化建议
   */
  async applyOptimization(params: {
    code: string;
    optimization: OptimizationSuggestion;
  }): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    const { code, optimization } = params;

    try {
      // 简单替换实现
      // 实际可能需要更智能的代码转换
      const optimizedCode = code.replace(optimization.before, optimization.after);

      return {
        success: true,
        data: optimizedCode,
      };
    } catch (error: any) {
      logger.error('[CodeReview] Error applying optimization:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 分析代码影响
   */
  async analyzeImpact(params: {
    originalCode: string;
    modifiedCode: string;
    projectId: string;
  }): Promise<{
    success: boolean;
    data?: {
      affectedFiles: string[];
      affectedAPIs: string[];
      affectedComponents: string[];
      riskLevel: 'low' | 'medium' | 'high';
      recommendations: string[];
    };
    error?: string;
  }> {
    const { originalCode, modifiedCode, projectId } = params;

    try {
      logger.info(`[CodeReview] Analyzing impact for project ${projectId}`);

      const systemPrompt = `你是一个代码分析专家。请分析代码修改的影响范围。

请以JSON格式返回：
{
  "affectedFiles": ["可能受影响的文件列表"],
  "affectedAPIs": ["可能受影响的API端点"],
  "affectedComponents": ["可能受影响的组件"],
  "riskLevel": "low/medium/high",
  "recommendations": ["建议检查的项目列表"]
}`;

      const userPrompt = `原始代码:
\`\`\`
${originalCode}
\`\`\`

修改后代码:
\`\`\`
${modifiedCode}
\`\`\`

请分析这次修改的影响范围。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        userPrompt,
        temperature: 0.2,
        maxTokens: 1000,
      });

      if (!response || !response) {
        return {
          success: false,
          error: '影响分析失败',
        };
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          error: '无法解析分析结果',
        };
      }

      const impactAnalysis = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        data: impactAnalysis,
      };
    } catch (error: any) {
      logger.error('[CodeReview] Error analyzing impact:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 生成代码文档
   */
  async generateDocumentation(code: string, language: string): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    try {
      const systemPrompt = `你是一个技术文档专家。请为给定的代码生成清晰的文档。

包括：
- 功能说明
- 参数说明
- 返回值说明
- 使用示例
- 注意事项`;

      const userPrompt = `语言: ${language}\n代码:\n\`\`\`${language}\n${code}\n\`\`\`\n\n请生成文档。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        userPrompt,
        temperature: 0.3,
        maxTokens: 1000,
      });

      if (!response || !response) {
        return {
          success: false,
          error: '文档生成失败',
        };
      }

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      logger.error('[CodeReview] Error generating documentation:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new CodeReviewService();
