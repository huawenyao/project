import { BaseAgent, AgentCapability, AgentExecutionContext, AgentExecutionResult } from './BaseAgent';
import { AIService } from '../services/AIService';

export class DatabaseAgent extends BaseAgent {
  constructor(aiService: AIService) {
    super(aiService, 'database');
  }

  protected initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'design_schema',
        description: 'Design database schema with tables, relationships, and constraints',
        parameters: [
          { name: 'entities', type: 'array', required: true },
          { name: 'relationships', type: 'array', required: false },
          { name: 'database', type: 'string', required: false, default: 'postgresql' },
          { name: 'constraints', type: 'array', required: false }
        ],
        examples: ['Design user and product tables', 'Create order management schema']
      },
      {
        name: 'optimize_queries',
        description: 'Optimize database queries and create indexes',
        parameters: [
          { name: 'queries', type: 'array', required: true },
          { name: 'performanceGoals', type: 'object', required: false },
          { name: 'dataVolume', type: 'string', required: false }
        ],
        examples: ['Optimize slow SELECT queries', 'Create indexes for search functionality']
      },
      {
        name: 'create_migrations',
        description: 'Generate database migration scripts',
        parameters: [
          { name: 'changes', type: 'array', required: true },
          { name: 'database', type: 'string', required: false, default: 'postgresql' },
          { name: 'preserveData', type: 'boolean', required: false, default: true }
        ],
        examples: ['Add new columns to existing table', 'Create new tables with relationships']
      },
      {
        name: 'setup_replication',
        description: 'Configure database replication and backup strategies',
        parameters: [
          { name: 'replicationType', type: 'string', required: true },
          { name: 'backupStrategy', type: 'string', required: false },
          { name: 'database', type: 'string', required: false, default: 'postgresql' }
        ],
        examples: ['Set up master-slave replication', 'Configure automated backups']
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
        case 'design_schema':
          result = await this.designSchema(parameters, context);
          break;
        case 'optimize_queries':
          result = await this.optimizeQueries(parameters, context);
          break;
        case 'create_migrations':
          result = await this.createMigrations(parameters, context);
          break;
        case 'setup_replication':
          result = await this.setupReplication(parameters, context);
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

  private async designSchema(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { entities, relationships = [], database = 'postgresql', constraints = [] } = parameters;

    const prompt = `Design a comprehensive database schema:

Entities: ${entities.map((e: any) => typeof e === 'string' ? e : JSON.stringify(e)).join(', ')}
Relationships: ${relationships.join(', ')}
Database: ${database}
Additional Constraints: ${constraints.join(', ')}

Create:
1. Complete table definitions with appropriate data types
2. Primary and foreign key relationships
3. Indexes for performance optimization
4. Constraints and validation rules
5. Database triggers if needed
6. Initial seed data structure
7. Migration scripts to create the schema

Requirements:
- Follow database normalization principles
- Ensure referential integrity
- Consider performance implications
- Include audit fields (created_at, updated_at, etc.)
- Add appropriate indexes
- Handle soft deletes where applicable
- Consider future scalability

Return as JSON with tables, relationships, indexes, and migration scripts.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.3,
        maxTokens: 4000
      });

      const schemaData = this.parseSchemaResponse(response);
      
      const artifacts = [
        this.createArtifact('schema_definition', 'database_schema', schemaData.schema),
        this.createArtifact('migration_scripts', 'create_tables', schemaData.migrations),
        this.createArtifact('indexes', 'performance_indexes', schemaData.indexes),
        this.createArtifact('seed_data', 'initial_data', schemaData.seedData)
      ];

      return {
        success: true,
        data: schemaData,
        artifacts,
        nextSteps: [
          'Review schema design',
          'Run migration scripts',
          'Create database indexes',
          'Insert seed data',
          'Test data relationships',
          'Set up database monitoring'
        ],
        metadata: {
          database,
          tablesCount: schemaData.tablesCount || entities.length,
          relationshipsCount: relationships.length,
          hasConstraints: constraints.length > 0
        }
      };

    } catch (error) {
      throw new Error(`Schema design failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async optimizeQueries(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { queries, performanceGoals = {}, dataVolume = 'medium' } = parameters;

    const prompt = `Optimize these database queries for better performance:

Queries to optimize:
${queries.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Performance Goals: ${JSON.stringify(performanceGoals, null, 2)}
Expected Data Volume: ${dataVolume}

Provide:
1. Optimized query versions
2. Required indexes for optimal performance
3. Query execution plan analysis
4. Performance benchmarking suggestions
5. Alternative query approaches
6. Caching strategies
7. Database configuration recommendations

Focus on:
- Query execution time reduction
- Memory usage optimization
- Index utilization
- Join optimization
- Subquery elimination where possible
- Proper use of LIMIT and pagination

Return detailed optimization report with before/after comparisons.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 4000
      });

      const optimizationData = this.parseOptimizationResponse(response);
      
      const artifacts = [
        this.createArtifact('optimized_queries', 'improved_queries', optimizationData.queries),
        this.createArtifact('required_indexes', 'performance_indexes', optimizationData.indexes),
        this.createArtifact('benchmarking', 'performance_tests', optimizationData.benchmarks),
        this.createArtifact('optimization_report', 'analysis', optimizationData.report)
      ];

      return {
        success: true,
        data: optimizationData,
        artifacts,
        nextSteps: [
          'Create recommended indexes',
          'Test optimized queries',
          'Run performance benchmarks',
          'Monitor query performance',
          'Implement caching if needed'
        ],
        metadata: {
          queriesCount: queries.length,
          dataVolume,
          hasPerformanceGoals: Object.keys(performanceGoals).length > 0,
          estimatedImprovement: optimizationData.estimatedImprovement || 'Unknown'
        }
      };

    } catch (error) {
      throw new Error(`Query optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createMigrations(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { changes, database = 'postgresql', preserveData = true } = parameters;

    const prompt = `Create database migration scripts for these changes:

Changes requested:
${changes.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

Database: ${database}
Preserve existing data: ${preserveData}

Generate:
1. Forward migration scripts (up)
2. Rollback migration scripts (down)
3. Data migration scripts if needed
4. Index creation/modification scripts
5. Constraint updates
6. Backup recommendations before migration
7. Testing procedures for migrations

Requirements:
- Ensure zero-downtime deployment where possible
- Handle data type conversions safely
- Maintain referential integrity
- Include proper error handling
- Add migration validation steps
- Consider large table migrations
- Provide rollback procedures

Return structured migration files with proper naming and sequencing.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.3,
        maxTokens: 3500
      });

      const migrationData = this.parseMigrationResponse(response);
      
      const artifacts = [
        this.createArtifact('up_migrations', 'forward_migrations', migrationData.upMigrations),
        this.createArtifact('down_migrations', 'rollback_migrations', migrationData.downMigrations),
        this.createArtifact('data_migrations', 'data_scripts', migrationData.dataMigrations),
        this.createArtifact('migration_guide', 'deployment_guide', migrationData.guide)
      ];

      return {
        success: true,
        data: migrationData,
        artifacts,
        nextSteps: [
          'Review migration scripts',
          'Test migrations on staging',
          'Create database backup',
          'Run migrations in sequence',
          'Verify data integrity',
          'Monitor application performance'
        ],
        metadata: {
          database,
          changesCount: changes.length,
          preserveData,
          hasDataMigrations: !!migrationData.dataMigrations,
          riskLevel: migrationData.riskLevel || 'medium'
        }
      };

    } catch (error) {
      throw new Error(`Migration creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async setupReplication(
    parameters: any,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const { replicationType, backupStrategy = 'automated', database = 'postgresql' } = parameters;

    const prompt = `Set up database replication and backup strategy:

Replication Type: ${replicationType}
Backup Strategy: ${backupStrategy}
Database: ${database}

Configure:
1. Master-slave/master-master replication setup
2. Automated backup procedures
3. Failover and recovery procedures
4. Monitoring and alerting
5. Data consistency checks
6. Performance optimization for replication
7. Security configuration for replicas
8. Disaster recovery procedures

Replication Types:
- streaming: Real-time streaming replication
- logical: Logical replication for specific tables
- synchronous: Synchronous replication for consistency
- asynchronous: Asynchronous for performance

Provide:
- Configuration files and scripts
- Setup procedures and commands
- Monitoring and maintenance scripts
- Recovery procedures
- Performance tuning recommendations

Ensure high availability and data consistency.`;

    try {
      const response = await this.generateWithAI(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 4000
      });

      const replicationData = this.parseReplicationResponse(response);
      
      const artifacts = [
        this.createArtifact('replication_config', 'replication_setup', replicationData.configuration),
        this.createArtifact('backup_scripts', 'backup_automation', replicationData.backupScripts),
        this.createArtifact('monitoring_setup', 'replication_monitoring', replicationData.monitoring),
        this.createArtifact('recovery_procedures', 'disaster_recovery', replicationData.recovery)
      ];

      return {
        success: true,
        data: replicationData,
        artifacts,
        nextSteps: [
          'Set up replica servers',
          'Configure replication settings',
          'Test failover procedures',
          'Set up monitoring alerts',
          'Schedule backup testing',
          'Document recovery procedures'
        ],
        metadata: {
          replicationType,
          backupStrategy,
          database,
          highAvailability: true,
          estimatedRTO: replicationData.estimatedRTO || 'Unknown',
          estimatedRPO: replicationData.estimatedRPO || 'Unknown'
        }
      };

    } catch (error) {
      throw new Error(`Replication setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods for parsing AI responses
  private parseSchemaResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        schema: response,
        migrations: {},
        indexes: {},
        seedData: {},
        tablesCount: 0
      };
    } catch (error) {
      return {
        schema: response,
        migrations: {},
        indexes: {},
        seedData: {},
        tablesCount: 0
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
        queries: response,
        indexes: {},
        benchmarks: {},
        report: 'Query optimization analysis'
      };
    } catch (error) {
      return {
        queries: response,
        indexes: {},
        benchmarks: {},
        report: 'Query optimization analysis'
      };
    }
  }

  private parseMigrationResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        upMigrations: response,
        downMigrations: {},
        dataMigrations: {},
        guide: 'Migration deployment guide'
      };
    } catch (error) {
      return {
        upMigrations: response,
        downMigrations: {},
        dataMigrations: {},
        guide: 'Migration deployment guide'
      };
    }
  }

  private parseReplicationResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        configuration: response,
        backupScripts: {},
        monitoring: {},
        recovery: {}
      };
    } catch (error) {
      return {
        configuration: response,
        backupScripts: {},
        monitoring: {},
        recovery: {}
      };
    }
  }
}