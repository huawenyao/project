# 快速开始指南: AI思考过程可视化系统

本指南帮助您快速搭建开发环境并启动"AI思考过程可视化系统"。

---

## 目录

- [前置条件](#前置条件)
- [环境变量配置](#环境变量配置)
- [数据库初始化](#数据库初始化)
- [安装依赖](#安装依赖)
- [启动开发服务器](#启动开发服务器)
- [测试WebSocket连接](#测试websocket连接)
- [触发可视化功能](#触发可视化功能)
- [验证功能](#验证功能)
- [常见问题排查](#常见问题排查)

---

## 前置条件

在开始之前，请确保您的开发环境满足以下要求：

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 安装验证命令 |
|------|---------|---------|-------------|
| Node.js | 18.0.0 | 20.x LTS | `node --version` |
| npm | 9.0.0 | 10.x | `npm --version` |
| PostgreSQL | 14.x | 16.x | `psql --version` |
| Redis | 6.x | 7.x | `redis-cli --version` |

### 可选软件（用于冷数据归档）

| 软件 | 说明 | 验证命令 |
|------|------|---------|
| MinIO / S3兼容存储 | 用于存储超过30天的归档数据 | `mc --version` (MinIO Client) |

### 安装指引

<details>
<summary>Ubuntu/Debian 安装</summary>

```bash
# 安装Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# 安装Redis
sudo apt-get install -y redis-server

# 启动服务
sudo systemctl start postgresql
sudo systemctl start redis-server
```
</details>

<details>
<summary>macOS 安装</summary>

```bash
# 使用Homebrew安装
brew install node@20
brew install postgresql@16
brew install redis

# 启动服务
brew services start postgresql
brew services start redis
```
</details>

<details>
<summary>Windows 安装</summary>

1. 从 [Node.js官网](https://nodejs.org/) 下载并安装 LTS 版本
2. 从 [PostgreSQL官网](https://www.postgresql.org/download/windows/) 下载并安装
3. 从 [Redis GitHub](https://github.com/microsoftarchive/redis/releases) 下载Windows版本（或使用WSL2）
</details>

---

## 环境变量配置

### 1. 复制环境变量模板

```bash
# 在项目根目录
cp .env.example .env
```

### 2. 编辑 .env 文件

打开 `.env` 文件并配置以下变量：

```bash
# ============ 基础配置 ============
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:12000

# ============ 数据库配置 ============
# PostgreSQL主数据库（热数据存储）
DATABASE_URL=postgresql://username:password@localhost:5432/ai_builder_studio
# 或分别配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_builder_studio
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_POOL_MIN=2
DB_POOL_MAX=10

# ============ Redis配置 ============
# Redis用于会话管理和缓存
REDIS_URL=redis://localhost:6379
# 或分别配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ============ AI服务配置 ============
# 选择AI提供者: "openai" 或 "anthropic"
AI_MODEL_PROVIDER=anthropic
AI_MODEL_NAME=claude-3-opus-20240229

# OpenAI配置（如选择openai）
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_ORG_ID=your-org-id # 可选

# Anthropic配置（如选择anthropic）
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# ============ 对象存储配置（冷数据归档）============
# 支持S3兼容存储（AWS S3, MinIO, 阿里云OSS等）
S3_ENABLED=true
S3_ENDPOINT=http://localhost:9000 # MinIO本地开发
S3_REGION=us-east-1
S3_BUCKET=ai-builder-archives
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_USE_SSL=false # 本地开发设为false，生产环境设为true

# AWS S3生产环境示例
# S3_ENDPOINT=  # 留空使用AWS默认
# S3_REGION=us-west-2
# S3_BUCKET=your-production-bucket
# S3_ACCESS_KEY_ID=AWS_ACCESS_KEY
# S3_SECRET_ACCESS_KEY=AWS_SECRET_KEY
# S3_USE_SSL=true

# ============ 认证配置 ============
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d

# ============ 可视化系统配置 ============
# WebSocket更新频率（毫秒）
WS_UPDATE_FREQ_HIGH_PRIORITY=300    # 高优先级Agent (UIAgent, BackendAgent, DatabaseAgent)
WS_UPDATE_FREQ_LOW_PRIORITY=1500    # 低优先级Agent (DeploymentAgent, IntegrationAgent)
WS_UPDATE_FREQ_CRITICAL=50          # 关键事件（决策、错误）

# 数据归档配置
DATA_ARCHIVE_ENABLED=true
DATA_ARCHIVE_THRESHOLD_DAYS=30      # 超过30天自动归档
DATA_ARCHIVE_SCHEDULE=0 2 * * *     # Cron表达式: 每天凌晨2点执行

# Agent错误重试配置
AGENT_RETRY_MAX_ATTEMPTS=3
AGENT_RETRY_BASE_DELAY=1000         # 基础延迟1秒
AGENT_RETRY_MAX_DELAY=10000         # 最大延迟10秒

# ============ 日志配置 ============
LOG_LEVEL=info                      # debug, info, warn, error
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/app.log

# ============ CORS配置 ============
CORS_ORIGINS=http://localhost:12000,http://localhost:3000
```

### 3. 生成JWT密钥

```bash
# 生成随机JWT密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将输出的字符串替换 `.env` 中的 `JWT_SECRET` 值。

---

## 数据库初始化

### 1. 创建PostgreSQL数据库

```bash
# 连接到PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE ai_builder_studio;

# 创建用户（如果需要）
CREATE USER ai_builder_user WITH PASSWORD 'your_password';

# 授权
GRANT ALL PRIVILEGES ON DATABASE ai_builder_studio TO ai_builder_user;

# 退出
\q
```

### 2. 运行数据库迁移脚本

当前项目处于早期阶段，暂无正式迁移系统。数据库表将在首次启动时自动创建。

如果需要手动创建表结构，请参考 `/home/op/ai-builder-studio/specs/002-ai-thinking-visualization/data-model.md` 中的表定义。

**未来将支持迁移工具**（如 `knex`、`TypeORM migrations` 或 `Prisma`），届时运行：

```bash
# 示例（待实现）
npm run migrate:latest
```

### 3. 验证数据库连接

创建测试脚本 `backend/scripts/test-db-connection.ts`:

```typescript
import { DatabaseService } from '../src/services/DatabaseService';

async function testConnection() {
  try {
    const dbService = new DatabaseService();
    await dbService.connect();
    console.log('✅ 数据库连接成功');
    await dbService.disconnect();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

testConnection();
```

运行测试：

```bash
cd backend
npx ts-node scripts/test-db-connection.ts
```

### 4. 配置对象存储（可选，用于冷数据归档）

如果启用 `S3_ENABLED=true`，需要配置对象存储：

<details>
<summary>本地开发: 使用MinIO</summary>

```bash
# 使用Docker运行MinIO
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

# 访问MinIO控制台: http://localhost:9001
# 用户名: minioadmin
# 密码: minioadmin

# 创建存储桶 "ai-builder-archives"
```

配置 `.env`:

```bash
S3_ENABLED=true
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=ai-builder-archives
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_USE_SSL=false
```
</details>

<details>
<summary>生产环境: 使用AWS S3</summary>

1. 在AWS控制台创建S3存储桶
2. 创建IAM用户并授权 `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` 权限
3. 获取Access Key和Secret Key

配置 `.env`:

```bash
S3_ENABLED=true
S3_REGION=us-west-2
S3_BUCKET=your-production-bucket
S3_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
S3_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
S3_USE_SSL=true
```
</details>

---

## 安装依赖

### 1. 安装所有依赖（根目录、前端、后端）

```bash
# 在项目根目录
npm run install:all
```

或手动安装：

```bash
# 根目录依赖
npm install

# 前端依赖
cd frontend
npm install

# 后端依赖
cd ../backend
npm install

# 返回根目录
cd ..
```

### 2. 验证安装

```bash
# 检查前端依赖
cd frontend
npm list --depth=0

# 检查后端依赖
cd ../backend
npm list --depth=0
```

---

## 启动开发服务器

### 方式1: 同时启动前后端（推荐）

在项目根目录运行：

```bash
npm run dev
```

这会同时启动：
- **前端**: Vite开发服务器 → http://localhost:12000
- **后端**: Express + Socket.IO服务器 → http://localhost:3001

### 方式2: 分别启动前后端

**终端1 - 启动后端**:

```bash
cd backend
npm run dev
```

**终端2 - 启动前端**:

```bash
cd frontend
npm run dev
```

### 3. 验证服务启动

访问以下端点验证：

```bash
# 后端健康检查
curl http://localhost:3001/health

# 预期响应:
# {"status":"ok","timestamp":"2025-10-27T10:30:00.000Z"}

# 前端界面
# 打开浏览器访问: http://localhost:12000
```

---

## 测试WebSocket连接

### 1. 使用浏览器开发工具测试

打开浏览器控制台（F12），运行以下代码：

```javascript
// 建立WebSocket连接
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token-here', // 从登录接口获取
  },
  transports: ['websocket'],
});

// 监听连接成功
socket.on('connect', () => {
  console.log('✅ WebSocket连接成功', socket.id);
});

// 监听连接错误
socket.on('connect_error', (error) => {
  console.error('❌ WebSocket连接失败:', error.message);
});

// 测试订阅会话
socket.emit('subscribe-session', {
  sessionId: 'test-session-id',
});

socket.on('session-subscribed', (data) => {
  console.log('✅ 已订阅会话:', data);
});

socket.on('agent-status-update', (data) => {
  console.log('📊 Agent状态更新:', data);
});
```

### 2. 使用后端演示脚本测试

运行后端演示服务器：

```bash
cd backend
npm run demo
```

这会启动一个模拟的构建会话，并通过WebSocket推送实时更新。

在浏览器控制台或前端应用中订阅该演示会话即可看到实时更新。

### 3. 使用Postman/Insomnia测试REST API

**获取JWT Token**:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**获取构建会话列表**:

```bash
curl http://localhost:3001/api/visualization/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 触发可视化功能

### 1. 创建新构建会话

通过Dashboard界面或API创建新的应用构建：

**通过前端界面**:

1. 访问 http://localhost:12000
2. 登录账号
3. 点击 "创建新应用" 按钮
4. 输入项目需求描述，例如：

   ```
   创建一个电商管理系统，包含：
   - 用户管理（注册、登录、权限）
   - 商品管理（CRUD、分类、库存）
   - 订单管理（下单、支付、物流）
   - 数据统计仪表板
   ```

5. 点击 "开始构建"

**通过REST API**:

```bash
curl -X POST http://localhost:3001/api/builder/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "电商管理系统",
    "description": "创建一个电商管理系统，包含用户管理、商品管理、订单管理和数据统计功能",
    "requirements": {
      "features": ["用户管理", "商品管理", "订单管理", "数据统计"],
      "techStack": {
        "frontend": "React",
        "backend": "Node.js",
        "database": "PostgreSQL"
      }
    }
  }'
```

### 2. 观察可视化界面

构建启动后，您应该能看到：

#### Agent工作状态面板

- **UIAgent**: 显示 "正在分析用户需求..." 状态
- **BackendAgent**: 显示 "等待前置任务完成..." 状态
- **DatabaseAgent**: 显示 "准备就绪..." 状态
- 进度条实时更新（0% → 100%）
- Agent卡片显示拟人化头像和动画效果

#### 决策卡片弹出

- 高重要性决策（如技术选型）在右下角toast通知弹出
- 显示决策标题和简要理由
- 5秒后自动收起到右侧边栏
- 点击可查看完整决策详情

#### Agent协作可视化

- 列表视图显示Agent之间的数据流向箭头
- 图形视图显示动画连线和流动的小圆点
- 协作事件实时标注传递的数据类型

#### 错误处理演示

- 轻微错误（如网络超时）显示 "正在重试(第X/3次)..." 状态
- 关键错误弹出错误详情卡片，提供重试/跳过/终止选项

### 3. 测试回放功能

构建完成后：

1. 在Dashboard点击 "历史记录" 标签
2. 选择任意已完成的构建会话
3. 点击 "回放" 按钮
4. 观察构建过程按时间顺序重新演示
5. 使用播放/暂停/快进控制

---

## 验证功能

### 功能检查清单

使用以下清单验证可视化系统的各项功能：

#### ✅ 基础功能

- [ ] 前端界面正常加载（http://localhost:12000）
- [ ] 后端API健康检查通过（http://localhost:3001/health）
- [ ] 用户可以登录并获取JWT token
- [ ] WebSocket连接成功建立

#### ✅ Agent工作状态可视化

- [ ] 能看到所有参与的Agent卡片
- [ ] Agent状态实时更新（pending → in_progress → completed）
- [ ] 进度条实时更新并准确显示百分比
- [ ] Agent卡片显示当前任务描述
- [ ] Agent卡片显示拟人化头像和动画效果

#### ✅ 决策可视化

- [ ] 高重要性决策在右下角toast通知弹出
- [ ] Toast通知显示5秒后自动收起到侧边栏
- [ ] 侧边栏显示完整决策时间线
- [ ] 点击决策可查看完整详情（理由、备选方案、影响）
- [ ] 决策详情显示预览数据（如有）

#### ✅ Agent协作可视化

- [ ] 列表视图显示Agent协作关系（箭头和标注）
- [ ] 图形视图显示Agent节点和连线
- [ ] 协作发生时连线显示流动动画
- [ ] 点击连线可查看传递的数据内容摘要
- [ ] 可以在列表视图和图形视图之间切换

#### ✅ 错误处理

- [ ] 轻微错误自动重试并显示重试状态
- [ ] 关键错误暂停构建并弹出错误详情
- [ ] 错误详情包含错误类型、原因、影响和建议操作
- [ ] 可以选择重试、跳过或终止构建
- [ ] 错误记录保存在会话历史中

#### ✅ 历史记录和回放

- [ ] 可以查看历史构建会话列表
- [ ] 可以过滤热数据（最近30天）和冷数据（>30天）
- [ ] 可以选择历史会话进行回放
- [ ] 回放功能按时间顺序重现构建过程
- [ ] 可以控制回放速度（暂停、快进、后退）

#### ✅ 用户设置

- [ ] 可以切换主题（温暖友好风 ⇌ 科技未来感）
- [ ] 主题偏好持久化保存
- [ ] 可以管理隐私设置（opt-in/opt-out数据收集）
- [ ] 可以启用/禁用专注模式（仅显示关键信息）

---

## 常见问题排查

### 问题1: 数据库连接失败

**错误信息**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案**:

1. 检查PostgreSQL是否正在运行：
   ```bash
   # Linux
   sudo systemctl status postgresql

   # macOS
   brew services list

   # Windows
   # 打开服务管理器检查PostgreSQL服务状态
   ```

2. 验证数据库连接参数：
   ```bash
   psql -h localhost -p 5432 -U your_db_user -d ai_builder_studio
   ```

3. 检查 `.env` 中的 `DATABASE_URL` 是否正确

4. 确认防火墙未阻止端口5432

---

### 问题2: Redis连接失败

**错误信息**:
```
Error: Redis connection to localhost:6379 failed - connect ECONNREFUSED
```

**解决方案**:

1. 检查Redis是否正在运行：
   ```bash
   # Linux
   sudo systemctl status redis

   # macOS
   brew services list

   # 测试连接
   redis-cli ping
   # 预期响应: PONG
   ```

2. 如果Redis未启动：
   ```bash
   # Linux
   sudo systemctl start redis

   # macOS
   brew services start redis
   ```

---

### 问题3: WebSocket连接失败

**错误信息**:
```
WebSocket connection failed: Error during WebSocket handshake
```

**解决方案**:

1. 检查后端服务器是否正在运行：
   ```bash
   curl http://localhost:3001/health
   ```

2. 检查CORS配置，确保 `.env` 中的 `FRONTEND_URL` 正确：
   ```bash
   FRONTEND_URL=http://localhost:12000
   ```

3. 检查JWT token是否有效：
   ```javascript
   // 在浏览器控制台检查token
   localStorage.getItem('jwt_token');
   ```

4. 查看后端日志确认WebSocket握手请求：
   ```bash
   cd backend
   npm run dev
   # 观察日志输出
   ```

---

### 问题4: AI服务调用失败

**错误信息**:
```
Error: OpenAI/Anthropic API call failed - 401 Unauthorized
```

**解决方案**:

1. 检查 `.env` 中的API密钥是否正确：
   ```bash
   # 对于Anthropic
   echo $ANTHROPIC_API_KEY

   # 对于OpenAI
   echo $OPENAI_API_KEY
   ```

2. 验证API密钥是否有效：
   ```bash
   # 测试Anthropic API
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{
       "model": "claude-3-opus-20240229",
       "max_tokens": 10,
       "messages": [{"role": "user", "content": "Hi"}]
     }'
   ```

3. 检查API配额和速率限制

4. 确认 `AI_MODEL_PROVIDER` 和 `AI_MODEL_NAME` 配置正确

---

### 问题5: 前端无法连接后端

**错误信息**:
```
Network Error: Failed to fetch
```

**解决方案**:

1. 检查后端是否在正确的端口运行：
   ```bash
   netstat -an | grep 3001
   # 或
   lsof -i :3001
   ```

2. 检查前端环境变量配置：
   ```typescript
   // frontend/.env 或 frontend/.env.local
   VITE_API_URL=http://localhost:3001
   ```

3. 清除浏览器缓存并刷新页面

4. 检查浏览器控制台的Network标签查看具体请求错误

---

### 问题6: 对象存储（S3）连接失败

**错误信息**:
```
Error: S3 connection failed - AccessDenied
```

**解决方案**:

1. 如果使用MinIO，确认容器正在运行：
   ```bash
   docker ps | grep minio
   ```

2. 验证存储桶已创建：
   ```bash
   # 使用MinIO Client
   mc alias set local http://localhost:9000 minioadmin minioadmin
   mc ls local
   mc mb local/ai-builder-archives  # 如果桶不存在
   ```

3. 检查 `.env` 中的S3配置：
   ```bash
   S3_ENDPOINT=http://localhost:9000
   S3_ACCESS_KEY_ID=minioadmin
   S3_SECRET_ACCESS_KEY=minioadmin
   ```

4. 如果暂不需要归档功能，可以禁用S3：
   ```bash
   S3_ENABLED=false
   DATA_ARCHIVE_ENABLED=false
   ```

---

### 问题7: 构建会话无响应

**症状**: 点击"开始构建"后没有Agent状态更新

**解决方案**:

1. 检查WebSocket连接状态：
   ```javascript
   // 在浏览器控制台
   console.log(socket.connected); // 应该返回 true
   ```

2. 检查是否成功订阅会话：
   ```javascript
   // 查看控制台日志
   // 应该看到 "已订阅会话: xxx" 消息
   ```

3. 查看后端日志确认AgentOrchestrator是否启动：
   ```bash
   cd backend
   npm run dev
   # 查找日志中的 "AgentOrchestrator started for session xxx"
   ```

4. 检查数据库中是否创建了会话记录：
   ```sql
   psql -U your_db_user -d ai_builder_studio
   SELECT * FROM build_sessions ORDER BY created_at DESC LIMIT 5;
   ```

---

### 问题8: 决策卡片不显示

**症状**: Agent在工作但没有决策卡片弹出

**解决方案**:

1. 检查WebSocket事件监听：
   ```javascript
   // 在浏览器控制台
   socket.on('decision-created', (data) => {
     console.log('收到决策事件:', data);
   });
   ```

2. 确认Agent正在产生决策：
   - 查看后端日志是否有 "Decision created" 消息
   - 检查数据库 `decision_records` 表是否有新记录

3. 检查前端决策卡片渲染逻辑是否有错误：
   - 打开浏览器开发工具的Console标签
   - 查找JavaScript错误

4. 临时禁用决策toast通知，只在侧边栏显示：
   - 在设置中关闭高重要性决策的toast通知

---

### 问题9: 回放功能加载慢

**症状**: 访问归档记录（>30天）时加载时间过长

**解决方案**:

1. 检查对象存储连接延迟：
   ```bash
   # 测试S3下载速度
   time curl -X GET http://localhost:9000/ai-builder-archives/session-xxx.json \
     -H "Authorization: AWS4-HMAC-SHA256 ..."
   ```

2. 优化配置：
   - 增加网络超时时间
   - 使用CDN加速（生产环境）
   - 考虑将归档数据压缩（gzip）

3. 如果是本地MinIO性能问题：
   - 确认Docker容器有足够的资源（CPU、内存）
   - 考虑使用SSD存储

4. 前端显示加载进度：
   - 确保UI显示 "正在从归档加载..." 提示

---

### 问题10: 主题切换不生效

**症状**: 切换主题后界面没有变化

**解决方案**:

1. 检查主题设置是否保存：
   ```bash
   curl http://localhost:3001/api/visualization/settings/theme \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. 清除浏览器缓存和LocalStorage：
   ```javascript
   // 在浏览器控制台
   localStorage.clear();
   location.reload();
   ```

3. 检查CSS样式是否正确加载：
   - 打开开发工具的Elements标签
   - 确认`<body>`标签有对应的theme class

4. 验证前端主题切换逻辑：
   ```typescript
   // 检查主题状态管理
   console.log(themeContext.currentTheme);
   ```

---

## 获取帮助

如果以上排查步骤无法解决您的问题，请：

1. **查看日志**:
   - 后端日志: `backend/logs/app.log`
   - 浏览器控制台: F12 → Console标签

2. **查阅文档**:
   - API契约: `/home/op/ai-builder-studio/specs/002-ai-thinking-visualization/contracts/rest-api.yaml`
   - WebSocket事件规范: `/home/op/ai-builder-studio/specs/002-ai-thinking-visualization/contracts/websocket-events.md`
   - 数据模型: `/home/op/ai-builder-studio/specs/002-ai-thinking-visualization/data-model.md`

3. **提交Issue**:
   - 在项目仓库创建Issue
   - 提供详细的错误信息、日志和复现步骤
   - 注明您的环境信息（操作系统、Node版本等）

4. **联系团队**:
   - Email: support@ai-builder-studio.com
   - Slack: #ai-builder-studio频道

---

## 下一步

成功启动系统后，您可以：

1. **探索核心功能**:
   - 创建多个不同类型的项目测试Agent协作
   - 体验决策卡片交互和预览功能
   - 测试错误恢复机制（模拟网络中断）
   - 使用回放功能重现历史构建过程

2. **自定义配置**:
   - 调整Agent拟人化配置（头像、性格、状态消息）
   - 修改WebSocket更新频率优化性能
   - 配置数据归档策略适应存储需求

3. **集成到开发流程**:
   - 配合CI/CD使用API自动触发构建
   - 导出决策记录用于团队文档
   - 分析用户交互指标优化产品体验

4. **参与开发**:
   - 查看 `CLAUDE.md` 了解项目架构和开发规范
   - 参考 `/home/op/ai-builder-studio/specs/002-ai-thinking-visualization/spec.md` 了解功能需求
   - 贡献代码改进可视化体验

---

**祝您使用愉快！**🎉
