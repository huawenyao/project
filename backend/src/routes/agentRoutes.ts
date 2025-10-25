import { Router } from 'express';
import { AgentOrchestrator } from '../services/AgentOrchestrator';
import { AIService } from '../services/AIService';
import { asyncHandler } from '../middleware/errorHandler';
import { agentRateLimit } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const orchestrator = AgentOrchestrator.getInstance();
const aiService = new AIService();

// Apply rate limiting to all agent routes
router.use(agentRateLimit);

// Get agent status and capabilities
router.get('/status', asyncHandler(async (req, res) => {
  const status = orchestrator.getAgentStatus();
  const aiAvailable = aiService.isAvailable();
  const providers = aiService.getAvailableProviders();

  res.json({
    success: true,
    data: {
      orchestrator: status,
      ai: {
        available: aiAvailable,
        providers
      },
      timestamp: new Date().toISOString()
    }
  });
}));

// Get active requests
router.get('/requests', asyncHandler(async (req, res) => {
  const activeRequests = orchestrator.getActiveRequests();
  
  res.json({
    success: true,
    data: {
      activeRequests,
      count: activeRequests.length
    }
  });
}));

// Submit a new agent request
router.post('/request', asyncHandler(async (req, res) => {
  const {
    type,
    description,
    projectId,
    requirements = [],
    constraints = [],
    context = {}
  } = req.body;

  // Validate required fields
  if (!type || !description) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Type and description are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }
    });
  }

  // Validate request type
  const validTypes = ['create_app', 'modify_app', 'deploy_app', 'integrate_service'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: {
        message: `Invalid request type. Must be one of: ${validTypes.join(', ')}`,
        code: 'INVALID_REQUEST_TYPE'
      }
    });
  }

  const requestId = uuidv4();
  const agentRequest = {
    requestId,
    userId: req.user?.id || 'anonymous',
    projectId: projectId || 'default',
    type,
    description,
    requirements,
    constraints,
    context
  };

  logger.info('Agent request submitted', {
    requestId,
    type,
    userId: agentRequest.userId,
    projectId
  });

  // Process the request asynchronously
  orchestrator.processRequest(agentRequest)
    .then(result => {
      logger.info('Agent request completed', {
        requestId,
        success: result.success
      });
    })
    .catch(error => {
      logger.error('Agent request failed', {
        requestId,
        error: error.message
      });
    });

  res.status(202).json({
    success: true,
    data: {
      requestId,
      status: 'accepted',
      message: 'Request submitted for processing'
    }
  });
}));

// Get request status
router.get('/request/:requestId', asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const activeRequests = orchestrator.getActiveRequests();
  const request = activeRequests.find(r => r.requestId === requestId);

  if (!request) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Request not found',
        code: 'REQUEST_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    data: request
  });
}));

// Cancel a request
router.delete('/request/:requestId', asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const cancelled = orchestrator.cancelRequest(requestId);

  if (!cancelled) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Request not found or already completed',
        code: 'REQUEST_NOT_FOUND'
      }
    });
  }

  logger.info('Agent request cancelled', { requestId });

  res.json({
    success: true,
    data: {
      requestId,
      status: 'cancelled'
    }
  });
}));

// Analyze user intent
router.post('/analyze-intent', asyncHandler(async (req, res) => {
  const { input, context = {} } = req.body;

  if (!input) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Input is required',
        code: 'MISSING_INPUT'
      }
    });
  }

  const analysis = await aiService.analyzeUserIntent(input, context);

  res.json({
    success: true,
    data: analysis
  });
}));

// Generate code snippet
router.post('/generate-code', asyncHandler(async (req, res) => {
  const {
    description,
    language,
    framework,
    context = {}
  } = req.body;

  if (!description || !language) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Description and language are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }
    });
  }

  const code = await aiService.generateCode(description, language, framework, context);

  res.json({
    success: true,
    data: {
      code,
      language,
      framework,
      description
    }
  });
}));

// Generate UI component
router.post('/generate-component', asyncHandler(async (req, res) => {
  const {
    componentType,
    requirements = [],
    framework = 'react'
  } = req.body;

  if (!componentType) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Component type is required',
        code: 'MISSING_COMPONENT_TYPE'
      }
    });
  }

  const component = await aiService.generateComponentCode(
    componentType,
    requirements,
    framework
  );

  res.json({
    success: true,
    data: component
  });
}));

// Optimize existing code
router.post('/optimize-code', asyncHandler(async (req, res) => {
  const {
    code,
    language,
    optimizationGoals = ['performance', 'readability']
  } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Code and language are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }
    });
  }

  const optimization = await aiService.optimizeCode(code, language, optimizationGoals);

  res.json({
    success: true,
    data: optimization
  });
}));

// Get agent capabilities
router.get('/capabilities', asyncHandler(async (req, res) => {
  const { agentType } = req.query;

  if (agentType && typeof agentType === 'string') {
    // Get capabilities for specific agent
    const agent = orchestrator['agents'].get(agentType);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Agent not found',
          code: 'AGENT_NOT_FOUND'
        }
      });
    }

    const capabilities = agent.getCapabilities();
    res.json({
      success: true,
      data: {
        agentType,
        capabilities
      }
    });
  } else {
    // Get capabilities for all agents
    const allCapabilities = {};
    orchestrator['agents'].forEach((agent, type) => {
      allCapabilities[type] = agent.getCapabilities();
    });

    res.json({
      success: true,
      data: allCapabilities
    });
  }
}));

// Health check for agents
router.get('/health', asyncHandler(async (req, res) => {
  const status = orchestrator.getAgentStatus();
  const aiHealth = aiService.isAvailable();

  const health = {
    orchestrator: {
      healthy: status.totalAgents > 0,
      agents: status.totalAgents,
      activeRequests: status.activeRequests
    },
    ai: {
      healthy: aiHealth,
      providers: aiService.getAvailableProviders()
    },
    overall: status.totalAgents > 0 && aiHealth
  };

  const statusCode = health.overall ? 200 : 503;

  res.status(statusCode).json({
    success: health.overall,
    data: health,
    timestamp: new Date().toISOString()
  });
}));

export default router;