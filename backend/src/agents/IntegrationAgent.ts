import { BaseAgent, AgentCapability, AgentExecutionContext, AgentExecutionResult } from './BaseAgent';
import { AIService } from '../services/AIService';

export class IntegrationAgent extends BaseAgent {
  constructor(aiService: AIService) {
    super(aiService, 'integration');
  }

  protected initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'setup_integration',
        description: 'Set up integration with external services and APIs',
        parameters: [
          { name: 'service', type: 'string', required: true },
          { name: 'integrationType', type: 'string', required: true },
          { name: 'configuration', type: 'object', required: false },
          { name: 'authentication', type: 'object', required: false }
        ],
        examples: ['Integrate Stripe payments', 'Connect to Salesforce CRM', 'Set up email service']
      },
      {
        name: 'create_webhook',
        description: 'Create webhook handlers for external service events',
        parameters: [
          { name: 'service', type: 'string', required: true },
          { name: 'events', type: 'array', required: true },
          { name: 'security', type: 'object', required: false }
        ],
        examples: ['Handle Stripe payment webhooks', 'Process GitHub repository events']
      },
      {
        name: 'setup_api_client',
        description: 'Create API client for external service communication',
        parameters: [
          { name: 'apiSpec', type: 'object', required: true },
          { name: 'authentication', type: 'object', required: true },
          { name: 'rateLimiting', type: 'object', required: false }
        ],
        examples: ['Create REST API client', 'Build GraphQL client wrapper']
      },
      {
        name: 'data_synchronization',
        description: 'Set up data synchronization between systems',
        parameters: [
          { name: 'sourceSystem', type: 'string', required: true },
          { name: 'targetSystem', type: 'string', required: true },
          { name: 'syncStrategy', type: 'string', required: true },
          { name: 'dataMapping', type: 'object', required: true }
        ],
        examples: ['Sync users between systems', 'Replicate product data']
      }
    ];
  }

  public async execute(
    action: string,
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    this.startExecution();
    
    try {
      this.validateParameters(action, parameters);
      this.logInfo(`Executing ${action}`, parameters);

      let result: AgentExecutionResult;

      switch (action) {
        case 'setup_integration':
          result = await this.setupIntegration(parameters, context);
          break;
        case 'create_webhook':
          result = await this.createWebhook(parameters, context);
          break;
        case 'setup_api_client':
          result = await this.setupAPIClient(parameters, context);
          break;
        case 'data_synchronization':
          result = await this.setupDataSynchronization(parameters, context);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      this.logInfo(`Successfully completed ${action}`);
      return result;

    } catch (error) {
      this.logError(`Failed to execute ${action}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.endExecution();
    }
  }

  private async setupIntegration(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { service, integrationType, configuration = {}, authentication = {} } = parameters;

    const prompt = `Set up integration with ${service} using ${integrationType}:

Configuration: ${JSON.stringify(configuration, null, 2)}
Authentication: ${JSON.stringify(authentication, null, 2)}

Create:
1. Integration service class with proper error handling
2. Authentication and authorization setup
3. API client configuration
4. Data transformation utilities
5. Error handling and retry logic
6. Rate limiting and throttling
7. Logging and monitoring
8. Integration tests
9. Configuration documentation

Common integrations:
- Payment: Stripe, PayPal, Square
- CRM: Salesforce, HubSpot, Pipedrive
- Email: SendGrid, Mailgun, AWS SES
- Storage: AWS S3, Google Cloud Storage
- Analytics: Google Analytics, Mixpanel
- Social: Facebook, Twitter, LinkedIn

Ensure:
- Secure credential management
- Proper error handling and fallbacks
- Rate limit compliance
- Data validation and sanitization
- Comprehensive logging
- Easy configuration management

Return structured integration code with documentation.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 4000
      });

      const integrationData = this.parseIntegrationResponse(response);
      
      const artifacts = [
        this.createArtifact('integration_service', `${service}_integration`, integrationData.serviceCode),
        this.createArtifact('configuration', 'integration_config', integrationData.configuration),
        this.createArtifact('tests', 'integration_tests', integrationData.tests),
        this.createArtifact('documentation', 'setup_guide', integrationData.documentation)
      ];

      return {
        success: true,
        data: integrationData,
        artifacts,
        nextSteps: [
          'Configure API credentials',
          'Set up environment variables',
          'Test integration endpoints',
          'Implement error monitoring',
          'Set up rate limit monitoring',
          'Create integration documentation'
        ],
        metadata: {
          service,
          integrationType,
          hasAuthentication: Object.keys(authentication).length > 0,
          hasConfiguration: Object.keys(configuration).length > 0
        }
      };

    } catch (error) {
      throw new Error(`Integration setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createWebhook(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { service, events, security = {} } = parameters;

    const prompt = `Create webhook handlers for ${service}:

Events to handle: ${events.join(', ')}
Security configuration: ${JSON.stringify(security, null, 2)}

Generate:
1. Webhook endpoint routes
2. Event validation and parsing
3. Signature verification for security
4. Event processing logic
5. Error handling and retry mechanisms
6. Idempotency handling
7. Logging and monitoring
8. Queue integration for async processing
9. Testing utilities

Security considerations:
- Webhook signature verification
- IP whitelist validation
- Rate limiting
- Request size limits
- Timeout handling
- HTTPS enforcement

Event processing:
- Parse and validate webhook payload
- Handle different event types
- Implement business logic for each event
- Error recovery and dead letter queues
- Monitoring and alerting

Return complete webhook implementation with security best practices.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 3500
      });

      const webhookData = this.parseWebhookResponse(response);
      
      const artifacts = [
        this.createArtifact('webhook_handlers', 'webhook_routes', webhookData.handlers),
        this.createArtifact('security_middleware', 'webhook_security', webhookData.security),
        this.createArtifact('event_processors', 'event_logic', webhookData.processors),
        this.createArtifact('webhook_tests', 'webhook_testing', webhookData.tests)
      ];

      return {
        success: true,
        data: webhookData,
        artifacts,
        nextSteps: [
          'Configure webhook URLs in external service',
          'Set up webhook signature verification',
          'Test webhook endpoints',
          'Set up monitoring and alerting',
          'Configure retry and dead letter queues'
        ],
        metadata: {
          service,
          eventsCount: events.length,
          hasSecurity: Object.keys(security).length > 0,
          securityFeatures: webhookData.securityFeatures || []
        }
      };

    } catch (error) {
      throw new Error(`Webhook creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async setupAPIClient(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { apiSpec, authentication, rateLimiting = {} } = parameters;

    const prompt = `Create API client for external service:

API Specification: ${JSON.stringify(apiSpec, null, 2)}
Authentication: ${JSON.stringify(authentication, null, 2)}
Rate Limiting: ${JSON.stringify(rateLimiting, null, 2)}

Build:
1. API client class with all endpoints
2. Authentication handling (OAuth, API keys, JWT)
3. Request/response interceptors
4. Rate limiting and retry logic
5. Error handling and custom exceptions
6. Response caching where appropriate
7. Request/response logging
8. Type definitions for requests/responses
9. Unit tests for all methods

Features:
- Automatic token refresh for OAuth
- Exponential backoff for retries
- Request deduplication
- Response validation
- Timeout handling
- Connection pooling
- Metrics collection

API Types:
- REST: Standard HTTP methods
- GraphQL: Query and mutation support
- SOAP: XML-based service calls
- gRPC: High-performance RPC

Return complete API client with comprehensive error handling.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 4000
      });

      const clientData = this.parseAPIClientResponse(response);
      
      const artifacts = [
        this.createArtifact('api_client', 'service_client', clientData.clientCode),
        this.createArtifact('type_definitions', 'api_types', clientData.types),
        this.createArtifact('client_tests', 'api_client_tests', clientData.tests),
        this.createArtifact('usage_examples', 'client_examples', clientData.examples)
      ];

      return {
        success: true,
        data: clientData,
        artifacts,
        nextSteps: [
          'Configure API credentials',
          'Test API client methods',
          'Set up error monitoring',
          'Configure rate limiting',
          'Add client to dependency injection'
        ],
        metadata: {
          apiType: apiSpec.type || 'REST',
          endpointsCount: clientData.endpointsCount || 0,
          hasRateLimiting: Object.keys(rateLimiting).length > 0,
          authType: authentication.type || 'unknown'
        }
      };

    } catch (error) {
      throw new Error(`API client setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async setupDataSynchronization(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { sourceSystem, targetSystem, syncStrategy, dataMapping } = parameters;

    const prompt = `Set up data synchronization between systems:

Source System: ${sourceSystem}
Target System: ${targetSystem}
Sync Strategy: ${syncStrategy}
Data Mapping: ${JSON.stringify(dataMapping, null, 2)}

Implement:
1. Data extraction from source system
2. Data transformation and mapping
3. Data loading to target system
4. Conflict resolution strategies
5. Incremental sync mechanisms
6. Error handling and recovery
7. Sync monitoring and logging
8. Data validation and integrity checks
9. Rollback procedures

Sync Strategies:
- real-time: Immediate synchronization
- batch: Scheduled batch processing
- event-driven: Triggered by events
- bidirectional: Two-way synchronization

Features:
- Change detection and tracking
- Duplicate prevention
- Data validation
- Transformation pipelines
- Error recovery
- Performance optimization
- Monitoring and alerting

Return complete synchronization system with monitoring.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 4000
      });

      const syncData = this.parseSyncResponse(response);
      
      const artifacts = [
        this.createArtifact('sync_service', 'data_synchronization', syncData.syncService),
        this.createArtifact('data_mappers', 'transformation_logic', syncData.mappers),
        this.createArtifact('sync_monitoring', 'sync_dashboard', syncData.monitoring),
        this.createArtifact('sync_tests', 'synchronization_tests', syncData.tests)
      ];

      return {
        success: true,
        data: syncData,
        artifacts,
        nextSteps: [
          'Configure source and target connections',
          'Test data mapping transformations',
          'Set up sync scheduling',
          'Configure monitoring and alerts',
          'Test conflict resolution',
          'Set up data validation'
        ],
        metadata: {
          sourceSystem,
          targetSystem,
          syncStrategy,
          mappingFieldsCount: Object.keys(dataMapping).length,
          isBidirectional: syncData.isBidirectional || false
        }
      };

    } catch (error) {
      throw new Error(`Data synchronization setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods for parsing AI responses
  private parseIntegrationResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        serviceCode: response,
        configuration: {},
        tests: {},
        documentation: 'Integration setup guide'
      };
    } catch (error) {
      return {
        serviceCode: response,
        configuration: {},
        tests: {},
        documentation: 'Integration setup guide'
      };
    }
  }

  private parseWebhookResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        handlers: response,
        security: {},
        processors: {},
        tests: {}
      };
    } catch (error) {
      return {
        handlers: response,
        security: {},
        processors: {},
        tests: {}
      };
    }
  }

  private parseAPIClientResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        clientCode: response,
        types: {},
        tests: {},
        examples: {}
      };
    } catch (error) {
      return {
        clientCode: response,
        types: {},
        tests: {},
        examples: {}
      };
    }
  }

  private parseSyncResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        syncService: response,
        mappers: {},
        monitoring: {},
        tests: {}
      };
    } catch (error) {
      return {
        syncService: response,
        mappers: {},
        monitoring: {},
        tests: {}
      };
    }
  }
}