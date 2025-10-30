import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { AIService } from './AIService';
import { UIAgent } from '../agents/UIAgent';
import { BackendAgent } from '../agents/BackendAgent';
import { DatabaseAgent } from '../agents/DatabaseAgent';
import { IntegrationAgent } from '../agents/IntegrationAgent';
import { DeploymentAgent } from '../agents/DeploymentAgent';
import { agentStatusTracker, AgentType } from './AgentStatusTracker';
import visualizationService from './VisualizationService';
import errorClassifier from './ErrorClassifier';
import { AgentErrorRecord } from '../models/AgentErrorRecord.model';

export interface AgentRequest {
  requestId: string;
  userId: string;
  projectId: string;
  type: 'create_app' | 'modify_app' | 'deploy_app' | 'integrate_service';
  description: string;
  context?: any;
  requirements?: string[];
  constraints?: string[];
}

export interface AgentResponse {
  requestId: string;
  success: boolean;
  result?: any;
  error?: string;
  steps: AgentStep[];
  estimatedTime?: number;
  progress?: number;
}

export interface AgentStep {
  agentType: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: Date;
}

export class AgentOrchestrator extends EventEmitter {
  private static instance: AgentOrchestrator;
  private aiService: AIService;
  private agents: Map<string, any>;
  private activeRequests: Map<string, AgentRequest>;

  private constructor() {
    super();
    this.aiService = new AIService();
    this.agents = new Map();
    this.activeRequests = new Map();
    this.initializeAgents();
  }

  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  private initializeAgents(): void {
    this.agents.set('ui', new UIAgent(this.aiService));
    this.agents.set('backend', new BackendAgent(this.aiService));
    this.agents.set('database', new DatabaseAgent(this.aiService));
    this.agents.set('integration', new IntegrationAgent(this.aiService));
    this.agents.set('deployment', new DeploymentAgent(this.aiService));

    logger.info('Agent orchestrator initialized with all specialized agents');
  }

  public async processRequest(request: AgentRequest): Promise<AgentResponse> {
    logger.info(`Processing agent request: ${request.requestId}`);

    this.activeRequests.set(request.requestId, request);

    // Create visualization session
    const sessionResult = await visualizationService.createSession({
      sessionId: request.requestId,
      userId: request.userId,
      projectId: request.projectId,
      startTime: new Date().toISOString(),
      status: 'in_progress',
      agentList: [],
      archived: false,
    });

    if (!sessionResult.success) {
      logger.error('Failed to create visualization session:', sessionResult.error);
    }

    try {
      // Parse the request and determine the execution plan
      const executionPlan = await this.createExecutionPlan(request);

      // Execute the plan step by step
      const steps: AgentStep[] = [];
      const agentStatusIds: Map<string, string> = new Map(); // agentType -> statusId
      let progress = 0;

      for (const planStep of executionPlan) {
        const step: AgentStep = {
          agentType: planStep.agentType,
          action: planStep.action,
          status: 'in_progress',
          timestamp: new Date()
        };

        steps.push(step);
        this.emit('step_started', { requestId: request.requestId, step });

        // Start agent tracking with WebSocket push
        const agentType = this.mapAgentTypeToEnum(planStep.agentType);
        const startResult = await agentStatusTracker.startAgent({
          sessionId: request.requestId,
          agentType,
          taskDescription: planStep.action,
          estimatedDuration: planStep.estimatedDuration,
        });

        if (startResult.success && startResult.data) {
          agentStatusIds.set(planStep.agentType, startResult.data.statusId);
        }

        try {
          const agent = this.agents.get(planStep.agentType);
          if (!agent) {
            throw new Error(`Agent not found: ${planStep.agentType}`);
          }

          // T115: Execute with exponential backoff retry for minor errors
          const result = await this.executeAgentWithRetry(
            agent,
            planStep,
            request,
            agentStatusIds.get(planStep.agentType)
          );

          step.status = 'completed';
          step.result = result;
          progress += (100 / executionPlan.length);

          this.emit('step_completed', { requestId: request.requestId, step, progress });

          // Complete agent tracking with WebSocket push
          const statusId = agentStatusIds.get(planStep.agentType);
          if (statusId) {
            await agentStatusTracker.completeAgent({
              statusId,
              resultSummary: typeof result === 'string' ? result : JSON.stringify(result).substring(0, 200),
            });
          }

        } catch (error) {
          step.status = 'failed';
          step.error = error instanceof Error ? error.message : 'Unknown error';

          this.emit('step_failed', { requestId: request.requestId, step, error });

          // T116: Record error to AgentErrorRecord
          await this.recordAgentError(request.requestId, planStep.agentType, error);

          // Fail agent tracking with WebSocket push
          const statusId = agentStatusIds.get(planStep.agentType);
          if (statusId) {
            await agentStatusTracker.failAgent({
              statusId,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              canRetry: !planStep.critical,
            });
          }

          // Decide whether to continue or abort based on step criticality
          if (planStep.critical) {
            throw error;
          }
        }
      }

      const response: AgentResponse = {
        requestId: request.requestId,
        success: true,
        steps,
        progress: 100,
        result: this.consolidateResults(steps)
      };

      // Update session status to success
      await visualizationService.updateSessionStatus(request.requestId, 'success', new Date());

      this.activeRequests.delete(request.requestId);
      this.emit('request_completed', response);

      return response;

    } catch (error) {
      logger.error(`Agent request failed: ${request.requestId}`, error);

      // Update session status to failed
      await visualizationService.updateSessionStatus(request.requestId, 'failed', new Date());

      const response: AgentResponse = {
        requestId: request.requestId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        steps: []
      };

      this.activeRequests.delete(request.requestId);
      this.emit('request_failed', response);

      return response;
    }
  }

