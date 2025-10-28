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
      startTime: new Date(),
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

          const result = await agent.execute(planStep.action, planStep.parameters, request.context);

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
        "dependencies": ["previous_step_ids"]
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
}