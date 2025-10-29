/**
 * Code Generation Service
 *
 * Sprint 2 - US3: AI辅助可视化编辑
 * T053: 实现代码生成引擎
 */

import { AIService } from './AIService';
import { logger } from '../utils/logger';
import type { Component, DataModel, APIEndpoint } from '@prisma/client';

export interface GeneratedCode {
  language: string;
  framework: string;
  files: {
    path: string;
    content: string;
    description: string;
  }[];
}

export interface ComponentCode {
  componentName: string;
  tsx: string;
  css?: string;
  test?: string;
}

export interface APICode {
  route: string;
  controller: string;
  service: string;
  test: string;
}

class CodeGenerationService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * 生成React组件代码
   */
  async generateComponentCode(component: any): Promise<{
    success: boolean;
    data?: ComponentCode;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Generating component: ${component.name}`);

      const systemPrompt = `你是一个React开发专家。请根据组件定义生成高质量的React代码。

要求：
- 使用TypeScript
- 使用函数组件和Hooks
- 使用TailwindCSS进行样式
- 遵循最佳实践和代码规范
- 添加必要的类型定义和注释
`;

      const userPrompt = `组件定义：
名称: ${component.name}
类型: ${component.type}
属性: ${JSON.stringify(component.props, null, 2)}
样式: ${JSON.stringify(component.styles, null, 2)}
数据绑定: ${JSON.stringify(component.dataBinding, null, 2)}
事件: ${JSON.stringify(component.events, null, 2)}

请生成完整的TSX代码。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        
        temperature: 0.2,
        maxTokens: 2000,
      });

      if (!response || !response) {
        return {
          success: false,
          error: '代码生成失败',
        };
      }

      return {
        success: true,
        data: {
          componentName: component.name,
          tsx: response,
        },
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating component:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 生成API端点代码
   */
  async generateAPICode(endpoint: any): Promise<{
    success: boolean;
    data?: APICode;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Generating API: ${endpoint.method} ${endpoint.path}`);

      const systemPrompt = `你是一个Node.js后端开发专家。请根据API定义生成高质量的Express代码。

要求：
- 使用TypeScript
- 使用Express.js框架
- 包含输入验证
- 包含错误处理
- 遵循RESTful规范
- 添加必要的注释
`;

      const userPrompt = `API端点定义：
路径: ${endpoint.path}
方法: ${endpoint.method}
请求Schema: ${JSON.stringify(endpoint.requestSchema, null, 2)}
响应Schema: ${JSON.stringify(endpoint.responseSchema, null, 2)}
业务逻辑: ${endpoint.businessLogic || '基本CRUD操作'}

请生成完整的代码，包括路由、控制器和服务层。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        
        temperature: 0.2,
        maxTokens: 2000,
      });

      if (!response || !response) {
        return {
          success: false,
          error: '代码生成失败',
        };
      }

      return {
        success: true,
        data: {
          route: response,
          controller: response,
          service: response,
          test: '',
        },
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating API:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 生成数据库迁移脚本
   */
  async generateMigrationScript(dataModel: any): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Generating migration for: ${dataModel.tableName}`);

      const systemPrompt = `你是一个数据库专家。请根据数据模型定义生成Prisma迁移脚本。

要求：
- 使用Prisma Schema语法
- 包含所有字段定义
- 包含索引和关系
- 包含必要的注释
`;

      const userPrompt = `数据模型定义：
表名: ${dataModel.tableName}
字段: ${JSON.stringify(dataModel.fields, null, 2)}
关系: ${JSON.stringify(dataModel.relationships, null, 2)}
索引: ${JSON.stringify(dataModel.indexes, null, 2)}

请生成Prisma Schema定义。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        
        temperature: 0.1,
        maxTokens: 1000,
      });

      if (!response || !response) {
        return {
          success: false,
          error: '迁移脚本生成失败',
        };
      }

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating migration:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 导出完整项目代码
   */
  async exportProjectCode(projectId: string): Promise<{
    success: boolean;
    data?: GeneratedCode;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Exporting project code: ${projectId}`);

      const prisma = (await import('@prisma/client')).PrismaClient;
      const db = new prisma();

      try {
        // 获取项目信息
        const project = await db.project.findUnique({
          where: { id: projectId },
          include: {
            components: true,
            dataModels: true,
            apiEndpoints: true,
          },
        });

        if (!project) {
          return {
            success: false,
            error: '项目不存在',
          };
        }

        const files: GeneratedCode['files'] = [];

        // 1. 生成 package.json
        files.push({
          path: 'package.json',
          content: JSON.stringify(
            {
              name: project.name.toLowerCase().replace(/\s+/g, '-'),
              version: project.currentVersion || '1.0.0',
              description: project.description,
              scripts: {
                dev: 'concurrently "npm run dev:frontend" "npm run dev:backend"',
                'dev:frontend': 'cd frontend && npm run dev',
                'dev:backend': 'cd backend && npm run dev',
                build: 'npm run build:frontend && npm run build:backend',
                'build:frontend': 'cd frontend && npm run build',
                'build:backend': 'cd backend && npm run build',
              },
            },
            null,
            2
          ),
          description: '项目配置文件',
        });

        // 2. 生成前端组件代码
        for (const component of project.components) {
          const componentCode = await this.generateComponentCode(component);
          if (componentCode.success && componentCode.data) {
            files.push({
              path: `frontend/src/components/${component.name}.tsx`,
              content: componentCode.data.tsx,
              description: `${component.name} 组件`,
            });
          }
        }

        // 3. 生成数据模型代码
        for (const dataModel of project.dataModels) {
          const migrationCode = await this.generateMigrationScript(dataModel);
          if (migrationCode.success && migrationCode.data) {
            files.push({
              path: `backend/prisma/schema/${dataModel.tableName}.prisma`,
              content: migrationCode.data,
              description: `${dataModel.tableName} 数据模型`,
            });
          }
        }

        // 4. 生成 API 端点代码
        for (const endpoint of project.apiEndpoints) {
          const apiCode = await this.generateAPICode(endpoint);
          if (apiCode.success && apiCode.data) {
            const routeName = endpoint.path.split('/').filter(Boolean).join('-');
            files.push({
              path: `backend/src/routes/${routeName}.ts`,
              content: apiCode.data.route,
              description: `${endpoint.method} ${endpoint.path} API`,
            });
          }
        }

        // 5. 生成 README.md
        files.push({
          path: 'README.md',
          content: this.generateReadme(project),
          description: '项目说明文档',
        });

        // 6. 生成 .env.example
        files.push({
          path: '.env.example',
          content: this.generateEnvExample(),
          description: '环境变量示例',
        });

        // 7. 生成 Docker 配置
        files.push({
          path: 'Dockerfile',
          content: this.generateDockerfile(),
          description: 'Docker 镜像配置',
        });

        files.push({
          path: 'docker-compose.yml',
          content: this.generateDockerCompose(),
          description: 'Docker Compose 配置',
        });

        return {
          success: true,
          data: {
            language: 'TypeScript',
            framework: 'React + Express',
            files,
          },
        };
      } finally {
        await db.$disconnect();
      }
    } catch (error: any) {
      logger.error('[CodeGen] Error exporting project:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 生成 README.md
   */
  private generateReadme(project: any): string {
    return `# ${project.name}

${project.description || '由 AI-Native Builder 生成的应用程序'}

## 功能特性

- 前端：React + TypeScript + Vite
- 后端：Node.js + Express + Prisma
- 数据库：PostgreSQL

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### 安装依赖

\`\`\`bash
# 安装前端依赖
cd frontend && npm install

# 安装后端依赖
cd backend && npm install
\`\`\`

### 配置环境变量

\`\`\`bash
# 复制环境变量示例
cp .env.example .env

# 编辑 .env 文件，配置数据库等信息
\`\`\`

### 启动开发服务器

\`\`\`bash
# 启动前端和后端
npm run dev
\`\`\`

- 前端: http://localhost:12000
- 后端 API: http://localhost:3001

## 项目结构

\`\`\`
.
├── frontend/          # React 前端
│   ├── src/
│   │   ├── components/  # React 组件
│   │   ├── pages/       # 页面
│   │   └── services/    # API 服务
│   └── package.json
├── backend/           # Express 后端
│   ├── src/
│   │   ├── routes/      # API 路由
│   │   ├── services/    # 业务逻辑
│   │   └── middleware/  # 中间件
│   └── prisma/          # 数据库 Schema
└── package.json
\`\`\`

## 许可证

MIT

---

由 [AI-Native Builder](https://github.com/yourusername/ai-builder-studio) 自动生成
`;
  }

  /**
   * 生成 .env.example
   */
  private generateEnvExample(): string {
    return `# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# 服务器端口
PORT=3001
FRONTEND_PORT=12000

# JWT 密钥
JWT_SECRET=your-secret-key-here

# Redis 配置
REDIS_URL=redis://localhost:6379

# AI 服务配置
AI_MODEL_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
# 或使用 Anthropic
# AI_MODEL_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-xxx

# 前端 URL
FRONTEND_URL=http://localhost:12000

# 环境
NODE_ENV=development
`;
  }

  /**
   * 生成 Dockerfile
   */
  private generateDockerfile(): string {
    return `# 多阶段构建
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# 生产镜像
FROM node:18-alpine
WORKDIR /app

# 复制后端构建产物
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# 复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 安装生产依赖
WORKDIR /app/backend
RUN npm ci --only=production

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["node", "dist/index.js"]
`;
  }

  /**
   * 生成 docker-compose.yml
   */
  private generateDockerCompose(): string {
    return `version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/app_db
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
`;
  }

  /**
   * 生成测试代码
   */
  async generateTestCode(target: {
    type: 'component' | 'api';
    code: string;
    name: string;
  }): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Generating test for ${target.type}: ${target.name}`);

      const systemPrompt = `你是一个测试工程师。请为给定的代码生成完整的单元测试。

