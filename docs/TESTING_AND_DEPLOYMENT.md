# 测试和部署指南

**项目**: AI-Native Agent App Builder Engine
**功能**: 001-ai-native-transformation (Phase 3-9)
**日期**: 2025-10-29
**状态**: ✅ 开发完成，准备测试

---

## 📋 前置条件检查清单

在开始测试和部署之前，请确保以下条件已满足：

### 1. 环境要求

- [x] Node.js >= 18.0.0
- [x] npm >= 9.0.0
- [ ] PostgreSQL 15+ 正在运行
- [ ] Redis 7+ 正在运行
- [ ] AI API 密钥已配置（OpenAI 或 Anthropic）

### 2. 配置文件

```bash
# 检查 .env 文件是否存在
ls -la .env

# 必需的环境变量
AI_MODEL_PROVIDER=anthropic  # 或 openai
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx  # 可选

DATABASE_URL=postgresql://user:password@localhost:5432/ai_builder_db
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:12000
BACKEND_PORT=3001
```

### 3. 数据库设置

```bash
# 创建数据库
createdb ai_builder_db

# 运行 Prisma 迁移
cd backend
npx prisma migrate dev --name init
npx prisma generate

# 验证数据库连接
psql -d ai_builder_db -c "SELECT version();"
```

---

## 🧪 测试流程

### Step 1: 后端测试

#### 1.1 TypeScript 类型检查

```bash
cd /home/op/ai-builder-studio/backend
npx tsc --noEmit
```

**预期结果**:
- 新创建的文件（ValidationService, VersionService, TaskQueueService等）**无类型错误** ✅
- 旧代码可能存在一些历史遗留类型错误（可忽略）

#### 1.2 单元测试

```bash
cd backend
npm run test

# 运行特定测试
npm test -- --testPathPattern=services/NLPService
npm test -- --testPathPattern=services/ValidationService
```

**预期结果**: 所有测试通过

#### 1.3 启动后端服务

```bash
cd backend
npm run dev

# 或使用 PM2
pm2 start npm --name "ai-builder-backend" -- run dev
```

**预期输出**:
```
✓ Server running on http://localhost:3001
✓ WebSocket server listening
✓ Connected to PostgreSQL
✓ Connected to Redis
```

#### 1.4 验证 API 端点

```bash
# 健康检查
curl http://localhost:3001/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2025-10-29T..."
}

# API 文档（如果配置了 Swagger）
open http://localhost:3001/api-docs
```

---

### Step 2: 前端测试

#### 2.1 TypeScript 类型检查

```bash
cd /home/op/ai-builder-studio/frontend
npm run type-check
```

**预期结果**: 新创建的组件（AgentCard, DataModelPanel, DeploymentPanel等）**无类型错误** ✅

#### 2.2 Lint 检查

```bash
cd frontend
npm run lint

# 自动修复
npm run lint:fix
```

#### 2.3 单元测试

```bash
cd frontend
npm run test

# 特定组件测试
npm test -- AgentCard
npm test -- DataModelViewer
```

#### 2.4 启动前端服务

```bash
cd frontend
npm run dev

# 或使用 PM2
pm2 start npm --name "ai-builder-frontend" -- run dev
```

**预期输出**:
```
➜  Local:   http://localhost:12000/
➜  Network: use --host to expose
```

---

### Step 3: 端到端测试

#### 3.1 用户注册和登录

**手动测试**:
1. 访问 http://localhost:12000
2. 注册新用户
3. 登录系统

**API 测试**:
```bash
# 注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!"
  }'

# 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# 保存返回的 token
export TOKEN="eyJhbGc..."
```

#### 3.2 Phase 3 测试: 自然语言应用创建

**测试步骤**:
1. 进入 Builder 页面
2. 输入自然语言需求：
   ```
   我需要一个待办事项应用，用户可以创建、编辑、删除任务。
   每个任务有标题、描述、截止日期和优先级。
   ```
3. 验证 AI 解析结果
4. 确认需求并启动构建

**API 测试**:
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Todo App",
    "requirementText": "我需要一个待办事项应用，用户可以创建、编辑、删除任务。"
  }'
