import { EventEmitter } from 'events';
import { AIService } from '../services/AIService';
import { logger } from '../utils/logger';
import visualizationEmitter from '../websocket/visualizationEmitter';

export interface AgentCapability {
  name: string;
  description: string;
  parameters: any[];
  examples: string[];
}

export interface AgentExecutionContext {
  projectId: string;
  userId: string;
  workspace: any;
  previousResults?: any[];
  constraints?: string[];
}

export interface AgentExecutionResult {
  success: boolean;
  data?: any;
  artifacts?: any[];
  nextSteps?: string[];
  error?: string;
  metadata?: any;
}

export interface AgentStatus {
  agentType: string;
  status: 'idle' | 'working' | 'waiting' | 'completed' | 'failed';
  currentTask?: string;
  progress?: number;
  message?: string;
  output?: any;
}

export abstract class BaseAgent extends EventEmitter {
  protected aiService: AIService;
  protected agentType: string;
  protected capabilities: AgentCapability[];
  protected isActive: boolean = false;
  protected activeJobs: number = 0;
  protected lastActivity: Date | null = null;

  constructor(aiService: AIService, agentType: string) {
    super();
    this.aiService = aiService;
    this.agentType = agentType;
    this.capabilities = [];
    this.initializeCapabilities();
  }

  protected abstract initializeCapabilities(): void;

  public abstract execute(
    action: string,
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult>;

  protected async generateWithAI(
    prompt: string,
    systemPrompt?: string,
    options?: any
  ): Promise<string> {
    try {
      return await this.aiService.generateResponse(prompt, {
        systemPrompt: systemPrompt || this.getDefaultSystemPrompt(),
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 2000,
        ...options
      });
    } catch (error) {
      logger.error(`AI generation failed for ${this.agentType}:`, error);
      throw error;
    }
  }

  protected getDefaultSystemPrompt(): string {
    return `You are a specialized ${this.agentType} agent in an AI-powered app building platform.

Your capabilities include:
${this.capabilities.map(cap => `- ${cap.name}: ${cap.description}`).join('\n')}

Guidelines:
- Provide practical, implementable solutions
- Consider best practices and industry standards
- Ensure security and performance
- Generate clean, maintainable code
- Include proper error handling
- Consider scalability and maintainability

Always respond with actionable results that can be directly used in app development.`;
  }

  protected validateParameters(action: string, parameters: any): boolean {
    const capability = this.capabilities.find(cap => cap.name === action);
    if (!capability) {
      throw new Error(`Unknown action: ${action}`);
    }

    // Basic parameter validation
    for (const param of capability.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }
    }

    return true;
  }

  protected startExecution(): void {
    this.isActive = true;
    this.activeJobs++;
    this.lastActivity = new Date();
    this.emit('execution_started', { agentType: this.agentType });
  }

  protected endExecution(): void {
    this.activeJobs = Math.max(0, this.activeJobs - 1);
    this.isActive = this.activeJobs > 0;
    this.lastActivity = new Date();
    this.emit('execution_ended', { agentType: this.agentType });
  }

  protected createArtifact(
    type: string,
    name: string,
    content: any,
    metadata?: any
  ): any {
    return {
      id: `${this.agentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name,
      content,
      agentType: this.agentType,
      createdAt: new Date(),
      metadata: metadata || {}
    };
  }

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          break;
        }

        logger.warn(`${this.agentType} operation failed (attempt ${attempt}/${maxRetries}):`, error);
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }

    throw lastError!;
  }

  public getCapabilities(): AgentCapability[] {
    return [...this.capabilities];
  }

  public isAvailable(): boolean {
    return !this.isActive || this.activeJobs < 3; // Allow up to 3 concurrent jobs
  }

  public getActiveJobs(): number {
    return this.activeJobs;
  }

  public getLastActivity(): Date | null {
    return this.lastActivity;
  }

  public getAgentType(): string {
    return this.agentType;
  }

  public getStatus(): any {
    return {
      type: this.agentType,
      isActive: this.isActive,
      activeJobs: this.activeJobs,
      lastActivity: this.lastActivity,
      capabilities: this.capabilities.length,
      available: this.isAvailable()
    };
  }

  protected logInfo(message: string, data?: any): void {
    logger.info(`[${this.agentType.toUpperCase()}] ${message}`, data);
  }

  protected logError(message: string, error?: any): void {
    logger.error(`[${this.agentType.toUpperCase()}] ${message}`, error);
  }

  protected logWarn(message: string, data?: any): void {
    logger.warn(`[${this.agentType.toUpperCase()}] ${message}`, data);
  }

  /**
   * T037: 发布 Agent 状态到 WebSocket
   * 实时推送状态更新到前端
   */
  protected publishStatus(
    projectId: string,
    status: AgentStatus['status'],
    options: {
      currentTask?: string;
      progress?: number;
      message?: string;
      output?: any;
    } = {}
  ): void {
    try {
      const statusUpdate: AgentStatus = {
        agentType: this.agentType,
        status,
        currentTask: options.currentTask,
        progress: options.progress,
        message: options.message,
        output: options.output,
      };

      // 通过 WebSocket 发送状态更新
      visualizationEmitter.emitAgentStatusUpdate(projectId, statusUpdate);

      // 也触发 EventEmitter 事件（用于内部监听）
      this.emit('status_update', statusUpdate);

      this.logInfo('Status published', { status, progress: options.progress });
    } catch (error) {
      this.logError('Failed to publish status', error);
    }
  }

  /**
   * T037: 发布 Agent 输出到 WebSocket
   */
  protected publishOutput(
    projectId: string,
    output: {
      type: string;
      content: any;
      metadata?: any;
    }
  ): void {
    try {
      visualizationEmitter.emitAgentOutput(projectId, {
        agentType: this.agentType,
        ...output,
        timestamp: new Date().toISOString(),
      });

      this.logInfo('Output published', { type: output.type });
    } catch (error) {
      this.logError('Failed to publish output', error);
    }
  }
}