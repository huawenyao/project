import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

/**
 * T007 [P]: 配置AI Service多提供者切换
 * 支持OpenAI和Anthropic双提供者，带fallback机制
 */
export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private defaultProvider: string;
  private defaultModel: string;
  private enableFallback: boolean;
  private maxRetries: number;

  // Provider health tracking
  private providerHealth: Map<string, { failures: number; lastFailure: Date | null }> = new Map([
    ['openai', { failures: 0, lastFailure: null }],
    ['anthropic', { failures: 0, lastFailure: null }]
  ]);

  constructor() {
    this.defaultProvider = process.env.AI_MODEL_PROVIDER || 'openai';
    this.defaultModel = process.env.AI_MODEL_NAME || 'gpt-4';
    this.enableFallback = process.env.AI_ENABLE_FALLBACK !== 'false'; // 默认启用fallback
    this.maxRetries = parseInt(process.env.AI_MAX_RETRIES || '3', 10);

    this.initializeProviders();
  }

  private initializeProviders(): void {
    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        logger.info('OpenAI client initialized');
      }

      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
        logger.info('Anthropic client initialized');
      }

      if (!this.openai && !this.anthropic) {
        logger.warn('No AI providers configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY');
      }
    } catch (error) {
      logger.error('Failed to initialize AI providers:', error);
    }
  }

  /**
   * 生成AI响应，带自动fallback机制
   */
  public async generateResponse(
    prompt: string,
    options: AIOptions = {}
  ): Promise<string> {
    const {
      temperature = 0.7,
      maxTokens = 1500,
      model = this.defaultModel,
      systemPrompt
    } = options;

    // 尝试使用主提供者
    const primaryProvider = this.defaultProvider;
    const fallbackProvider = this.getFallbackProvider(primaryProvider);

    try {
      return await this.generateWithProvider(primaryProvider, prompt, {
        temperature,
        maxTokens,
        model,
        systemPrompt
      });
    } catch (primaryError) {
      this.recordProviderFailure(primaryProvider, primaryError);
      logger.warn(`Primary provider ${primaryProvider} failed, attempting fallback...`);

      // 如果启用fallback且有备用提供者
      if (this.enableFallback && fallbackProvider) {
        try {
          logger.info(`Falling back to ${fallbackProvider}`);
          return await this.generateWithProvider(fallbackProvider, prompt, {
            temperature,
            maxTokens,
            model: this.getProviderModel(fallbackProvider, model),
            systemPrompt
          });
        } catch (fallbackError) {
          this.recordProviderFailure(fallbackProvider, fallbackError);
          logger.error('Both primary and fallback providers failed');
          throw new Error(`All AI providers failed. Primary: ${primaryError instanceof Error ? primaryError.message : 'Unknown'}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`);
        }
      }

      throw new Error(`AI service error: ${primaryError instanceof Error ? primaryError.message : 'Unknown error'}`);
    }
  }

  /**
   * 使用指定提供者生成响应（带重试机制）
   */
  private async generateWithProvider(
    provider: string,
    prompt: string,
    options: AIOptions
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        if (provider === 'openai' && this.openai) {
          const result = await this.generateOpenAIResponse(prompt, options);
          this.recordProviderSuccess(provider);
          return result;
        } else if (provider === 'anthropic' && this.anthropic) {
          const result = await this.generateAnthropicResponse(prompt, options);
          this.recordProviderSuccess(provider);
          return result;
        } else {
          throw new Error(`Provider ${provider} not available`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // 如果是速率限制错误，等待后重试
        if (this.isRateLimitError(error)) {
          const delay = this.getRetryDelay(attempt);
          logger.warn(`Rate limit hit on ${provider}, retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
          await this.sleep(delay);
          continue;
        }

        // 其他错误直接抛出，不重试
        throw error;
      }
    }

    throw lastError || new Error(`Failed after ${this.maxRetries} retries`);
  }

  /**
   * 获取fallback提供者
   */
  private getFallbackProvider(primaryProvider: string): string | null {
    if (primaryProvider === 'openai' && this.anthropic) {
      return 'anthropic';
    } else if (primaryProvider === 'anthropic' && this.openai) {
      return 'openai';
    }
    return null;
  }

  /**
   * 获取提供者对应的模型名称
   */
  private getProviderModel(provider: string, requestedModel: string): string {
    if (provider === 'anthropic') {
      // 如果请求的是OpenAI模型，转换为Claude模型
      if (requestedModel.includes('gpt')) {
        return 'claude-3-5-sonnet-20241022'; // 使用Sonnet 3.5作为默认
      }
      return requestedModel.includes('claude') ? requestedModel : 'claude-3-5-sonnet-20241022';
    } else if (provider === 'openai') {
      // 如果请求的是Claude模型，转换为GPT模型
      if (requestedModel.includes('claude')) {
        return 'gpt-4-turbo';
      }
      return requestedModel.includes('gpt') ? requestedModel : 'gpt-4-turbo';
    }
    return requestedModel;
  }

  /**
   * 记录提供者失败
   */
  private recordProviderFailure(provider: string, error: any): void {
    const health = this.providerHealth.get(provider);
    if (health) {
      health.failures++;
      health.lastFailure = new Date();
      logger.error(`Provider ${provider} failure count: ${health.failures}`, error);
    }
  }

  /**
   * 记录提供者成功
   */
  private recordProviderSuccess(provider: string): void {
    const health = this.providerHealth.get(provider);
    if (health && health.failures > 0) {
      // 成功后重置失败计数
      health.failures = 0;
      health.lastFailure = null;
      logger.info(`Provider ${provider} recovered`);
    }
  }

  /**
   * 判断是否为速率限制错误
   */
  private isRateLimitError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    return (
      message.includes('rate_limit') ||
      message.includes('429') ||
      message.includes('Too Many Requests')
    );
  }

  /**
   * 获取重试延迟（指数退避）
   */
  private getRetryDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 10000); // 最大10秒
  }

  /**
   * 休眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async generateOpenAIResponse(
    prompt: string,
    options: AIOptions
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const messages: any[] = [];
    
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const response = await this.openai.chat.completions.create({
      model: options.model || 'gpt-4',
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return content;
  }

  private async generateAnthropicResponse(
    prompt: string,
    options: AIOptions
  ): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const requestParams: any = {
      model: options.model || 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 1500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    if (options.systemPrompt) {
      requestParams.system = options.systemPrompt;
    }

    if (options.temperature !== undefined) {
      requestParams.temperature = options.temperature;
    }

    const response = await this.anthropic.messages.create(requestParams);

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return content.text;
  }

  public async generateCode(
    description: string,
    language: string,
    framework?: string,
    context?: any
  ): Promise<string> {
    const systemPrompt = `You are an expert software developer. Generate clean, efficient, and well-documented code based on the user's requirements.

Language: ${language}
Framework: ${framework || 'None specified'}
Context: ${context ? JSON.stringify(context, null, 2) : 'None provided'}

Guidelines:
- Write production-ready code
- Include proper error handling
- Add meaningful comments where necessary
- Follow best practices for the specified language/framework
- Ensure code is secure and performant
- Return only the code without additional explanations`;

    return await this.generateResponse(description, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000
    });
  }

  public async analyzeUserIntent(
    userInput: string,
    context?: any
  ): Promise<{
    intent: string;
    entities: any[];
    confidence: number;
    suggestedActions: string[];
  }> {
    const systemPrompt = `You are an AI assistant that analyzes user intents for app building requests. 

Analyze the user input and return a JSON response with:
- intent: The primary intent (create_app, modify_app, add_feature, integrate_service, deploy_app, etc.)
- entities: Extracted entities like app type, features, technologies, etc.
- confidence: Confidence score from 0-1
- suggestedActions: Array of suggested next steps

Context: ${context ? JSON.stringify(context, null, 2) : 'None provided'}

Return only valid JSON.`;

    try {
      const response = await this.generateResponse(userInput, {
        systemPrompt,
        temperature: 0.2,
        maxTokens: 800
      });

      // Parse the JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback response
      return {
        intent: 'unknown',
        entities: [],
        confidence: 0.1,
        suggestedActions: ['Please provide more specific details about what you want to build']
      };
    } catch (error) {
      logger.error('Intent analysis failed:', error);
      return {
        intent: 'error',
        entities: [],
        confidence: 0,
        suggestedActions: ['There was an error analyzing your request. Please try again.']
      };
    }
  }

  public async generateComponentCode(
    componentType: string,
    requirements: string[],
    framework: string = 'react'
  ): Promise<{
    code: string;
    dependencies: string[];
    props: any[];
    usage: string;
  }> {
    const systemPrompt = `You are a frontend component generator. Create a ${framework} component based on the requirements.

Component Type: ${componentType}
Requirements: ${requirements.join(', ')}
Framework: ${framework}

Return a JSON response with:
- code: The complete component code
- dependencies: Array of required npm packages
- props: Array of component props with types and descriptions
- usage: Example usage of the component

Ensure the component is:
- Responsive and accessible
- Well-typed (if TypeScript)
- Follows modern best practices
- Includes proper error handling

Return only valid JSON.`;

    try {
      const response = await this.generateResponse('Generate the component', {
        systemPrompt,
        temperature: 0.4,
        maxTokens: 2500
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Invalid JSON response from AI');
    } catch (error) {
      logger.error('Component generation failed:', error);
      throw error;
    }
  }

  public async optimizeCode(
    code: string,
    language: string,
    optimizationGoals: string[] = ['performance', 'readability']
  ): Promise<{
    optimizedCode: string;
    improvements: string[];
    metrics: any;
  }> {
    const systemPrompt = `You are a code optimization expert. Analyze and optimize the provided code.

Language: ${language}
Optimization Goals: ${optimizationGoals.join(', ')}

Return a JSON response with:
- optimizedCode: The improved code
- improvements: Array of improvements made
- metrics: Object with performance/quality metrics

Focus on:
- Performance optimizations
- Code readability and maintainability
- Security best practices
- Memory efficiency
- Error handling improvements

Return only valid JSON.`;

    try {
      const response = await this.generateResponse(code, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 3000
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Invalid JSON response from AI');
    } catch (error) {
      logger.error('Code optimization failed:', error);
      throw error;
    }
  }

  public isAvailable(): boolean {
    return !!(this.openai || this.anthropic);
  }

  public getAvailableProviders(): string[] {
    const providers = [];
    if (this.openai) providers.push('openai');
    if (this.anthropic) providers.push('anthropic');
    return providers;
  }

  /**
   * 获取提供者健康状态
   */
  public getProviderHealth(): Record<string, { failures: number; lastFailure: Date | null; status: string }> {
    const health: Record<string, any> = {};

    for (const [provider, data] of this.providerHealth) {
      health[provider] = {
        ...data,
        status: data.failures === 0 ? 'healthy' : data.failures < 5 ? 'degraded' : 'unhealthy'
      };
    }

    return health;
  }

  /**
   * 测试AI服务连接
   */
  public async testConnection(provider?: string): Promise<{ success: boolean; provider: string; latency: number; error?: string }> {
    const testProvider = provider || this.defaultProvider;
    const startTime = Date.now();

    try {
      const response = await this.generateWithProvider(
        testProvider,
        'Say "OK" if you can read this.',
        {
          temperature: 0,
          maxTokens: 10,
          model: this.getProviderModel(testProvider, this.defaultModel)
        }
      );

      const latency = Date.now() - startTime;

      return {
        success: true,
        provider: testProvider,
        latency
      };
    } catch (error: any) {
      return {
        success: false,
        provider: testProvider,
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * 获取服务配置信息
   */
  public getConfig(): {
    defaultProvider: string;
    defaultModel: string;
    enableFallback: boolean;
    maxRetries: number;
    availableProviders: string[];
  } {
    return {
      defaultProvider: this.defaultProvider,
      defaultModel: this.defaultModel,
      enableFallback: this.enableFallback,
      maxRetries: this.maxRetries,
      availableProviders: this.getAvailableProviders()
    };
  }
}