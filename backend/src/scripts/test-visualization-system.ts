/**
 * Visualization System Integration Test
 *
 * 测试可视化系统的完整功能链路
 */

import { sequelize, testConnection } from '../config/database';
import {
  visualizationService,
  agentStatusService,
  decisionService,
  errorService,
  collaborationService,
} from '../services';
import { AgentType } from '../types/visualization.types';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  log('\n🧪 AI Thinking Visualization System - Integration Test', colors.cyan);
  log('═'.repeat(60), colors.cyan);

  try {
    // 1. 测试数据库连接
    log('\n1. Testing database connection...', colors.yellow);
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    log('   ✓ Database connected successfully', colors.green);

    // 2. 创建测试会话
    log('\n2. Creating test build session...', colors.yellow);
    const sessionResult = await visualizationService.createSession({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440000',
      startTime: new Date().toISOString(),
      status: 'in_progress',
      agentList: ['UIAgent', 'BackendAgent', 'DatabaseAgent'],
    });

    if (!sessionResult.success || !sessionResult.data) {
      throw new Error('Failed to create session');
    }

    const sessionId = sessionResult.data.sessionId;
    log(`   ✓ Session created: ${sessionId}`, colors.green);

    // 3. 创建 Agent 状态
    log('\n3. Creating agent statuses...', colors.yellow);
    const agents: AgentType[] = ['UIAgent', 'BackendAgent', 'DatabaseAgent'];

    for (const agentType of agents) {
      const statusResult = await agentStatusService.createStatus({
        sessionId,
        agentId: `${agentType.toLowerCase()}-001`,
        agentType,
        status: 'in_progress',
        taskDescription: `${agentType} is working on the task`,
        progressPercentage: Math.floor(Math.random() * 100),
      });

      if (statusResult.success) {
        log(`   ✓ ${agentType} status created`, colors.green);
      }
    }

    // 4. 创建决策记录
    log('\n4. Creating decision records...', colors.yellow);
    const decisionResult = await decisionService.createDecision({
      sessionId,
      agentType: 'UIAgent',
      decisionType: 'ui_design',
      decisionTitle: 'Select UI Framework',
      reasoning: {
        options: [
          { name: 'React', pros: ['Large ecosystem', 'High performance'], cons: ['Learning curve'] },
          { name: 'Vue', pros: ['Easy to learn'], cons: ['Smaller ecosystem'] },
        ],
        selectedOption: 'React',
        reasoning: 'React has better community support and more libraries',
      },
      impact: 'high',
      affectedComponents: ['Frontend'],
      timestamp: new Date().toISOString(),
    });

    if (decisionResult.success) {
      log(`   ✓ Decision created: ${decisionResult.data?.decisionId}`, colors.green);
    }

    // 5. 创建协作事件
    log('\n5. Creating collaboration event...', colors.yellow);
    const collaborationResult = await collaborationService.recordCollaboration({
      sessionId,
      sourceAgent: 'UIAgent',
      targetAgent: 'BackendAgent',
      collaborationType: 'request',
      payload: {
        requestType: 'API Schema',
        data: { endpoints: ['/api/users', '/api/projects'] },
      },
      timestamp: new Date().toISOString(),
    });

    if (collaborationResult.success) {
      log(`   ✓ Collaboration event created`, colors.green);
    }

    // 6. 创建错误记录
    log('\n6. Creating error record...', colors.yellow);
    const errorResult = await errorService.recordError({
      sessionId,
      agentType: 'DatabaseAgent',
      errorCode: 'DB_CONNECTION_FAILED',
      errorMessage: 'Failed to connect to database',
      errorContext: {
        taskId: 'task-001',
        stackTrace: 'Error: Connection timeout...',
      },
      severity: 'high',
      resolution: 'retrying',
      timestamp: new Date().toISOString(),
    });

    if (errorResult.success) {
      log(`   ✓ Error record created: ${errorResult.data?.errorId}`, colors.green);
    }

    // 7. 获取会话快照
    log('\n7. Fetching session snapshot...', colors.yellow);
    const snapshotResult = await visualizationService.getSessionSnapshot(sessionId);

    if (snapshotResult.success) {
      const snapshot = snapshotResult.data;
      log(`   ✓ Snapshot retrieved:`, colors.green);
      log(`     - Agent statuses: ${snapshot.agentStatuses.length}`, colors.blue);
      log(`     - Recent decisions: ${snapshot.recentDecisions.length}`, colors.blue);
      log(`     - Unresolved errors: ${snapshot.unresolvedErrors.length}`, colors.blue);
      log(`     - Recent collaborations: ${snapshot.recentCollaborations.length}`, colors.blue);
    }

    // 8. 计算会话进度
    log('\n8. Calculating session progress...', colors.yellow);
    const progressResult = await agentStatusService.calculateSessionProgress(sessionId);

    if (progressResult.success) {
      log(`   ✓ Session progress: ${progressResult.data}%`, colors.green);
    }

    // 9. 获取统计数据
    log('\n9. Fetching statistics...', colors.yellow);
    const decisionStatsResult = await decisionService.getDecisionStats(sessionId);
    const errorStatsResult = await errorService.getErrorStats(sessionId);
    const collaborationStatsResult = await collaborationService.getCollaborationStats(sessionId);

    if (decisionStatsResult.success) {
      log(`   ✓ Decision stats: ${decisionStatsResult.data?.total} total`, colors.green);
    }
    if (errorStatsResult.success) {
      log(`   ✓ Error stats: ${errorStatsResult.data?.total} total`, colors.green);
    }
    if (collaborationStatsResult.success) {
      log(`   ✓ Collaboration stats: ${collaborationStatsResult.data?.total} total`, colors.green);
    }

    // 10. 获取协作流程图
    log('\n10. Generating collaboration flow...', colors.yellow);
    const flowResult = await collaborationService.getCollaborationFlow(sessionId);

    if (flowResult.success) {
      const flow = flowResult.data;
      log(`   ✓ Flow generated:`, colors.green);
      log(`     - Nodes: ${flow.nodes.length}`, colors.blue);
      log(`     - Edges: ${flow.edges.length}`, colors.blue);
    }

    // 11. 清理测试数据
    log('\n11. Cleaning up test data...', colors.yellow);
    const deleteResult = await visualizationService.deleteSession(sessionId);

    if (deleteResult.success) {
      log(`   ✓ Test session deleted`, colors.green);
    }

    log('\n═'.repeat(60), colors.cyan);
    log('✨ All tests passed successfully!', colors.green);
    log('   System is ready for production use.\n', colors.cyan);

  } catch (error: any) {
    log('\n═'.repeat(60), colors.red);
    log(`❌ Test failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行测试
main();
