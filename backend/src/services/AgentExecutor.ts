import { Agent, Task } from '@prisma/client';
import { AIService } from './AIService';
import { AgentService } from './AgentService';
import { TaskService } from './TaskService';
import { WebSocketService } from './WebSocketService';
import { logger } from '../utils/logger';

/**
 * Agent执行引擎
 * 负责调度和执行Agent任务
 */

export interface ExecutionContext {
  projectId: string;
  userId: string;
  config?: any;
}

export interface ExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  executionTime: number;
  metrics?: any;
}

/**
 * Agent任务执行器
 */
export class AgentExecutor {
  private aiService: AIService;
  private runningTasks: Map<string, boolean> = new Map();

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * 执行Agent任务
   */
  async executeTask(
    task: Task,
    agent: Agent,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const taskId = task.id;

    try {
      // 检查是否已在执行
      if (this.runningTasks.get(taskId)) {
        throw new Error('任务已在执行中');
      }

      this.runningTasks.set(taskId, true);
      logger.info(`开始执行任务: ${taskId} (Agent: ${agent.name})`);

      // 更新任务状态为running
      await TaskService.startTask(taskId);

      // 更新Agent状态
      await AgentService.updateAgentStatus(agent.id, 'working', task.type);

      // 广播任务开始
      WebSocketService.broadcastTaskProgress(taskId, 0);

      // 根据Agent类型执行不同的任务
      let result: any;
      switch (agent.type) {
        case 'ui':
          result = await this.executeUITask(task, agent, context);
          break;
        case 'backend':
          result = await this.executeBackendTask(task, agent, context);
          break;
        case 'database':
          result = await this.executeDatabaseTask(task, agent, context);
          break;
        case 'integration':
          result = await this.executeIntegrationTask(task, agent, context);
          break;
        case 'deployment':
          result = await this.executeDeploymentTask(task, agent, context);
          break;
        default:
          throw new Error(`未知的Agent类型: ${agent.type}`);
      }

      const executionTime = Date.now() - startTime;

      // 更新任务状态为completed
      await TaskService.completeTask(taskId, result, {
        executionTime,
        success: true,
      });

      // 更新Agent状态
      await AgentService.updateAgentStatus(agent.id, 'idle');

      // 广播任务完成
      WebSocketService.broadcastTaskProgress(taskId, 100);

      logger.info(`任务执行成功: ${taskId} (耗时: ${executionTime}ms)`);

      return {
        success: true,
        output: result,
        executionTime,
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      logger.error(`任务执行失败: ${taskId}`, error);

      // 更新任务状态为failed
      await TaskService.failTask(taskId, error.message);

      // 更新Agent状态
      await AgentService.updateAgentStatus(agent.id, 'error');

      return {
        success: false,
        output: null,
        error: error.message,
        executionTime,
      };

    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  /**
   * 执行UI Agent任务
   */
  private async executeUITask(
    task: Task,
    agent: Agent,
    context: ExecutionContext
  ): Promise<any> {
    logger.info(`UI Agent执行任务: ${task.type}`);

    const input = task.input as any;
    const prompt = this.buildUIPrompt(task, input);

    // 使用AI生成UI设计
    const aiResponse = await this.aiService.generateResponse(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 解析AI响应
    const design = this.parseUIDesign(aiResponse);

    return {
      type: 'ui_design',
      components: design.components,
      layout: design.layout,
      styles: design.styles,
      metadata: {
        generatedBy: agent.name,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 执行Backend Agent任务
   */
  private async executeBackendTask(
    task: Task,
    agent: Agent,
    context: ExecutionContext
  ): Promise<any> {
    logger.info(`Backend Agent执行任务: ${task.type}`);

    const input = task.input as any;
    const prompt = this.buildBackendPrompt(task, input);

    // 使用AI生成后端代码
    const aiResponse = await this.aiService.generateResponse(prompt, {
      temperature: 0.5,
      maxTokens: 3000,
    });

    // 解析AI响应
    const code = this.parseBackendCode(aiResponse);

    return {
      type: 'backend_code',
      apis: code.apis,
      services: code.services,
      models: code.models,
      metadata: {
        generatedBy: agent.name,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 执行Database Agent任务
   */
  private async executeDatabaseTask(
    task: Task,
    agent: Agent,
    context: ExecutionContext
  ): Promise<any> {
    logger.info(`Database Agent执行任务: ${task.type}`);

    const input = task.input as any;
    const prompt = this.buildDatabasePrompt(task, input);

    // 使用AI生成数据库设计
    const aiResponse = await this.aiService.generateResponse(prompt, {
      temperature: 0.3,
      maxTokens: 2000,
    });

    // 解析AI响应
    const schema = this.parseDatabaseSchema(aiResponse);

    return {
      type: 'database_schema',
      tables: schema.tables,
      relationships: schema.relationships,
      indexes: schema.indexes,
      metadata: {
        generatedBy: agent.name,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 执行Integration Agent任务
   */
  private async executeIntegrationTask(
    task: Task,
    agent: Agent,
    context: ExecutionContext
  ): Promise<any> {
    logger.info(`Integration Agent执行任务: ${task.type}`);

    const input = task.input as any;

    return {
      type: 'integration',
      service: input.service,
      config: input.config,
      status: 'configured',
      metadata: {
        generatedBy: agent.name,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 执行Deployment Agent任务
   */
  private async executeDeploymentTask(
    task: Task,
    agent: Agent,
    context: ExecutionContext
  ): Promise<any> {
    logger.info(`Deployment Agent执行任务: ${task.type}`);

    const input = task.input as any;

    return {
      type: 'deployment',
      environment: input.environment || 'development',
      status: 'deployed',
      url: `https://app-${context.projectId}.example.com`,
      metadata: {
        generatedBy: agent.name,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ========== 辅助方法 ==========

  private buildUIPrompt(task: Task, input: any): string {
    return `
你是一个专业的UI/UX设计师。请根据以下需求设计用户界面：

任务类型: ${task.type}
需求描述: ${input.description || task.description}

请提供：
1. 组件列表和层次结构
2. 布局设计（响应式）
3. 样式建议（颜色、字体、间距）

以JSON格式返回结果。
    `.trim();
  }

  private buildBackendPrompt(task: Task, input: any): string {
    return `
你是一个专业的后端工程师。请根据以下需求实现后端逻辑：

任务类型: ${task.type}
需求描述: ${input.description || task.description}

请提供：
1. API端点定义
2. 业务逻辑实现
3. 数据验证规则

以JSON格式返回结果，包含TypeScript代码。
    `.trim();
  }

  private buildDatabasePrompt(task: Task, input: any): string {
    return `
你是一个专业的数据库架构师。请根据以下需求设计数据库：

任务类型: ${task.type}
需求描述: ${input.description || task.description}

请提供：
1. 表结构定义
2. 关系设计
3. 索引建议

以JSON格式返回结果。
    `.trim();
  }

  private parseUIDesign(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        components: [],
        layout: 'default',
        styles: {},
      };
    }
  }

  private parseBackendCode(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        apis: [],
        services: [],
        models: [],
      };
    }
  }

  private parseDatabaseSchema(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        tables: [],
        relationships: [],
        indexes: [],
      };
    }
  }

  /**
   * 检查任务是否正在执行
   */
  isTaskRunning(taskId: string): boolean {
    return this.runningTasks.get(taskId) || false;
  }

  /**
   * 获取正在执行的任务数量
   */
  getRunningTaskCount(): number {
    return this.runningTasks.size;
  }
}

// 导出单例
export const agentExecutor = new AgentExecutor();
export default agentExecutor;