要求：
- 使用Jest测试框架
- ${target.type === 'component' ? '使用React Testing Library' : '使用Supertest'}
- 覆盖主要功能和边界情况
- 包含清晰的测试描述
`;

      const userPrompt = `${target.type === 'component' ? '组件' : 'API'}代码：\n${target.code}\n\n请生成完整的测试代码。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        
        temperature: 0.2,
        maxTokens: 1500,
      });

      if (!response || !response) {
        return {
          success: false,
          error: '测试代码生成失败',
        };
      }

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating test:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * T053: 批量生成组件代码（从自然语言描述）
   */
  async generateComponentsFromNL(description: string): Promise<{
    success: boolean;
    data?: Array<{
      component: any;
      code: ComponentCode;
    }>;
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Generating components from NL: ${description}`);

      const systemPrompt = `你是一个UI/UX专家和React开发者。根据用户的自然语言描述，生成组件定义和代码。

要求：
1. 分析描述，识别需要的UI组件
2. 为每个组件生成完整的定义（类型、属性、样式、数据绑定、事件）
3. 生成高质量的React/TypeScript代码
4. 返回JSON格式，包含组件列表

返回格式：
{
  "components": [
    {
      "type": "组件类型",
      "name": "组件名称",
      "props": { 属性对象 },
      "styles": { 样式对象 },
      "dataBinding": { 数据绑定 },
      "events": [ 事件列表 ]
    }
  ]
}`;

      const userPrompt = `用户描述：\n${description}\n\n请生成组件定义和代码。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        
        temperature: 0.3,
        maxTokens: 3000,
      });

      if (!response) {
        return {
          success: false,
          error: '组件生成失败',
        };
      }

      // 解析JSON响应
      let parsedData;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          parsedData = JSON.parse(response);
        }
      } catch (e) {
        logger.warn('[CodeGen] Failed to parse JSON, using fallback');
        return {
          success: false,
          error: '无法解析AI响应',
        };
      }

      const components = parsedData.components || [];
      const results = [];

      // 为每个组件生成代码
      for (const comp of components) {
        const codeResult = await this.generateComponentCode(comp);
        if (codeResult.success && codeResult.data) {
          results.push({
            component: comp,
            code: codeResult.data,
          });
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating components from NL:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * T060: 解析自然语言修改命令
   */
  async parseModificationCommand(
    command: string,
    currentComponents: any[]
  ): Promise<{
    success: boolean;
    data?: {
      action: 'add' | 'update' | 'delete' | 'move' | 'style';
      targetId?: string;
      targetType?: string;
      modifications: any;
      reasoning: string;
    };
    error?: string;
  }> {
    try {
      logger.info(`[CodeGen] Parsing modification command: ${command}`);

      const systemPrompt = `你是一个UI修改命令解析专家。分析用户的自然语言修改指令，并转换为结构化的修改操作。

返回JSON格式：
{
  "action": "add|update|delete|move|style",
  "targetId": "目标组件ID（如果适用）",
  "targetType": "目标组件类型（如果是新增）",
  "modifications": {
    "props": { 属性修改 },
    "styles": { 样式修改 },
    "position": { 位置修改 }
  },
  "reasoning": "操作原因说明"
}`;

      const userPrompt = `当前组件：\n${JSON.stringify(
        currentComponents,
        null,
        2
      )}\n\n用户命令：${command}\n\n请解析并返回修改操作。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        
        temperature: 0.2,
        maxTokens: 1000,
      });

      if (!response) {
        return {
          success: false,
          error: '命令解析失败',
        };
      }

      // 解析JSON
      let parsedData;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          parsedData = JSON.parse(response);
        }
      } catch (e) {
        return {
          success: false,
          error: '无法解析AI响应',
        };
      }

      return {
        success: true,
        data: parsedData,
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error parsing modification command:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * T061: 生成AI设计建议
   */
  async generateDesignSuggestions(
    components: any[],
    context?: string
  ): Promise<{
    success: boolean;
    data?: Array<{
      type: 'improvement' | 'accessibility' | 'performance' | 'ux';
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      actionable: boolean;
    }>;
    error?: string;
  }> {
    try {
      logger.info('[CodeGen] Generating design suggestions');

      const systemPrompt = `你是一个UX/UI设计专家。分析当前的组件布局，提供改进建议。

关注点：
1. 用户体验和可用性
2. 可访问性（WCAG标准）
3. 性能优化
4. 视觉设计和一致性

返回JSON格式：
{
  "suggestions": [
    {
      "type": "improvement|accessibility|performance|ux",
      "title": "建议标题",
      "description": "详细说明",
      "priority": "high|medium|low",
      "actionable": true|false
    }
  ]
}`;

      const userPrompt = `当前组件：\n${JSON.stringify(
        components,
        null,
        2
      )}\n\n${context ? `上下文：${context}\n\n` : ''}请提供设计改进建议。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        
        temperature: 0.4,
        maxTokens: 2000,
      });

      if (!response) {
        return {
          success: false,
          error: '建议生成失败',
        };
      }

      // 解析JSON
      let parsedData;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          parsedData = JSON.parse(response);
        }
      } catch (e) {
        return {
          success: false,
          error: '无法解析AI响应',
        };
      }

      return {
        success: true,
        data: parsedData.suggestions || [],
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating design suggestions:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * T062: 生成智能警告
   */
  async generateSmartWarnings(
    components: any[],
    recentChanges?: any[]
  ): Promise<{
    success: boolean;
    data?: Array<{
      level: 'error' | 'warning' | 'info';
      category: 'accessibility' | 'usability' | 'performance' | 'consistency';
      message: string;
      componentId?: string;
      suggestion?: string;
    }>;
    error?: string;
  }> {
    try {
      logger.info('[CodeGen] Generating smart warnings');

      const systemPrompt = `你是一个代码质量和设计规范检查专家。分析组件配置，识别潜在问题。

检查项：
1. 可访问性问题（缺少alt文本、对比度不足等）
2. 可用性问题（按钮太小、文字太小等）
3. 性能问题（大型表格、过度嵌套等）
4. 一致性问题（样式不统一、命名不规范等）

返回JSON格式：
{
  "warnings": [
    {
      "level": "error|warning|info",
      "category": "accessibility|usability|performance|consistency",
      "message": "问题描述",
      "componentId": "受影响的组件ID",
      "suggestion": "改进建议"
    }
  ]
}`;

      const userPrompt = `当前组件：\n${JSON.stringify(
        components,
        null,
        2
      )}\n\n${
        recentChanges ? `最近修改：\n${JSON.stringify(recentChanges, null, 2)}\n\n` : ''
      }请检查并返回警告列表。`;

      const response = await this.aiService.generateResponse(userPrompt, {
        systemPrompt,
        
        temperature: 0.2,
        maxTokens: 2000,
      });

      if (!response) {
        return {
          success: false,
          error: '警告生成失败',
        };
      }

      // 解析JSON
      let parsedData;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          parsedData = JSON.parse(response);
        }
      } catch (e) {
        return {
          success: false,
          error: '无法解析AI响应',
        };
      }

      return {
        success: true,
        data: parsedData.warnings || [],
      };
    } catch (error: any) {
      logger.error('[CodeGen] Error generating smart warnings:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new CodeGenerationService();
