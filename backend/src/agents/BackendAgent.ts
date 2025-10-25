import { BaseAgent, AgentCapability, AgentExecutionContext, AgentExecutionResult } from './BaseAgent';
import { AIService } from '../services/AIService';

export class BackendAgent extends BaseAgent {
  constructor(aiService: AIService) {
    super(aiService, 'backend');
  }

  protected initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'create_api',
        description: 'Create RESTful API endpoints with full CRUD operations',
        parameters: [
          { name: 'entities', type: 'array', required: true },
          { name: 'framework', type: 'string', required: false, default: 'express' },
          { name: 'database', type: 'string', required: false, default: 'postgresql' },
          { name: 'authentication', type: 'boolean', required: false, default: true }
        ],
        examples: ['Create user management API', 'Build product catalog API']
      },
      {
        name: 'update_api',
        description: 'Modify existing API endpoints and business logic',
        parameters: [
          { name: 'endpoint', type: 'string', required: true },
          { name: 'changes', type: 'array', required: true },
          { name: 'preserveData', type: 'boolean', required: false, default: true }
        ],
        examples: ['Add validation to user endpoint', 'Update product search logic']
      },
      {
        name: 'create_middleware',
        description: 'Generate middleware for authentication, validation, logging',
        parameters: [
          { name: 'type', type: 'string', required: true },
          { name: 'configuration', type: 'object', required: false },
          { name: 'framework', type: 'string', required: false, default: 'express' }
        ],
        examples: ['Create JWT authentication middleware', 'Build request validation middleware']
      },
      {
        name: 'implement_business_logic',
        description: 'Create complex business logic and workflows',
        parameters: [
          { name: 'workflow', type: 'string', required: true },
          { name: 'rules', type: 'array', required: true },
          { name: 'integrations', type: 'array', required: false }
        ],
        examples: ['Implement order processing workflow', 'Create user onboarding logic']
      },
      {
        name: 'optimize_performance',
        description: 'Optimize API performance and database queries',
        parameters: [
          { name: 'targetEndpoints', type: 'array', required: true },
          { name: 'metrics', type: 'object', required: false },
          { name: 'constraints', type: 'array', required: false }
        ],
        examples: ['Optimize slow database queries', 'Implement caching strategy']
      },
      {
        name: 'add_security',
        description: 'Implement security measures and best practices',
        parameters: [
          { name: 'securityLevel', type: 'string', required: true },
          { name: 'threats', type: 'array', required: false },
          { name: 'compliance', type: 'array', required: false }
        ],
        examples: ['Add rate limiting and CORS', 'Implement data encryption']
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
        case 'create_api':
          result = await this.createAPI(parameters, context);
          break;
        case 'update_api':
          result = await this.updateAPI(parameters, context);
          break;
        case 'create_middleware':
          result = await this.createMiddleware(parameters, context);
          break;
        case 'implement_business_logic':
          result = await this.implementBusinessLogic(parameters, context);
          break;
        case 'optimize_performance':
          result = await this.optimizePerformance(parameters, context);
          break;
        case 'add_security':
          result = await this.addSecurity(parameters, context);
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

  private async createAPI(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { entities, framework = 'express', database = 'postgresql', authentication = true } = parameters;

    const prompt = `Create a complete RESTful API with the following specifications:

Entities: ${entities.map((e: any) => typeof e === 'string' ? e : JSON.stringify(e)).join(', ')}
Framework: ${framework}
Database: ${database}
Authentication: ${authentication ? 'Required' : 'Not required'}

Generate:
1. API route definitions with full CRUD operations
2. Controller functions with proper error handling
3. Data models/schemas
4. Input validation middleware
5. Database connection and query functions
6. Authentication middleware (if required)
7. API documentation
8. Unit tests for endpoints

Requirements:
- RESTful conventions
- Proper HTTP status codes
- Input validation and sanitization
- Error handling and logging
- Security best practices
- Scalable architecture
- Database transactions where needed

Return as JSON with separate sections for routes, controllers, models, middleware, and documentation.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 5000
      });

      const apiData = this.parseAPIResponse(response);
      
      const artifacts = [
        this.createArtifact('api_routes', 'routes', apiData.routes),
        this.createArtifact('controllers', 'controllers', apiData.controllers),
        this.createArtifact('models', 'data_models', apiData.models),
        this.createArtifact('middleware', 'middleware', apiData.middleware),
        this.createArtifact('documentation', 'api_docs', apiData.documentation),
        this.createArtifact('tests', 'unit_tests', apiData.tests)
      ];

      return {
        success: true,
        data: apiData,
        artifacts,
        nextSteps: [
          'Set up database connections',
          'Install required dependencies',
          'Configure environment variables',
          'Run database migrations',
          'Test API endpoints',
          'Set up monitoring and logging'
        ],
        metadata: {
          framework,
          database,
          entitiesCount: entities.length,
          hasAuthentication: authentication,
          endpointsGenerated: this.countEndpoints(apiData.routes)
        }
      };

    } catch (error) {
      throw new Error(`API creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateAPI(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { endpoint, changes, preserveData = true } = parameters;

    const prompt = `Update the following API endpoint: ${endpoint}

Requested changes:
${changes.map((c: string) => `- ${c}`).join('\n')}

Preserve existing data: ${preserveData}
Current API context: ${JSON.stringify(context.workspace, null, 2)}

Provide:
1. Updated endpoint code
2. Migration scripts if data structure changes
3. Updated validation rules
4. Modified tests
5. Documentation updates
6. Backward compatibility considerations

Ensure the changes don't break existing functionality and maintain API versioning if needed.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.3,
        maxTokens: 3500
      });

      const updateData = this.parseUpdateResponse(response);
      
      const artifacts = [
        this.createArtifact('updated_endpoint', endpoint, updateData.code),
        this.createArtifact('migration_scripts', 'migrations', updateData.migrations),
        this.createArtifact('updated_tests', 'tests', updateData.tests)
      ];

      return {
        success: true,
        data: updateData,
        artifacts,
        nextSteps: updateData.nextSteps || [
          'Review code changes',
          'Run migration scripts',
          'Update API documentation',
          'Test updated functionality'
        ],
        metadata: {
          endpoint,
          changesCount: changes.length,
          preserveData,
          hasBreakingChanges: updateData.hasBreakingChanges || false
        }
      };

    } catch (error) {
      throw new Error(`API update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createMiddleware(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { type, configuration = {}, framework = 'express' } = parameters;

    const prompt = `Create ${type} middleware for ${framework}:

Configuration: ${JSON.stringify(configuration, null, 2)}

Generate:
1. Middleware function with proper error handling
2. Configuration options and defaults
3. Integration instructions
4. Usage examples
5. Unit tests
6. Documentation

Common middleware types and their requirements:
- Authentication: JWT validation, session management
- Validation: Request body/query validation, sanitization
- Logging: Request/response logging, performance metrics
- Rate limiting: Request throttling, abuse prevention
- CORS: Cross-origin resource sharing configuration
- Security: Helmet, XSS protection, CSRF tokens

Ensure the middleware is reusable, configurable, and follows best practices.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 3000
      });

      const middlewareData = this.parseMiddlewareResponse(response);
      
      const artifacts = [
        this.createArtifact('middleware', type, middlewareData.code),
        this.createArtifact('configuration', 'config', middlewareData.configuration),
        this.createArtifact('tests', 'middleware_tests', middlewareData.tests),
        this.createArtifact('documentation', 'usage_guide', middlewareData.documentation)
      ];

      return {
        success: true,
        data: middlewareData,
        artifacts,
        nextSteps: [
          'Install required dependencies',
          'Configure middleware options',
          'Add to application middleware stack',
          'Test middleware functionality'
        ],
        metadata: {
          type,
          framework,
          hasConfiguration: Object.keys(configuration).length > 0
        }
      };

    } catch (error) {
      throw new Error(`Middleware creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async implementBusinessLogic(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { workflow, rules, integrations = [] } = parameters;

    const prompt = `Implement business logic for: ${workflow}

Business Rules:
${rules.map((r: string) => `- ${r}`).join('\n')}

External Integrations: ${integrations.join(', ')}

Create:
1. Main workflow orchestration function
2. Individual business rule implementations
3. Integration handlers for external services
4. Error handling and rollback mechanisms
5. Validation and data transformation
6. Audit logging and monitoring
7. Unit and integration tests

Requirements:
- Modular, testable code structure
- Proper error handling and recovery
- Transaction management for data consistency
- Performance optimization
- Scalability considerations
- Comprehensive logging

Return structured code with clear separation of concerns.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.5,
        maxTokens: 4000
      });

      const businessLogicData = this.parseBusinessLogicResponse(response);
      
      const artifacts = [
        this.createArtifact('workflow', 'main_workflow', businessLogicData.workflow),
        this.createArtifact('business_rules', 'rules', businessLogicData.rules),
        this.createArtifact('integrations', 'external_services', businessLogicData.integrations),
        this.createArtifact('tests', 'business_logic_tests', businessLogicData.tests)
      ];

      return {
        success: true,
        data: businessLogicData,
        artifacts,
        nextSteps: [
          'Set up external service connections',
          'Configure business rule parameters',
          'Test workflow end-to-end',
          'Set up monitoring and alerts'
        ],
        metadata: {
          workflow,
          rulesCount: rules.length,
          integrationsCount: integrations.length
        }
      };

    } catch (error) {
      throw new Error(`Business logic implementation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async optimizePerformance(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { targetEndpoints, metrics = {}, constraints = [] } = parameters;

    const prompt = `Optimize performance for these API endpoints:
${targetEndpoints.join(', ')}

Current Performance Metrics: ${JSON.stringify(metrics, null, 2)}
Constraints: ${constraints.join(', ')}

Provide optimization strategies:
1. Database query optimization
2. Caching implementation (Redis, in-memory)
3. Request/response compression
4. Connection pooling
5. Async processing for heavy operations
6. Rate limiting and throttling
7. Code-level optimizations
8. Monitoring and profiling setup

Include:
- Specific code improvements
- Configuration changes
- Infrastructure recommendations
- Performance benchmarks
- Monitoring setup

Focus on measurable improvements while maintaining code quality.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 4000
      });

      const optimizationData = this.parseOptimizationResponse(response);
      
      const artifacts = [
        this.createArtifact('optimized_code', 'performance_improvements', optimizationData.code),
        this.createArtifact('caching_strategy', 'cache_config', optimizationData.caching),
        this.createArtifact('monitoring_setup', 'performance_monitoring', optimizationData.monitoring),
        this.createArtifact('benchmarks', 'performance_tests', optimizationData.benchmarks)
      ];

      return {
        success: true,
        data: optimizationData,
        artifacts,
        nextSteps: [
          'Implement caching layer',
          'Update database indexes',
          'Deploy performance monitoring',
          'Run performance benchmarks',
          'Monitor production metrics'
        ],
        metadata: {
          endpointsCount: targetEndpoints.length,
          optimizationStrategies: optimizationData.strategies?.length || 0,
          hasMetrics: Object.keys(metrics).length > 0
        }
      };

    } catch (error) {
      throw new Error(`Performance optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async addSecurity(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { securityLevel, threats = [], compliance = [] } = parameters;

    const prompt = `Implement security measures for ${securityLevel} security level:

Potential Threats: ${threats.join(', ')}
Compliance Requirements: ${compliance.join(', ')}

Implement:
1. Authentication and authorization
2. Input validation and sanitization
3. Rate limiting and DDoS protection
4. Data encryption (at rest and in transit)
5. Security headers and CORS configuration
6. Audit logging and monitoring
7. Vulnerability scanning setup
8. Security testing procedures

Security Levels:
- Basic: Essential security measures
- Standard: Comprehensive protection
- Enterprise: Advanced security with compliance

Provide:
- Security middleware and configurations
- Environment variable templates
- Security testing scripts
- Documentation and best practices
- Compliance checklists

Ensure all implementations follow OWASP guidelines.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.3,
        maxTokens: 4500
      });

      const securityData = this.parseSecurityResponse(response);
      
      const artifacts = [
        this.createArtifact('security_middleware', 'security_config', securityData.middleware),
        this.createArtifact('auth_system', 'authentication', securityData.authentication),
        this.createArtifact('security_tests', 'security_testing', securityData.tests),
        this.createArtifact('compliance_checklist', 'compliance', securityData.compliance)
      ];

      return {
        success: true,
        data: securityData,
        artifacts,
        nextSteps: [
          'Configure security environment variables',
          'Set up SSL/TLS certificates',
          'Implement security monitoring',
          'Run security vulnerability scans',
          'Train team on security practices'
        ],
        metadata: {
          securityLevel,
          threatsCount: threats.length,
          complianceCount: compliance.length,
          securityMeasures: securityData.measures?.length || 0
        }
      };

    } catch (error) {
      throw new Error(`Security implementation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods for parsing AI responses
  private parseAPIResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        routes: response,
        controllers: {},
        models: {},
        middleware: {},
        documentation: 'Generated API documentation',
        tests: {}
      };
    } catch (error) {
      return {
        routes: response,
        controllers: {},
        models: {},
        middleware: {},
        documentation: 'Generated API documentation',
        tests: {}
      };
    }
  }

  private parseUpdateResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        code: response,
        migrations: {},
        tests: {},
        nextSteps: []
      };
    } catch (error) {
      return {
        code: response,
        migrations: {},
        tests: {},
        nextSteps: []
      };
    }
  }

  private parseMiddlewareResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        code: response,
        configuration: {},
        tests: {},
        documentation: 'Middleware usage guide'
      };
    } catch (error) {
      return {
        code: response,
        configuration: {},
        tests: {},
        documentation: 'Middleware usage guide'
      };
    }
  }

  private parseBusinessLogicResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        workflow: response,
        rules: {},
        integrations: {},
        tests: {}
      };
    } catch (error) {
      return {
        workflow: response,
        rules: {},
        integrations: {},
        tests: {}
      };
    }
  }

  private parseOptimizationResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        code: response,
        caching: {},
        monitoring: {},
        benchmarks: {}
      };
    } catch (error) {
      return {
        code: response,
        caching: {},
        monitoring: {},
        benchmarks: {}
      };
    }
  }

  private parseSecurityResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        middleware: response,
        authentication: {},
        tests: {},
        compliance: {}
      };
    } catch (error) {
      return {
        middleware: response,
        authentication: {},
        tests: {},
        compliance: {}
      };
    }
  }

  private countEndpoints(routes: any): number {
    if (typeof routes === 'string') {
      // Count HTTP method keywords in the string
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      let count = 0;
      methods.forEach(method => {
        const matches = routes.match(new RegExp(method, 'gi'));
        if (matches) count += matches.length;
      });
      return count;
    }
    
    if (typeof routes === 'object') {
      return Object.keys(routes).length;
    }
    
    return 0;
  }
}