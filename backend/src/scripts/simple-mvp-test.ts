import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * 简化的MVP测试脚本
 * 直接使用Prisma Client验证核心数据库操作
 */

const prisma = new PrismaClient();

async function runSimpleMVPTest() {
  console.log('🚀 AI-Native Platform 简化MVP测试');
  console.log('=====================================\n');

  try {
    // ========== Step 1: 创建测试用户 ==========
    console.log('📝 Step 1: 创建测试用户');
    console.log('-----------------------------------');

    const passwordHash = await bcrypt.hash('Test123456', 10);

    // 删除旧的测试用户（如果存在）
    await prisma.user.deleteMany({
      where: { email: 'mvp-test@example.com' }
    });

    const user = await prisma.user.create({
      data: {
        username: 'mvp_test_user',
        email: 'mvp-test@example.com',
        passwordHash,
        fullName: 'MVP Test User',
      }
    });

    console.log('✅ 用户创建成功');
    console.log(`   用户ID: ${user.id}`);
    console.log(`   用户名: ${user.username}`);
    console.log(`   邮箱: ${user.email}`);
    console.log();

    // ========== Step 2: 创建测试项目 ==========
    console.log('🎯 Step 2: 创建测试项目');
    console.log('-----------------------------------');

    const requirementText = `
创建一个在线教育平台：
1. 用户注册和登录
2. 课程浏览和搜索
3. 视频播放功能
4. 在线测验系统
5. 学习进度跟踪
    `.trim();

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: 'MVP测试-在线教育平台',
        description: '一个功能完整的在线教育平台',
        requirementText,
        requirementSummary: {
          appType: 'web_application',
          complexity: 'medium',
          features: ['authentication', 'course_management', 'video_player', 'quiz_system', 'progress_tracking'],
          techStack: { frontend: 'React', backend: 'Node.js', database: 'PostgreSQL' }
        },
        status: 'draft',
      }
    });

    console.log('✅ 项目创建成功');
    console.log(`   项目ID: ${project.id}`);
    console.log(`   项目名称: ${project.name}`);
    console.log(`   状态: ${project.status}`);
    console.log();

    // ========== Step 3: 创建AI Agents ==========
    console.log('🤖 Step 3: 创建AI Agents');
    console.log('-----------------------------------');

    const agentTypes = [
      { type: 'ui', name: 'UI Design Agent', capabilities: ['component_selection', 'layout_design', 'styling'] },
      { type: 'backend', name: 'Backend Agent', capabilities: ['api_design', 'business_logic', 'authentication'] },
      { type: 'database', name: 'Database Agent', capabilities: ['schema_design', 'migration', 'optimization'] },
    ];

    const agents = [];
    for (const agentType of agentTypes) {
      const agent = await prisma.agent.create({
        data: {
          type: agentType.type,
          name: agentType.name,
          description: `${agentType.name} for project automation`,
          capabilities: agentType.capabilities,
          status: 'idle',
        }
      });
      agents.push(agent);
      console.log(`✅ 创建Agent: ${agent.name} (${agent.type})`);
    }
    console.log(`\n📊 总计创建 ${agents.length} 个AI Agent`);
    console.log();

    // ========== Step 4: 创建任务 ==========
    console.log('📋 Step 4: 创建任务');
    console.log('-----------------------------------');

    const tasks = [];
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          agentId: agent.id,
          type: `${agent.type}_task_${i + 1}`,
          input: {
            description: `为${agent.name}创建的测试任务`,
            priority: 10 - i,
          },
          status: 'pending',
          dependencies: [],
          priority: 10 - i,
        }
      });
      tasks.push(task);
      console.log(`✅ 创建任务: ${task.type} (Agent: ${agent.name})`);
    }
    console.log(`\n📊 总计创建 ${tasks.length} 个任务`);
    console.log();

    // ========== Step 5: 模拟任务执行 ==========
    console.log('⚙️  Step 5: 模拟任务执行');
    console.log('-----------------------------------');

    const task = tasks[0];
    console.log(`\n🔄 执行任务: ${task.type}`);

    // 开始任务
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'running',
        startedAt: new Date(),
      }
    });
    console.log('   ▶️  任务已开始');

    await new Promise(resolve => setTimeout(resolve, 500));

    // 完成任务
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'completed',
        output: { result: 'Task completed successfully', success: true },
        completedAt: new Date(),
        executionTimeMs: 1250,
      }
    });
    console.log('   ✅ 任务完成');
    console.log();

    // ========== Step 6: 项目统计 ==========
    console.log('📊 Step 6: 项目统计');
    console.log('-----------------------------------');

    const totalTasks = await prisma.task.count({ where: { projectId: project.id } });
    const completedTasks = await prisma.task.count({
      where: { projectId: project.id, status: 'completed' }
    });
    const pendingTasks = await prisma.task.count({
      where: { projectId: project.id, status: 'pending' }
    });

    console.log('✅ 项目统计信息:');
    console.log(`   总任务数: ${totalTasks}`);
    console.log(`   已完成任务: ${completedTasks}`);
    console.log(`   待处理任务: ${pendingTasks}`);
    console.log(`   项目进度: ${Math.round((completedTasks / totalTasks) * 100)}%`);
    console.log();

    // ========== 演示完成 ==========
    console.log('=====================================');
    console.log('✨ MVP测试完成！');
    console.log('=====================================\n');

    console.log('📋 测试总结:');
    console.log(`   ✅ 用户创建和管理`);
    console.log(`   ✅ 项目创建（含需求分析数据）`);
    console.log(`   ✅ AI Agents创建（${agents.length}个专业Agent）`);
    console.log(`   ✅ 任务创建和管理（${tasks.length}个任务）`);
    console.log(`   ✅ 任务状态转换（pending → running → completed）`);
    console.log(`   ✅ 项目统计和进度计算`);
    console.log();

    console.log('🎉 核心功能验证成功！');
    console.log('\n💡 下一步:');
    console.log('   1. 启动后端服务器: npm run dev:backend');
    console.log('   2. 测试REST API端点');
    console.log('   3. 集成前端界面');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
runSimpleMVPTest().then(() => {
  console.log('\n👋 测试结束，正在退出...');
  process.exit(0);
});
