# WebSocket 连接问题修复

## 问题描述

前端无法连接到后端的 WebSocket 服务，浏览器控制台显示以下错误：

```
WebSocket connection to 'ws://localhost:3001/socket.io/?EIO=4&transport=websocket' failed
Socket connection error: TransportError: websocket error
```

## 根本原因

**CORS 配置不匹配**：
- 前端运行在端口 **12000**（`http://localhost:12000`）
- 后端的 CORS 配置使用的是 **3000**（`http://localhost:3000`）
- WebSocket 连接被 CORS 策略阻止

## 已修复的问题

### 1. 更新后端 CORS 配置

**文件**: `backend/.env`

```diff
- FRONTEND_URL=http://localhost:3000
+ FRONTEND_URL=http://localhost:12000
```

### 2. 增强前端 WebSocket 连接逻辑

**文件**: `frontend/src/contexts/SocketContext.tsx`

**修改内容**:
- 在开发模式（`VITE_SKIP_AUTH=true`）下，即使没有用户登录也会尝试连接
- 添加了自动重连机制（5次重试，延迟1-5秒）
- 改进了错误处理

```typescript
// 开发模式下始终尝试连接
const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

if (user || skipAuth) {
  initializeSocket()
}

// 添加重连配置
const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
  auth: skipAuth ? { skipAuth: true } : { token },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
})
```

### 3. 后端服务已重启

后端服务已重启以应用新的 CORS 配置。

## 验证修复

### 1. 检查后端服务

```bash
# 检查后端是否运行
curl http://localhost:3001/health

# 预期输出
{"status":"healthy","timestamp":"2025-10-30T06:19:28.823Z","version":"1.0.0"}
```

### 2. 检查前端连接

在浏览器中：

1. **刷新页面**（重要！需要重新加载以应用新的 Socket 配置）
   - 按 `Ctrl+Shift+R`（Windows/Linux）
   - 按 `Cmd+Shift+R`（Mac）

2. 打开浏览器开发者工具（F12）

3. 查看控制台，应该看到：
   ```
   Socket connected: [socket-id]
   ```

4. 查看 Network 标签 → WS（WebSocket），应该看到：
   - 连接状态：`101 Switching Protocols`
   - 连接成功建立

## 当前配置

### 前端配置（`frontend/.env`）
```env
VITE_API_URL=http://localhost:3001
VITE_SKIP_AUTH=true
```

### 后端配置（`backend/.env`）
```env
PORT=3001
FRONTEND_URL=http://localhost:12000
```

### 端口映射
```
前端界面: http://localhost:12000  ← 用户访问
后端 API:  http://localhost:3001  ← WebSocket 服务器
```

## 如果问题仍然存在

### 步骤 1: 清除浏览器缓存

1. 打开开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

### 步骤 2: 检查后端日志

```bash
tail -f /tmp/backend.log
```

查找以下消息：
- `✅ WebSocket service initialized`
- `Client connected: [socket-id]`

### 步骤 3: 检查防火墙

确保防火墙没有阻止端口 3001：

```bash
# Linux
sudo ufw status

# 如果端口被阻止，允许它
sudo ufw allow 3001
```

### 步骤 4: 验证环境变量

前端：
```bash
cd frontend
cat .env | grep VITE_API_URL
# 应该显示: VITE_API_URL=http://localhost:3001
```

后端：
```bash
cd backend
cat .env | grep FRONTEND_URL
# 应该显示: FRONTEND_URL=http://localhost:12000
```

### 步骤 5: 重启服务

如果以上都不行，完全重启两个服务：

```bash
# 停止后端
pkill -f "npm run dev"

# 启动后端
cd backend
npm run dev

# 在新终端，启动前端
cd frontend
npm run dev
```

## 技术细节

### WebSocket 连接流程

```
1. 前端初始化
   ↓
2. SocketContext 检测 VITE_SKIP_AUTH
   ↓
3. 创建 Socket.IO 客户端连接到 http://localhost:3001
   ↓
4. 发送 HTTP 握手请求（包含 CORS 头）
   ↓
5. 后端检查 Origin 是否匹配 FRONTEND_URL
   ↓
6. 如果匹配，升级为 WebSocket 连接
   ↓
7. 连接建立，开始实时通信
```

### CORS 策略

Socket.IO 使用以下 CORS 配置：

```typescript
// backend/src/index.ts
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

如果 `Origin` 头不匹配，连接会被拒绝。

### 开发模式认证

在开发模式下（`VITE_SKIP_AUTH=true`）：
- AuthContext 自动创建 demo 用户
- SocketContext 不需要真实 token 即可连接
- 使用 `{ skipAuth: true }` 作为认证信息

## 相关文件

已修改的文件：
1. `backend/.env` - 更新 FRONTEND_URL
2. `frontend/src/contexts/SocketContext.tsx` - 增强连接逻辑

相关文档：
- [USER_GUIDE.md](./USER_GUIDE.md) - 产品使用指南
- [langgraph-server/INTEGRATION_GUIDE.md](./langgraph-server/INTEGRATION_GUIDE.md) - LangGraph 集成指南

## 快速检查清单

- [ ] 后端服务运行在端口 3001
- [ ] 前端服务运行在端口 12000
- [ ] 后端 `.env` 中 `FRONTEND_URL=http://localhost:12000`
- [ ] 前端 `.env` 中 `VITE_API_URL=http://localhost:3001`
- [ ] 前端 `.env` 中 `VITE_SKIP_AUTH=true`
- [ ] 浏览器已刷新（Ctrl+Shift+R）
- [ ] 浏览器控制台显示 "Socket connected"
- [ ] Network → WS 标签显示 WebSocket 连接

## 成功标志

当一切正常时，您应该看到：

**浏览器控制台**:
```
Socket connected: AbcDef123456
```

**后端日志**:
```
Client connected: AbcDef123456
✅ WebSocket service initialized
🔌 WebSocket server ready for connections
```

**Network 标签（WS）**:
```
Status: 101 Switching Protocols
Type: websocket
```

---

**修复完成时间**: 2025-10-30 06:20
**修复人**: Claude Code
