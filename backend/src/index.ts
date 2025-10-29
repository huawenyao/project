import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
// import { AgentOrchestrator } from './services/AgentOrchestrator'; // 临时禁用：存在编译错误
import { DatabaseService } from './services/DatabaseService';
import { WebSocketService } from './services/WebSocketService';

// New Routes (Sprint 0)
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import agentRoutesNew from './routes/agent.routes';
import taskRoutes from './routes/task.routes';

// Old Routes (Legacy) - 临时禁用：依赖有编译错误的 AgentOrchestrator
// import agentRoutes from './routes/agentRoutes';
import appRoutes from './routes/appRoutes';
import builderRoutes from './routes/builderRoutes';
import visualizationRoutes from './routes/visualizationRoutes';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes - New (Sprint 0)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/agents-v2', agentRoutesNew);
app.use('/api/tasks', taskRoutes);

// API Routes - Legacy
// app.use('/api/agents', agentRoutes); // 临时禁用：依赖有编译错误的 AgentOrchestrator
app.use('/api/apps', appRoutes);
app.use('/api/builder', builderRoutes);
app.use('/api/visualization', visualizationRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
    WebSocketService.close();
    DatabaseService.getInstance().disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
    WebSocketService.close();
    DatabaseService.getInstance().disconnect();
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await DatabaseService.getInstance().connect();
    logger.info('✅ Database connected');

    // Initialize WebSocket service
    WebSocketService.initialize(server);
    logger.info('✅ WebSocket service initialized');

    // Initialize agent orchestrator
    // AgentOrchestrator.getInstance(); // 临时禁用：存在编译错误
    // logger.info('✅ Agent orchestrator initialized');

    server.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`🚀 AI Agent App Builder Backend running on port ${PORT}`);
      logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
      logger.info(`🔌 WebSocket server ready for connections`);
      logger.info(`📁 API endpoints:`);
      logger.info(`   - /api/auth - 认证服务`);
      logger.info(`   - /api/users - 用户管理`);
      logger.info(`   - /api/projects - 项目管理`);
      logger.info(`   - /api/agents-v2 - Agent管理`);
      logger.info(`   - /api/tasks - 任务管理`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, io };