import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:12002",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:12002",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'demo'
  });
});

// Demo API routes
app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
      createdAt: new Date().toISOString()
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'demo-user',
        email: req.body.email || 'demo@example.com',
        name: 'Demo User'
      },
      token: 'demo-jwt-token'
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'demo-user',
        email: req.body.email,
        name: req.body.name
      },
      token: 'demo-jwt-token'
    }
  });
});

app.get('/api/agents/status', (req, res) => {
  res.json({
    success: true,
    data: {
      ui: { status: 'active', activeJobs: 2 },
      backend: { status: 'active', activeJobs: 1 },
      database: { status: 'idle', activeJobs: 0 },
      integration: { status: 'idle', activeJobs: 0 },
      deployment: { status: 'active', activeJobs: 1 }
    }
  });
});

app.get('/api/agents/requests', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'req-1',
        type: 'ui',
        description: 'Generate login form component',
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'req-2',
        type: 'backend',
        description: 'Create user authentication API',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  });
});

app.post('/api/agents/request', (req, res) => {
  const { type, description, requirements } = req.body;
  
  res.json({
    success: true,
    data: {
      id: `req-${Date.now()}`,
      type,
      description,
      requirements,
      status: 'queued',
      createdAt: new Date().toISOString()
    }
  });
});

app.get('/api/builder/templates', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'template-1',
        name: 'E-commerce Dashboard',
        description: 'Complete e-commerce admin dashboard',
        category: 'dashboard',
        preview: '/api/placeholder/template-1.png'
      },
      {
        id: 'template-2',
        name: 'Blog Platform',
        description: 'Modern blog with CMS features',
        category: 'blog',
        preview: '/api/placeholder/template-2.png'
      }
    ]
  });
});

app.get('/api/apps', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'app-1',
        name: 'My First App',
        description: 'A simple todo application',
        status: 'deployed',
        url: 'https://my-first-app.demo.com',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'app-2',
        name: 'Portfolio Site',
        description: 'Personal portfolio website',
        status: 'building',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.emit('agent-status', {
    ui: { status: 'active', activeJobs: 2 },
    backend: { status: 'active', activeJobs: 1 },
    database: { status: 'idle', activeJobs: 0 },
    integration: { status: 'idle', activeJobs: 0 },
    deployment: { status: 'active', activeJobs: 1 }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 AI Agent App Builder Demo Backend running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server ready for connections`);
  console.log(`🎭 Running in DEMO mode - no external dependencies required`);
});