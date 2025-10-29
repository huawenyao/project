# 贡献指南

感谢您对 AI-Native Builder 项目的关注！我们欢迎所有形式的贡献。

## 目录

- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [开发工作流](#开发工作流)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试指南](#测试指南)
- [文档编写](#文档编写)

---

## 开发环境设置

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14
- Redis >= 6.0
- Git

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/yourusername/ai-builder-studio.git
cd ai-builder-studio
```

2. **安装依赖**

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend && npm install

# 安装后端依赖
cd backend && npm install
```

3. **配置环境变量**

```bash
# 复制环境变量示例文件
cp .env.example .env
```

编辑 `.env` 文件,配置以下内容:

```env
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/ai_builder

# Redis
REDIS_URL=redis://localhost:6379

# AI 服务 (选择一个)
AI_MODEL_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
# 或
AI_MODEL_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# JWT
JWT_SECRET=your-secret-key

# 服务器端口
PORT=3001
FRONTEND_URL=http://localhost:12000
```

4. **初始化数据库**

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

5. **启动开发服务器**

```bash
# 方式1: 同时启动前后端 (推荐)
npm run dev

# 方式2: 分别启动
npm run dev:frontend  # 前端 (端口 12000)
npm run dev:backend   # 后端 (端口 3001)
```

访问 http://localhost:12000 查看应用

---

## 项目结构

```
ai-builder-studio/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/    # React 组件
│   │   │   ├── Builder/   # 构建器相关组件
│   │   │   ├── Chat/      # 聊天界面组件
│   │   │   ├── UI/        # 通用 UI 组件
│   │   │   └── ...
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── stores/        # Zustand 状态管理
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── types/         # TypeScript 类型
│   │   └── utils/         # 工具函数
│   └── package.json
│
├── backend/               # Express 后端
│   ├── src/
│   │   ├── agents/        # AI Agent 实现
│   │   │   ├── BaseAgent.ts
│   │   │   ├── UIAgent.ts
│   │   │   ├── BackendAgent.ts
│   │   │   └── ...
│   │   ├── services/      # 业务逻辑服务
│   │   │   ├── AIService.ts
│   │   │   ├── AgentOrchestrator.ts
│   │   │   ├── CodeGenerationService.ts
│   │   │   ├── CodeReviewService.ts
│   │   │   └── ...
│   │   ├── routes/        # API 路由
│   │   ├── middleware/    # Express 中间件
│   │   ├── utils/         # 工具函数
│   │   └── types/         # TypeScript 类型
│   ├── prisma/
│   │   └── schema.prisma  # 数据库 Schema
│   └── package.json
│
├── docs/                  # 文档
│   ├── API.md            # API 文档
│   └── ...
│
├── specs/                 # 功能规格
│   ├── 001-ai-native-transformation/
│   │   ├── spec.md       # 功能规格
│   │   ├── tasks.md      # 任务清单
│   │   └── ...
│   └── ...
│
└── .github/
    └── workflows/         # CI/CD 配置
```

---

## 开发工作流

### 1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/bug-description
```

分支命名规范:
- `feature/*` - 新功能
- `fix/*` - Bug 修复
- `docs/*` - 文档更新
- `refactor/*` - 代码重构
- `test/*` - 测试相关

### 2. 开发功能

遵循以下最佳实践:

**前端开发**:
- 使用函数组件和 Hooks
- 使用 TypeScript 严格模式
- 组件应该小而专注
- 使用 Tailwind CSS 进行样式设计
- 使用 React Query 管理服务器状态

**后端开发**:
- 遵循 RESTful API 设计
- 使用 Prisma 进行数据库操作
- 所有服务应该有错误处理
- 使用 Winston 记录日志
- 关键操作添加性能监控

### 3. 编写测试

**前端测试**:
```bash
cd frontend
npm test
```

**后端测试**:
```bash
cd backend
npm test
```

测试要求:
- 单元测试覆盖率 >= 80%
- 集成测试覆盖关键流程
- E2E 测试覆盖核心用户路径

### 4. 代码检查

```bash
# 前端
cd frontend
npm run lint
npm run type-check

# 后端
cd backend
npm run lint
npx tsc --noEmit
```

### 5. 提交更改

参见 [提交规范](#提交规范)

### 6. 推送并创建 PR

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request

---

## 代码规范

### TypeScript 规范

```typescript
// ✅ 好的示例
interface User {
  id: string;
  email: string;
  name: string;
}

async function getUser(id: string): Promise<User> {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

// ❌ 不好的示例
async function getUser(id: any) {  // 避免使用 any
  const user = await db.user.findUnique({ where: { id } });
  return user;  // 缺少错误处理
}
```

### React 组件规范

```tsx
// ✅ 好的示例
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'px-4 py-2 rounded-lg transition-colors',
        variant === 'primary' && 'bg-blue-600 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
};

// ❌ 不好的示例
export default function Button(props: any) {  // 避免 default export 和 any
  return <button onClick={props.onClick}>{props.children}</button>;
}
```

### 命名规范

- **组件**: PascalCase - `UserProfile.tsx`
- **Hooks**: camelCase, 以 use 开头 - `useAuth.ts`
- **工具函数**: camelCase - `formatDate.ts`
- **常量**: UPPER_SNAKE_CASE - `MAX_RETRIES`
- **接口/类型**: PascalCase - `User`, `UserProfile`

---

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整(不影响功能)
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

### 示例

```bash
feat(builder): 添加自然语言输入组件

实现了用户通过自然语言描述需求的输入界面:
- 添加 NaturalLanguageInput 组件
- 集成 AI 需求解析
- 添加实时验证

Closes #123
```

```bash
fix(api): 修复项目创建时的并发问题

当多个用户同时创建项目时,会出现数据库锁定错误.
现在使用事务确保数据一致性.

Fixes #456
```

---

## 测试指南

### 单元测试

**前端组件测试**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button onClick={() => {}} disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

**后端服务测试**:
```typescript
import { AIService } from '../services/AIService';

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  it('should generate response from OpenAI', async () => {
    const response = await aiService.generateResponse('Hello', {
      temperature: 0.7,
    });

    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
  });

  it('should use cache for duplicate requests', async () => {
    const prompt = 'Test prompt';

    const response1 = await aiService.generateResponse(prompt);
    const response2 = await aiService.generateResponse(prompt);

    expect(response1).toBe(response2);
  });
});
```

### 集成测试

```typescript
import request from 'supertest';
import { app } from '../index';

describe('POST /api/projects', () => {
  it('should create a new project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Test Project',
        requirementText: 'I need a todo app',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test Project');
  });
});
```

---

## 文档编写

### API 文档

API 更改必须更新 `docs/API.md`:

1. 添加新端点描述
2. 包含请求/响应示例
3. 说明错误情况
4. 添加使用示例

### 代码注释

```typescript
/**
 * 生成 AI 响应,带缓存和 fallback 机制
 *
 * @param prompt - 用户输入的提示词
 * @param options - AI 配置选项
 * @param options.temperature - 温度参数 (0-1)
 * @param options.maxTokens - 最大 token 数
 * @param options.useCache - 是否使用缓存
 * @returns AI 生成的响应文本
 *
 * @throws {Error} 当所有 AI 提供者都失败时抛出
 *
 * @example
 * const response = await aiService.generateResponse('Hello', {
 *   temperature: 0.7,
 *   maxTokens: 1000,
 * });
 */
async generateResponse(prompt: string, options: AIOptions): Promise<string> {
  // ...
}
```

---

## PR 审查检查清单

提交 PR 前,确保:

- [ ] 代码遵循项目规范
- [ ] 添加了必要的测试
- [ ] 所有测试通过
- [ ] 更新了相关文档
- [ ] 提交信息遵循规范
- [ ] 没有未解决的 lint 警告
- [ ] 没有 console.log (除非必要)
- [ ] 添加了必要的注释
- [ ] 性能影响已考虑
- [ ] 错误处理完善

---

## 常见问题

### Q: 如何添加新的 Agent?

A: 参考 `backend/src/agents/BaseAgent.ts`,创建新的 Agent 类继承 BaseAgent,实现必要的方法。

### Q: 如何添加新的 API 路由?

A: 在 `backend/src/routes/` 创建路由文件,然后在 `backend/src/index.ts` 中注册。

### Q: 前端状态管理使用什么?

A: 使用 Zustand 管理全局状态,React Query 管理服务器状态,本地状态使用 useState。

### Q: 如何调试 WebSocket 连接?

A: 使用浏览器开发者工具的 Network 标签页,筛选 WS 类型查看 WebSocket 消息。

---

## 获取帮助

- 查看 [文档](./docs/)
- 提交 [Issue](https://github.com/yourusername/ai-builder-studio/issues)
- 加入 [Discord 社区](https://discord.gg/xxx)
- 发送邮件: dev@example.com

---

## 许可证

通过贡献代码,您同意您的贡献将按照 MIT 许可证授权。

---

**感谢您的贡献!** 🎉