```

**验证点**:
- ✅ NLP 解析准确（识别出实体：Task, User）
- ✅ 功能列表正确（创建、编辑、删除）
- ✅ 生成理解摘要
- ✅ 提示澄清问题（如果需求不清晰）

#### 3.3 Phase 4 测试: Agent 协作可视化

**测试步骤**:
1. 创建项目后，观察 Agent 监控面板
2. 验证 5 个 Agent 状态卡片显示
3. 观察状态实时更新（空闲→工作中→完成）
4. 查看 Agent 依赖关系图

**WebSocket 测试**:
```javascript
// 浏览器控制台
const socket = io('http://localhost:3001', {
  auth: { token: localStorage.getItem('jwt') }
});

socket.emit('agent:join-project', { projectId: 'xxx' });

socket.on('agent:status:update', (data) => {
  console.log('Agent Update:', data);
});
```

**验证点**:
- ✅ 5 个 Agent 卡片正常显示
- ✅ 状态实时更新（延迟 < 5秒）
- ✅ 进度百分比准确
- ✅ 依赖关系图可视化

#### 3.4 Phase 5 测试: AI 辅助可视化编辑

**测试步骤**:
1. 进入可视化编辑器
2. 从组件面板拖拽组件到画布
3. 使用自然语言修改：
   ```
   把登录按钮移到页面右上角
   ```
4. 查看 AI 设计建议
5. 创建版本快照
6. 回滚到之前的版本

**验证点**:
- ✅ 拖拽功能正常
- ✅ 自然语言修改生效
- ✅ AI 提供设计建议
- ✅ 版本快照和回滚功能正常

#### 3.5 Phase 6 测试: 智能数据模型推荐

**测试步骤**:
1. 进入数据模型管理
2. 点击"智能推荐"
3. 查看 AI 推荐的数据模型
4. 查看 ERD 图
5. 修改数据模型，查看影响分析

**API 测试**:
```bash
curl -X POST http://localhost:3001/api/projects/$PROJECT_ID/data-models/recommend \
  -H "Authorization: Bearer $TOKEN"
```

**验证点**:
- ✅ AI 推荐数据模型准确
- ✅ ERD 图正确渲染
- ✅ 影响分析显示受影响的 API 和组件

#### 3.6 Phase 7 测试: 一键部署

**测试步骤**:
1. 进入部署面板
2. 选择部署环境（测试/生产）
3. 配置资源（内存、CPU）
4. 启动部署
5. 观察 5 阶段进度
6. 查看部署日志
7. 验证健康检查

**验证点**:
- ✅ 部署流程启动成功
- ✅ 5 阶段进度实时显示
- ✅ 部署日志正确输出
- ✅ 健康检查通过
- ✅ 提供访问 URL

#### 3.7 Phase 8 测试: 代码审查与优化

**测试步骤**:
1. 进入代码查看器
2. 导出项目代码
3. 查看 Monaco Editor 代码高亮
4. 查看 AI 优化建议
5. 应用优化建议

**验证点**:
- ✅ 代码导出完整（package.json, 组件, API, Docker等）
- ✅ Monaco Editor 正常加载
- ✅ 语法高亮和代码导航
- ✅ AI 优化建议准确

#### 3.8 Phase 9 测试: 性能和用户体验

**测试内容**:
1. **缓存测试**: 相同需求第二次请求应该 <10ms
2. **错误处理**: 触发错误，验证 ErrorBoundary 和 Toast 通知
3. **Loading 状态**: 验证骨架屏显示
4. **响应式**: 调整浏览器窗口大小，验证布局

**性能测试**:
```bash
# AI 响应缓存测试
time curl -X POST http://localhost:3001/api/nlp/parse \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requirementText": "我需要一个博客系统"}'

# 第一次: ~2-5秒
# 第二次（缓存命中）: <10ms
```

---

## 🚀 部署流程

### 方案 1: Docker 部署（推荐）

#### 1.1 构建镜像

```bash
# 构建后端镜像
cd backend
docker build -t ai-builder-backend:latest .

# 构建前端镜像
cd frontend
docker build -t ai-builder-frontend:latest .
```

#### 1.2 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 1.3 验证部署

```bash
# 检查容器状态
docker ps

# 健康检查
curl http://localhost:3001/health
curl http://localhost:12000
```

---

### 方案 2: PM2 部署

#### 2.1 安装 PM2

```bash
npm install -g pm2
```

#### 2.2 创建 PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ai-builder-backend',
      cwd: './backend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'ai-builder-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'production',
        PORT: 12000,
      },
    },
  ],
};
```

#### 2.3 启动服务

```bash
pm2 start ecosystem.config.js

# 查看状态
pm2 list
pm2 logs

# 保存配置（开机自启）
pm2 save
pm2 startup
```

