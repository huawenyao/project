import 'dotenv/config';
import { UserService } from '../services/UserService';
import { ProjectService } from '../services/ProjectService';
import { AgentService } from '../services/AgentService';
import { TaskService } from '../services/TaskService';
import { logger } from '../utils/logger';

/**
 * MVP演示脚本
 * 演示AI-Native平台核心功能流程
 */

async function runMVPDemo() {
  console.log('🚀 AI-Native Platform MVP 演示');
  console.log('=====================================\n');

  try {
    // ========== Step 1: 用户注册 ==========
    console.log('📝 Step 1: 用户注册');
    console.log('-----------------------------------');

    let userResult;
    try {
      userResult = await UserService.register({
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'Demo123456',
        fullName: 'Demo User',
      });
      console.log('✅ 用户注册成功');
      console.log(`   用户ID: ${userResult.user.id}`);
      console.log(`   用户名: ${userResult.user.username}`);
      console.log(`   JWT Token: ${userResult.token.substring(0, 30)}...`);
    } catch (error: any) {
      // 如果用户已存在，尝试登录
      if (error.message.includes('已被使用')) {
        console.log('⚠️  用户已存在，尝试登录...');
        userResult = await UserService.login({
          usernameOrEmail: 'demo_user',
          password: 'Demo123456',
        });
        console.log('✅ 用户登录成功');
      } else {
        throw error;
      }
    }

    const userId = userResult.user.id;
    console.log();

    // ========== Step 2: 创建项目（含AI需求分析） ==========
    console.log('🎯 Step 2: 创建项目（AI需求分析）');
    console.log('-----------------------------------');

    const requirementText = `
我想创建一个在线教育平台，主要功能包括：
1. 用户注册和登录
2. 课程浏览和搜索
3. 视频播放功能
4. 在线测验系统
5. 学习进度跟踪
6. 教师和学生仪表板
7. 支付集成
请使用React作为前端，Node.js作为后端。
    `.trim();

    console.log('📄 需求描述:');
    console.log(requirementText);
    console.log();

    const project = await ProjectService.createProject({
      userId,
      name: 'Online Education Platform',
      requirementText,
    });

    console.log('✅ 项目创建成功');
    console.log(`   项目ID: ${project.id}`);
    console.log(`   项目名称: ${project.name}`);
    console.log(`   状态: ${project.status}`);

    if (project.requirementSummary) {
      console.log('   🤖 AI分析结果:');
      console.log(`      应用类型: ${(project.requirementSummary as any).appType || '未知'}`);
      console.log(`      复杂度: ${(project.requirementSummary as any).complexity || '未知'}`);
      if ((project.requirementSummary as any).features) {
        console.log(`      功能数量: ${(project.requirementSummary as any).features.length}个`);
      }
    }
    console.log();

    // ========== Step 3: 批量创建AI Agents ==========
    console.log('🤖 Step 3: 创建AI Agents');
    console.log('-----------------------------------');

    const agents = await AgentService.createProjectAgents(project.id);
    console.log(`✅ 成功创建 ${agents.length} 个AI Agent:`);

    agents.forEach((agent, index) => {
      console.log(`   ${index + 1}. ${agent.name} (${agent.type})`);
      console.log(`      状态: ${agent.status}`);
      console.log(`      能力: ${(agent.capabilities as string[]).join(', ')}`);
    });
    console.log();

    // ========== Step 4: 创建示例任务 ==========
    console.log('📋 Step 4: 创建任务');
    console.log('-----------------------------------');

    // 为每个Agent创建一个示例任务
    const tasks = [];

    // UI Agent任务
    const uiAgent = agents.find(a => a.type === 'ui');
    if (uiAgent) {
      const uiTask = await TaskService.createTask({
        projectId: project.id,
        agentId: uiAgent.id,
        taskType: 'design_layout',
        description: '设计主页布局和导航结构',
        priority: 10,
        estimatedDuration: 30,
      });
      tasks.push(uiTask);
      console.log(`✅ 创建UI任务: ${uiTask.type}`);
    }

    // Backend Agent任务
    const backendAgent = agents.find(a => a.type === 'backend');
    if (backendAgent) {
      const backendTask = await TaskService.createTask({
        projectId: project.id,
        agentId: backendAgent.id,
        taskType: 'create_api',
        description: '创建用户认证API',
        priority: 9,
        estimatedDuration: 45,
      });
      tasks.push(backendTask);
      console.log(`✅ 创建Backend任务: ${backendTask.type}`);
    }

    // Database Agent任务
    const dbAgent = agents.find(a => a.type === 'database');
    if (dbAgent) {
      const dbTask = await TaskService.createTask({
        projectId: project.id,
        agentId: dbAgent.id,
        taskType: 'design_schema',
        description: '设计用户和课程数据表',
        priority: 10,
        estimatedDuration: 60,
      });
      tasks.push(dbTask);
      console.log(`✅ 创建Database任务: ${dbTask.type}`);
    }

    console.log(`\n📊 总计创建 ${tasks.length} 个任务`);
    console.log();

    // ========== Step 5: 模拟任务执行 ==========
    console.log('⚙️  Step 5: 模拟任务执行');
    console.log('-----------------------------------');

    for (const task of tasks.slice(0, 2)) { // 只演示前2个任务
      console.log(`\n🔄 执行任务: ${task.type}`);

      // 开始任务
      await TaskService.startTask(task.id);
      console.log('   ▶️  任务已开始');

      // 模拟进度更新
      await TaskService.updateTaskProgress(task.id, 30);
      console.log('   ⏳ 进度: 30%');

      await new Promise(resolve => setTimeout(resolve, 500));

      await TaskService.updateTaskProgress(task.id, 70);
      console.log('   ⏳ 进度: 70%');

      await new Promise(resolve => setTimeout(resolve, 500));

      // 完成任务
      await TaskService.completeTask(task.id, {
        success: true,
        output: `${task.type} 已完成`,
      }, {
        completedAt: new Date(),
        metrics: {
          duration: Math.random() * 60 + 30,
          quality: 95,
        },
      });
      console.log('   ✅ 任务完成');
    }
    console.log();

    // ========== Step 6: 获取项目统计 ==========
    console.log('📊 Step 6: 项目统计');
    console.log('-----------------------------------');

    const projectStats = await ProjectService.getProjectWithStats(project.id);
    if (projectStats && projectStats.stats) {
      console.log('✅ 项目统计信息:');
      console.log(`   总任务数: ${projectStats.stats.totalTasks}`);
      console.log(`   已完成任务: ${projectStats.stats.completedTasks}`);
      console.log(`   总Agents: ${projectStats.stats.totalAgents}`);
      console.log(`   活跃Agents: ${projectStats.stats.activeAgents}`);
      console.log(`   数据表数量: ${projectStats.stats.totalDataModels}`);
      console.log(`   API端点数量: ${projectStats.stats.totalApiEndpoints}`);
    }

    // 计算项目总体进度
    const progress = await TaskService.calculateProjectProgress(project.id);
    console.log(`   📈 项目进度: ${progress}%`);
    console.log();

    // ========== Step 7: Agent性能分析 ==========
    console.log('🎯 Step 7: Agent性能分析');
    console.log('-----------------------------------');

    for (const agent of agents.slice(0, 3)) {
      const performance = await AgentService.getAgentPerformance(agent.id);
      console.log(`\n🤖 ${agent.name}:`);
      console.log(`   任务总数: ${performance.taskStats.total}`);
      console.log(`   已完成: ${performance.taskStats.completed}`);
      console.log(`   失败: ${performance.taskStats.failed}`);
      console.log(`   成功率: ${performance.successRate.toFixed(1)}%`);
    }
    console.log();

    // ========== 演示完成 ==========
    console.log('=====================================');
    console.log('✨ MVP演示完成！');
    console.log('=====================================\n');

    console.log('📋 演示总结:');
    console.log(`   ✅ 用户注册/登录`);
    console.log(`   ✅ AI需求分析`);
    console.log(`   ✅ 自动创建 ${agents.length} 个专业Agent`);
    console.log(`   ✅ 任务创建和管理`);
    console.log(`   ✅ 任务执行追踪`);
    console.log(`   ✅ 项目统计分析`);
    console.log(`   ✅ Agent性能监控`);
    console.log();

    console.log('🎉 AI-Native平台核心功能验证成功！');

  } catch (error: any) {
    console.error('\n❌ 演示失败:', error.message);
    logger.error('MVP demo failed:', error);
    process.exit(1);
  }
}

// 运行演示
runMVPDemo().then(() => {
  console.log('\n👋 演示结束，正在退出...');
  process.exit(0);
});
