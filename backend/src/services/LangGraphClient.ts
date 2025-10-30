/**
 * LangGraph Client
 *
 * 负责与 LangGraph Server 通信，调用各种 Agent
 */

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface LangGraphConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface AgentInput {
  user_request: string;
  context?: any;
  metadata?: {
    user_id?: string;
    session_id?: string;
    project_id?: string;
  };
}

export interface AgentOutput {
  messages: Array<{
    type: string;
    content: string;
    role?: string;
  }>;
  result?: any;
  next_step?: string;
}

export interface StreamChunk {
  type: 'start' | 'message' | 'tool' | 'end' | 'error';
  data: any;
}

/**
 * LangGraph 客户端
 * 连接到 LangGraph Server 并调用各种 Agent
 */
export class LangGraphClient extends EventEmitter {
  private client: AxiosInstance;
  private config: LangGraphConfig;

  constructor(config?: Partial<LangGraphConfig>) {
    super();

    this.config = {
      baseUrl: config?.baseUrl || process.env.LANGGRAPH_SERVER_URL || 'http://localhost:8123',
      timeout: config?.timeout || 120000, // 2分钟超时
      retryAttempts: config?.retryAttempts || 3,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 添加请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`[LangGraphClient] Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('[LangGraphClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`[LangGraphClient] Response: ${response.status}`);
        return response;
      },
      (error) => {
        logger.error('[LangGraphClient] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    logger.info(`[LangGraphClient] Initialized with base URL: ${this.config.baseUrl}`);
  }

  /**
   * 创建新线程
   */
  private async createThread(): Promise<string> {
    try {
      const response = await this.client.post('/threads', {});
      return response.data.thread_id;
    } catch (error) {
      logger.error('[LangGraphClient] Failed to create thread:', error);
      throw new Error('无法创建 LangGraph 线程');
    }
  }

  /**
   * 运行 Agent（非流式）
   */
  private async runAgent(
    agentName: string,
    input: AgentInput,
    threadId?: string
  ): Promise<AgentOutput> {
    try {
      // 如果没有提供线程ID，创建新线程
      const thread = threadId || await this.createThread();

      logger.info(`[LangGraphClient] Running ${agentName} on thread ${thread}`);

      // 调用 LangGraph Server API
      const response = await this.client.post(`/runs`, {
        thread_id: thread,
        assistant_id: agentName,
        input: {
          messages: [
            {
              role: 'user',
              content: input.user_request,
            },
          ],
          ...input.context,
        },
        metadata: input.metadata,
      });

      const runId = response.data.run_id;

      // 轮询获取结果
      const result = await this.pollRunResult(runId, thread);

      logger.info(`[LangGraphClient] ${agentName} completed successfully`);
      return result;

    } catch (error) {
      logger.error(`[LangGraphClient] Failed to run ${agentName}:`, error);
      throw error;
    }
  }

  /**
   * 轮询运行结果
   */
  private async pollRunResult(runId: string, threadId: string): Promise<AgentOutput> {
    const maxAttempts = 60; // 最多轮询60次（每次2秒，共2分钟）
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await this.client.get(`/runs/${runId}`, {
          params: { thread_id: threadId },
        });

        const status = response.data.status;

        if (status === 'success' || status === 'completed') {
          return this.parseRunResult(response.data);
        }

        if (status === 'failed' || status === 'error') {
          throw new Error(response.data.error || 'Agent 执行失败');
        }

        // 仍在运行中，等待2秒后重试
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    }

    throw new Error('Agent 执行超时');
  }

  /**
   * 解析运行结果
   */
  private parseRunResult(data: any): AgentOutput {
    return {
      messages: data.messages || [],
      result: data.output || data.result,
      next_step: data.next_step,
    };
  }

  /**
   * 运行 Builder Agent
   */
  public async runBuilderAgent(request: string, context?: any): Promise<AgentOutput> {
    return this.runAgent('builder_agent', {
      user_request: request,
      context,
    });
  }

  /**
   * 运行 UI Agent
   */
  public async runUIAgent(request: string, context?: any): Promise<AgentOutput> {
    return this.runAgent('ui_agent', {
      user_request: request,
      context,
    });
  }

  /**
   * 运行 Database Agent
   */
  public async runDatabaseAgent(request: string, context?: any): Promise<AgentOutput> {
    return this.runAgent('database_agent', {
      user_request: request,
      context,
    });
  }

  /**
   * 流式运行 Agent
   * 返回一个 EventEmitter，可以监听 'chunk', 'end', 'error' 事件
   */
  public async streamAgent(
    agentName: string,
    input: AgentInput,
    threadId?: string
  ): Promise<EventEmitter> {
    const emitter = new EventEmitter();

    try {
      const thread = threadId || await this.createThread();

      logger.info(`[LangGraphClient] Streaming ${agentName} on thread ${thread}`);

      // 使用流式 API
      const response = await this.client.post(
        `/runs/stream`,
        {
          thread_id: thread,
          assistant_id: agentName,
          input: {
            messages: [
              {
                role: 'user',
                content: input.user_request,
              },
            ],
            ...input.context,
          },
          metadata: input.metadata,
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      // 处理流式响应
      response.data.on('data', (chunk: Buffer) => {
        try {
          const lines = chunk.toString().split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));

              emitter.emit('chunk', {
                type: data.type || 'message',
                data: data,
              });

              // 如果是最后一条消息
              if (data.type === 'end' || data.event === 'end') {
                emitter.emit('end', data);
              }
            }
          }
        } catch (error) {
          logger.error('[LangGraphClient] Failed to parse stream chunk:', error);
        }
      });

      response.data.on('end', () => {
        logger.info(`[LangGraphClient] Stream ended for ${agentName}`);
        emitter.emit('complete');
      });

      response.data.on('error', (error: Error) => {
        logger.error(`[LangGraphClient] Stream error for ${agentName}:`, error);
        emitter.emit('error', error);
      });

    } catch (error) {
      logger.error(`[LangGraphClient] Failed to start stream for ${agentName}:`, error);
      emitter.emit('error', error);
    }

    return emitter;
  }

  /**
   * 带重试的 Agent 执行
   */
  public async runAgentWithRetry(
    agentName: string,
    input: AgentInput,
    maxRetries?: number
  ): Promise<AgentOutput> {
    const retries = maxRetries || this.config.retryAttempts || 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.runAgent(agentName, input);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          logger.warn(
            `[LangGraphClient] ${agentName} failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`,
            lastError.message
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`[LangGraphClient] ${agentName} failed after ${retries} attempts`);
    throw lastError!;
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      logger.error('[LangGraphClient] Health check failed:', error);
      return false;
    }
  }

  /**
   * 获取可用的 Agent 列表
   */
  public async getAvailableAgents(): Promise<string[]> {
    try {
      const response = await this.client.get('/assistants');
      return response.data.assistants || [];
    } catch (error) {
      logger.error('[LangGraphClient] Failed to get available agents:', error);
      return [];
    }
  }
}

// 全局单例
let _langGraphClient: LangGraphClient | null = null;

/**
 * 获取全局 LangGraph 客户端实例
 */
export function getLangGraphClient(): LangGraphClient {
  if (!_langGraphClient) {
    _langGraphClient = new LangGraphClient();
  }
  return _langGraphClient;
}

/**
 * 初始化 LangGraph 客户端（可选配置）
 */
export function initLangGraphClient(config?: Partial<LangGraphConfig>): LangGraphClient {
  _langGraphClient = new LangGraphClient(config);
  return _langGraphClient;
}