  /**
   * Map agent type string to AgentType enum
   */
  private mapAgentTypeToEnum(agentType: string): AgentType {
    const mapping: Record<string, AgentType> = {
      'ui': 'UIAgent',
      'backend': 'BackendAgent',
      'database': 'DatabaseAgent',
      'integration': 'IntegrationAgent',
      'deployment': 'DeploymentAgent',
    };
    return mapping[agentType] || 'UIAgent';
  }

  /**
   * T027: 需求分解逻辑
   * 将用户需求分解为可执行的任务列表
   */
  async decomposeRequirement(requirementText: string, nlpAnalysis?: any): Promise<any[]> {
    try {
      logger.info('[AgentOrchestrator] Decomposing requirement...');

      // 构建更详细的分解提示词
      const systemPrompt = `你是一个专业的项目规划专家。将用户的应用需求分解为具体的、可执行的任务。

每个任务应该包含：
- taskId: 唯一标识符（如 "task-1"）
- agentType: 负责的 Agent 类型（ui/backend/database/integration/deployment）
- action: 具体操作描述
- parameters: 任务参数（对象）
- dependencies: 依赖的任务ID列表
- estimatedDuration: 预估耗时（秒）
- critical: 是否关键任务（失败后中止整个流程）

返回 JSON 数组格式。`;

      const userPrompt = `
需求描述：${requirementText}

${nlpAnalysis ? `AI 分析结果：
- 应用类型：${nlpAnalysis.appType}
- 功能列表：${nlpAnalysis.features?.join(', ')}
- 数据实体：${nlpAnalysis.entities?.join(', ')}
- 复杂度：${nlpAnalysis.complexity}
` : ''}

请将上述需求分解为具体的任务列表。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 2000,
      });

      const tasks = this.parseExecutionPlan(response);
      logger.info(`[AgentOrchestrator] Decomposed into ${tasks.length} tasks`);

      return tasks;
    } catch (error) {
      logger.error('[AgentOrchestrator] Error decomposing requirement:', error);
      throw error;
    }
  }

  /**
   * T028: 构建任务依赖图
   * 基于任务的依赖关系构建 DAG（有向无环图）
   */
  buildDependencyGraph(tasks: any[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const task of tasks) {
      graph.set(task.taskId || task.id, task.dependencies || []);
    }

    // 验证是否存在循环依赖
    this.validateNoCycles(graph);

    logger.info('[AgentOrchestrator] Dependency graph built successfully');
    return graph;
  }

  /**
   * 验证依赖图中没有循环依赖
   */
  private validateNoCycles(graph: Map<string, string[]>): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node) && hasCycle(node)) {
        throw new Error('检测到循环依赖，无法执行任务');
      }
    }
  }

  /**
   * T029: 任务调度
   * 按依赖关系调度任务，支持并行执行独立任务
   */
  async scheduleTask(taskId: string, allTasks: any[], graph: Map<string, string[]>): Promise<void> {
    const task = allTasks.find(t => (t.taskId || t.id) === taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }

    // 检查依赖是否已完成
    const dependencies = graph.get(taskId) || [];
    for (const depId of dependencies) {
      const depTask = allTasks.find(t => (t.taskId || t.id) === depId);
      if (depTask && depTask.status !== 'completed') {
        logger.warn(`[AgentOrchestrator] Task ${taskId} waiting for dependency ${depId}`);
        throw new Error(`依赖任务 ${depId} 尚未完成`);
      }
    }

    // 执行任务
    logger.info(`[AgentOrchestrator] Scheduling task: ${taskId}`);
    task.status = 'running';

    const agent = this.agents.get(task.agentType);
    if (!agent) {
      throw new Error(`Agent 不存在: ${task.agentType}`);
    }

    try {
      const result = await agent.execute(task.action, task.parameters, {
        projectId: task.projectId,
        userId: task.userId,
      });

      task.status = 'completed';
      task.result = result;
      logger.info(`[AgentOrchestrator] Task completed: ${taskId}`);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[AgentOrchestrator] Task failed: ${taskId}`, error);
      throw error;
    }
  }

  /**
   * 拓扑排序，获取任务执行顺序
   */
  private topologicalSort(graph: Map<string, string[]>): string[] {
    const inDegree = new Map<string, number>();
    const result: string[] = [];

    // 计算入度
    for (const node of graph.keys()) {
      inDegree.set(node, 0);
    }
    for (const [_, dependencies] of graph.entries()) {
      for (const dep of dependencies) {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }

    // 找到所有入度为 0 的节点
    const queue: string[] = [];
    for (const [node, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(node);
      }
    }

    // BFS 遍历
    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);

      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        const newDegree = (inDegree.get(dep) || 0) - 1;
        inDegree.set(dep, newDegree);
        if (newDegree === 0) {
          queue.push(dep);
        }
      }
    }

    return result;
  }

  private async createExecutionPlan(request: AgentRequest): Promise<any[]> {
    const prompt = `
    Analyze this app building request and create an execution plan:

    Request Type: ${request.type}
    Description: ${request.description}
    Requirements: ${request.requirements?.join(', ') || 'None specified'}
    Constraints: ${request.constraints?.join(', ') || 'None specified'}

    Available agents:
    - ui: Creates user interfaces, components, layouts
    - backend: Handles APIs, business logic, server-side code
    - database: Designs schemas, manages data models
    - integration: Connects external services and APIs
    - deployment: Handles app deployment and infrastructure

    Create a step-by-step execution plan with the following format:
    [
      {
        "agentType": "agent_name",
        "action": "specific_action_description",
        "parameters": { "key": "value" },
        "critical": true/false,
        "dependencies": ["previous_step_ids"],
        "estimatedDuration": 10
      }
    ]

    Consider dependencies between steps and mark critical steps that would cause the entire process to fail if they don't succeed.
    `;

    try {
      const planResponse = await this.aiService.generateResponse(prompt, {
        temperature: 0.3,
        maxTokens: 2000
      });

      // Parse the AI response to extract the execution plan
      const plan = this.parseExecutionPlan(planResponse);

      logger.info(`Created execution plan with ${plan.length} steps for request ${request.requestId}`);

      return plan;

    } catch (error) {
      logger.error('Failed to create execution plan:', error);

      // Fallback to a basic plan based on request type
      return this.createFallbackPlan(request);
    }
  }

  private parseExecutionPlan(response: string): any[] {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, create a basic plan
      throw new Error('No valid JSON plan found in AI response');
      
    } catch (error) {
      logger.warn('Failed to parse AI execution plan, using fallback');
      throw error;
    }
  }

  private createFallbackPlan(request: AgentRequest): any[] {
    const basePlan = [];
    
    switch (request.type) {
      case 'create_app':
        basePlan.push(
          { agentType: 'database', action: 'design_schema', parameters: {}, critical: true },
          { agentType: 'backend', action: 'create_api', parameters: {}, critical: true },
          { agentType: 'ui', action: 'create_interface', parameters: {}, critical: true }
        );
        break;
        
      case 'modify_app':
        basePlan.push(
          { agentType: 'ui', action: 'modify_interface', parameters: {}, critical: false },
          { agentType: 'backend', action: 'update_api', parameters: {}, critical: false }
        );
        break;
        
      case 'deploy_app':
        basePlan.push(
          { agentType: 'deployment', action: 'deploy_application', parameters: {}, critical: true }
        );
        break;
        
      case 'integrate_service':
        basePlan.push(
          { agentType: 'integration', action: 'setup_integration', parameters: {}, critical: true },
          { agentType: 'backend', action: 'update_api', parameters: {}, critical: false }
        );
        break;
        
      default:
        basePlan.push(
          { agentType: 'ui', action: 'analyze_request', parameters: {}, critical: true }
        );
    }
    
    return basePlan;
  }

  private consolidateResults(steps: AgentStep[]): any {
    const results = {
      completedSteps: steps.filter(s => s.status === 'completed').length,
      totalSteps: steps.length,
      outputs: {},
      artifacts: []
    };
    
    steps.forEach(step => {
      if (step.result) {
        results.outputs[step.agentType] = step.result;
        
        if (step.result.artifacts) {
          results.artifacts.push(...step.result.artifacts);
        }
      }
    });
    
    return results;
  }

  public getActiveRequests(): AgentRequest[] {
    return Array.from(this.activeRequests.values());
  }

  /**
   * T041: 错误处理和重试逻辑
   * 实现指数退避重试策略
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      taskName?: string;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      taskName = 'operation',
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) {
          logger.error(`[AgentOrchestrator] ${taskName} failed after ${maxRetries} attempts:`, lastError);
          break;
        }

        // 计算退避延迟（指数增长）
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        logger.warn(`[AgentOrchestrator] ${taskName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, lastError.message);

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * 包装 Agent 执行，添加超时和错误处理
   */
  private async executeAgentWithTimeout(
    agent: any,
    action: string,
    parameters: any,
    context: any,
    timeoutMs: number = 60000
  ): Promise<any> {
    return Promise.race([
      agent.execute(action, parameters, context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Agent 执行超时（${timeoutMs}ms）`)), timeoutMs)
      ),
    ]);
  }

  /**
   * 处理任务失败，决定是否应该重试
   */
  private shouldRetryTask(task: any, error: Error): boolean {
    // 不重试的情况
    if (task.retryCount >= 3) {
      return false;
    }

    // 验证错误不重试
    if (error.message.includes('验证') || error.message.includes('validation')) {
      return false;
    }

    // 超时或临时错误可以重试
    if (
      error.message.includes('超时') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT')
    ) {
      return true;
    }

    // 默认关键任务不重试，非关键任务可以重试
    return !task.critical;
  }

  public cancelRequest(requestId: string): boolean {
    if (this.activeRequests.has(requestId)) {
      this.activeRequests.delete(requestId);
      this.emit('request_cancelled', { requestId });
      return true;
    }
    return false;
  }

  public getAgentStatus(): any {
    const status = {};

    this.agents.forEach((agent, type) => {
      status[type] = {
        available: agent.isAvailable(),
        activeJobs: agent.getActiveJobs?.() || 0,
        lastActivity: agent.getLastActivity?.() || null
      };
    });

    return {
      totalAgents: this.agents.size,
      activeRequests: this.activeRequests.size,
      agents: status
    };
  }

  /**
   * T115: Execute agent with intelligent retry mechanism
   * Implements exponential backoff retry for minor errors (1s, 2s, 4s)
   */
  private async executeAgentWithRetry(
    agent: any,
    planStep: any,
    request: AgentRequest,
    statusId?: string
  ): Promise<any> {
    let retryCount = 0;
    let lastError: Error;

    while (retryCount <= 3) {
      try {
        // Execute the agent task
        const result = await agent.execute(
          planStep.action,
          planStep.parameters,
          request.context
        );

        // Success - return result
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Classify the error
        const classification = errorClassifier.classify(lastError);

        // Check if we should retry
        if (classification.isRetryable && retryCount < 3) {
          retryCount++;

          // Calculate backoff delay (1s, 2s, 4s)
          const delay = errorClassifier.calculateBackoffDelay(retryCount - 1, 1000);

          logger.warn(
            `[AgentOrchestrator] ${planStep.agentType} failed (attempt ${retryCount}/3): ${lastError.message}. Retrying in ${delay}ms...`
          );

          // T117: Emit error-occurred WebSocket event with retry state
          this.emit('agent-error', {
            sessionId: request.requestId,
            agentType: planStep.agentType,
            error: lastError.message,
            classification,
            retryCount,
            maxRetries: 3,
            retrying: true,
            delay,
          });

          // Update agent status to retrying
          if (statusId) {
            await agentStatusTracker.updateAgentStatus({
              statusId,
              status: 'retrying',
              currentTask: `${planStep.action} (重试 ${retryCount}/3)`,
            });
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));

          continue;
        }

        // Cannot retry or max retries reached
        logger.error(
          `[AgentOrchestrator] ${planStep.agentType} failed after ${retryCount} retries: ${lastError.message}`
        );

        // T117: Emit error-occurred WebSocket event (final failure)
        this.emit('agent-error', {
          sessionId: request.requestId,
          agentType: planStep.agentType,
          error: lastError.message,
          classification,
          retryCount,
          maxRetries: 3,
          retrying: false,
          critical: planStep.critical,
        });

        throw lastError;
      }
    }

    throw lastError!;
  }

  /**
   * T116: Record error to AgentErrorRecord model
   */
  private async recordAgentError(
    sessionId: string,
    agentType: string,
    error: any
  ): Promise<void> {
    try {
      const classification = errorClassifier.classify(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      await AgentErrorRecord.create({
        sessionId,
        agentType: this.mapAgentTypeToEnum(agentType),
        errorCode: classification.category.toUpperCase(),
        errorMessage,
        errorContext: {
          stack: errorStack,
          classification: {
            severity: classification.severity,
            category: classification.category,
            isRetryable: classification.isRetryable,
            suggestedAction: classification.suggestedAction,
          },
        },
        severity: this.mapErrorSeverity(classification.severity),
        resolution: classification.isRetryable ? 'retrying' : 'user_intervention_required',
        timestamp: new Date(),
      });

      logger.info(`[AgentOrchestrator] Recorded error for ${agentType} in session ${sessionId}`);
    } catch (recordError) {
      logger.error('[AgentOrchestrator] Failed to record error:', recordError);
    }
  }

  /**
   * Map ErrorClassifier severity to model severity
   */
  private mapErrorSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    const mapping: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      'fatal': 'critical',
      'critical': 'critical',
      'moderate': 'medium',
      'minor': 'low',
    };
    return mapping[severity] || 'medium';
  }
}