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
import { AgentOrchestrator } from './services/AgentOrchestrator';
import { DatabaseService } from './services/DatabaseService';

// Routes
import agentRoutes from './routes/agentRoutes';
import appRoutes from './routes/appRoutes';
import authRoutes from './routes/authRoutes';
import builderRoutes from './routes/builderRoutes';

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/builder', builderRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-project', (projectId: string) => {
    socket.join(`project-${projectId}`);
    logger.info(`Client ${socket.id} joined project ${projectId}`);
  });

  socket.on('agent-request', async (data) => {
    try {
      const orchestrator = AgentOrchestrator.getInstance();
      const result = await orchestrator.processRequest(data);
      
      socket.emit('agent-response', {
        requestId: data.requestId,
        result
      });
    } catch (error) {
      logger.error('Agent request error:', error);
      socket.emit('agent-error', {
        requestId: data.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

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
    DatabaseService.getInstance().disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
    DatabaseService.getInstance().disconnect();
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await DatabaseService.getInstance().connect();
    
    // Initialize agent orchestrator
    AgentOrchestrator.getInstance();
    
    server.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`🚀 AI Agent App Builder Backend running on port ${PORT}`);
      logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
      logger.info(`🔌 WebSocket server ready for connections`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, io };