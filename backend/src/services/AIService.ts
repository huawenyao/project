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

export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private defaultProvider: string;
  private defaultModel: string;

  constructor() {
    this.defaultProvider = process.env.AI_MODEL_PROVIDER || 'openai';
    this.defaultModel = process.env.AI_MODEL_NAME || 'gpt-4';
    
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

    try {
      if (this.defaultProvider === 'openai' && this.openai) {
        return await this.generateOpenAIResponse(prompt, {
          temperature,
          maxTokens,
          model,
          systemPrompt
        });
      } else if (this.defaultProvider === 'anthropic' && this.anthropic) {
        return await this.generateAnthropicResponse(prompt, {
          temperature,
          maxTokens,
          model: model.includes('claude') ? model : 'claude-3-sonnet-20240229',
          systemPrompt
        });
      } else {
        throw new Error(`AI provider ${this.defaultProvider} not available`);
      }
    } catch (error) {
      logger.error('AI generation failed:', error);
      throw new Error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

    const response = await this.anthropic.completions.create({
      model: options.model || 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 1500,
      temperature: options.temperature,
      system: options.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

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
}