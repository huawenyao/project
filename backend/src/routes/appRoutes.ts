import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { userRateLimit } from '../middleware/rateLimiter';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply user-specific rate limiting
router.use(userRateLimit(100, 60)); // 100 requests per minute per user

// Mock app data store (in production, use database)
const mockApps = new Map();

// Get all apps for user
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const userApps = Array.from(mockApps.values()).filter(app => app.userId === userId);

  res.json({
    success: true,
    data: {
      apps: userApps,
      count: userApps.length
    }
  });
}));

// Get specific app
router.get('/:appId', asyncHandler(async (req, res) => {
  const { appId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  // Check if user owns the app
  const userId = req.user?.id || 'anonymous';
  if (app.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      }
    });
  }

  res.json({
    success: true,
    data: app
  });
}));

// Create new app
router.post('/', asyncHandler(async (req, res) => {
  const {
    name,
    description,
    type = 'web',
    template,
    configuration = {}
  } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'App name is required',
        code: 'MISSING_APP_NAME'
      }
    });
  }

  const appId = uuidv4();
  const userId = req.user?.id || 'anonymous';

  const newApp = {
    id: appId,
    userId,
    name,
    description,
    type,
    template,
    configuration,
    status: 'draft',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deployments: [],
    components: [],
    integrations: []
  };

  mockApps.set(appId, newApp);

  res.status(201).json({
    success: true,
    data: newApp
  });
}));

// Update app
router.put('/:appId', asyncHandler(async (req, res) => {
  const { appId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  // Check if user owns the app
  const userId = req.user?.id || 'anonymous';
  if (app.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      }
    });
  }

  const {
    name,
    description,
    configuration,
    status
  } = req.body;

  // Update app properties
  if (name) app.name = name;
  if (description) app.description = description;
  if (configuration) app.configuration = { ...app.configuration, ...configuration };
  if (status) app.status = status;
  
  app.updatedAt = new Date().toISOString();

  mockApps.set(appId, app);

  res.json({
    success: true,
    data: app
  });
}));

// Delete app
router.delete('/:appId', asyncHandler(async (req, res) => {
  const { appId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  // Check if user owns the app
  const userId = req.user?.id || 'anonymous';
  if (app.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      }
    });
  }

  mockApps.delete(appId);

  res.json({
    success: true,
    message: 'App deleted successfully'
  });
}));

// Get app components
router.get('/:appId/components', asyncHandler(async (req, res) => {
  const { appId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    data: {
      components: app.components || [],
      count: app.components?.length || 0
    }
  });
}));

// Add component to app
router.post('/:appId/components', asyncHandler(async (req, res) => {
  const { appId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  const {
    type,
    name,
    configuration = {},
    position = { x: 0, y: 0 }
  } = req.body;

  if (!type || !name) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Component type and name are required',
        code: 'MISSING_COMPONENT_INFO'
      }
    });
  }

  const componentId = uuidv4();
  const component = {
    id: componentId,
    type,
    name,
    configuration,
    position,
    createdAt: new Date().toISOString()
  };

  if (!app.components) app.components = [];
  app.components.push(component);
  app.updatedAt = new Date().toISOString();

  mockApps.set(appId, app);

  res.status(201).json({
    success: true,
    data: component
  });
}));

// Update component
router.put('/:appId/components/:componentId', asyncHandler(async (req, res) => {
  const { appId, componentId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  const componentIndex = app.components?.findIndex(c => c.id === componentId);
  if (componentIndex === -1 || componentIndex === undefined) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Component not found',
        code: 'COMPONENT_NOT_FOUND'
      }
    });
  }

  const { name, configuration, position } = req.body;
  const component = app.components[componentIndex];

  if (name) component.name = name;
  if (configuration) component.configuration = { ...component.configuration, ...configuration };
  if (position) component.position = position;
  
  component.updatedAt = new Date().toISOString();
  app.updatedAt = new Date().toISOString();

  mockApps.set(appId, app);

  res.json({
    success: true,
    data: component
  });
}));

// Delete component
router.delete('/:appId/components/:componentId', asyncHandler(async (req, res) => {
  const { appId, componentId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  const componentIndex = app.components?.findIndex(c => c.id === componentId);
  if (componentIndex === -1 || componentIndex === undefined) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Component not found',
        code: 'COMPONENT_NOT_FOUND'
      }
    });
  }

  app.components.splice(componentIndex, 1);
  app.updatedAt = new Date().toISOString();

  mockApps.set(appId, app);

  res.json({
    success: true,
    message: 'Component deleted successfully'
  });
}));

// Get app deployments
router.get('/:appId/deployments', asyncHandler(async (req, res) => {
  const { appId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    data: {
      deployments: app.deployments || [],
      count: app.deployments?.length || 0
    }
  });
}));

// Deploy app
router.post('/:appId/deploy', asyncHandler(async (req, res) => {
  const { appId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  const {
    environment = 'staging',
    platform = 'vercel',
    configuration = {}
  } = req.body;

  const deploymentId = uuidv4();
  const deployment = {
    id: deploymentId,
    environment,
    platform,
    configuration,
    status: 'deploying',
    version: app.version,
    url: `https://${appId}-${environment}.example.com`,
    createdAt: new Date().toISOString()
  };

  if (!app.deployments) app.deployments = [];
  app.deployments.push(deployment);
  app.updatedAt = new Date().toISOString();

  mockApps.set(appId, app);

  // Simulate deployment process
  setTimeout(() => {
    deployment.status = 'deployed';
    deployment.deployedAt = new Date().toISOString();
    mockApps.set(appId, app);
  }, 2000);

  res.status(202).json({
    success: true,
    data: deployment
  });
}));

// Get app integrations
router.get('/:appId/integrations', asyncHandler(async (req, res) => {
  const { appId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    data: {
      integrations: app.integrations || [],
      count: app.integrations?.length || 0
    }
  });
}));

// Add integration to app
router.post('/:appId/integrations', asyncHandler(async (req, res) => {
  const { appId } = req.params;
  const app = mockApps.get(appId);

  if (!app) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'App not found',
        code: 'APP_NOT_FOUND'
      }
    });
  }

  const {
    service,
    type,
    configuration = {}
  } = req.body;

  if (!service || !type) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Service and type are required',
        code: 'MISSING_INTEGRATION_INFO'
      }
    });
  }

  const integrationId = uuidv4();
  const integration = {
    id: integrationId,
    service,
    type,
    configuration,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  if (!app.integrations) app.integrations = [];
  app.integrations.push(integration);
  app.updatedAt = new Date().toISOString();

  mockApps.set(appId, app);

  res.status(201).json({
    success: true,
    data: integration
  });
}));

export default router;