---

### 方案 3: 生产环境部署

#### 3.1 构建生产版本

```bash
# 前端
cd frontend
npm run build
# 生成 dist/ 目录

# 后端
cd backend
npm run build
# 生成 dist/ 目录
```

#### 3.2 使用 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/ai-builder

server {
    listen 80;
    server_name ai-builder.example.com;

    # 前端静态文件
    location / {
        root /var/www/ai-builder/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

#### 3.3 启动生产服务

```bash
# 后端
cd backend/dist
NODE_ENV=production node index.js

# 或使用 PM2
pm2 start dist/index.js --name ai-builder-backend
```

---

## 📊 监控和日志

### 应用监控

```bash
# PM2 监控
pm2 monit

# 日志查看
pm2 logs ai-builder-backend
pm2 logs ai-builder-frontend

# 日志文件位置
backend/logs/app.log
backend/logs/error.log
```

### 性能监控

```bash
# 后端性能
curl http://localhost:3001/metrics

# 数据库连接数
psql -d ai_builder_db -c "SELECT count(*) FROM pg_stat_activity;"

# Redis 内存使用
redis-cli info memory
```

---

## 🐛 常见问题排查

### 问题 1: 数据库连接失败

**症状**: `Error: connect ECONNREFUSED ::1:5432`

**解决方案**:
```bash
# 检查 PostgreSQL 是否运行
pg_isready

# 启动 PostgreSQL
sudo systemctl start postgresql

# 验证连接字符串
echo $DATABASE_URL
```

### 问题 2: Redis 连接失败

**症状**: `Error: Redis connection refused`

**解决方案**:
```bash
# 检查 Redis 是否运行
redis-cli ping

# 启动 Redis
sudo systemctl start redis

# 验证连接
echo $REDIS_URL
```

### 问题 3: AI API 调用失败

**症状**: `Error: AI API timeout`

**解决方案**:
1. 检查 API 密钥是否正确
2. 验证网络连接
3. 检查 API 配额是否耗尽

### 问题 4: WebSocket 连接断开

**症状**: `WebSocket connection failed`

**解决方案**:
1. 确认后端 WebSocket 服务器运行
2. 检查 CORS 配置
3. 验证 JWT token 有效性

---

## ✅ 部署验证清单

部署完成后，请验证以下功能：

### 基础功能
- [ ] 用户可以注册和登录
- [ ] Dashboard 正常显示
- [ ] 项目列表加载正常

### Phase 3-4
- [ ] 自然语言输入可用
- [ ] AI 解析需求准确
- [ ] Agent 监控面板实时更新
- [ ] WebSocket 连接稳定

### Phase 5-6
- [ ] 可视化编辑器可用
- [ ] 拖拽功能正常
- [ ] AI 设计建议生成
- [ ] 数据模型推荐准确
- [ ] ERD 图渲染正确

### Phase 7-8
- [ ] 部署流程启动成功
- [ ] 部署进度实时显示
- [ ] 代码导出功能正常
- [ ] Monaco Editor 加载

### Phase 9
- [ ] AI 响应缓存生效
- [ ] 错误处理友好
- [ ] Loading 状态显示
- [ ] Toast 通知正常

---

## 📈 性能指标验证

| 指标 | 目标值 | 测试方法 | 状态 |
|------|--------|---------|------|
| AI 理解准确度 | 85% | 100 个样本需求测试 | ⏳ |
| Agent 响应时间 (P95) | < 5秒 | 性能监控工具 | ⏳ |
| WebSocket 延迟 | < 5秒 | 实时监控 | ⏳ |
| 缓存命中率 | > 80% | Redis监控 | ⏳ |
| 首次修改成功率 | 80% | 用户行为分析 | ⏳ |
| 数据模型无需修改率 | 90% | 统计分析 | ⏳ |
| 部署成功率 | 95% | 部署日志统计 | ⏳ |

---

## 🎉 部署完成

如果所有测试通过，恭喜！AI-Native Agent App Builder Engine 已成功部署！

**下一步建议**:
1. 配置监控告警（Prometheus + Grafana）
2. 设置自动备份（数据库和代码）
3. 配置 CI/CD 自动化（GitHub Actions）
4. 进行安全审计和渗透测试
5. 收集用户反馈并迭代优化

---

**文档版本**: 1.0
**最后更新**: 2025-10-29
**维护人员**: Development Team
