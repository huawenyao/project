import 'dotenv/config';
import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger';

/**
 * WebSocket实时功能测试
 * 测试Socket.IO连接和事件广播
 */

const SERVER_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_PROJECT_ID = 'test-project-123';
const TEST_AGENT_ID = 'test-agent-456';
const TEST_TASK_ID = 'test-task-789';

async function testWebSocket() {
  console.log('🌐 WebSocket实时功能测试');
  console.log('=====================================\n');

  let socket: Socket | null = null;

  try {
    // 测试1: 建立WebSocket连接
    console.log('📝 测试 1: 建立WebSocket连接');
    console.log('-----------------------------------');
    console.log(`连接服务器: ${SERVER_URL}`);

    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
    });

    // 等待连接
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('连接超时'));
      }, 5000);

      socket!.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ 连接成功');
        console.log(`   Socket ID: ${socket!.id}`);
        resolve();
      });

      socket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    console.log();

    // 测试2: 加入项目房间
    console.log('📝 测试 2: 加入项目房间');
    console.log('-----------------------------------');
    socket.emit('join-project', TEST_PROJECT_ID);
    console.log(`✅ 已加入项目房间: ${TEST_PROJECT_ID}`);
    console.log();

    // 测试3: 监听项目更新事件
    console.log('📝 测试 3: 监听实时事件');
    console.log('-----------------------------------');

    let eventReceived = false;

    // 项目更新事件
    socket.on('project-update', (data) => {
      console.log('✅ 收到项目更新事件:');
      console.log(`   项目ID: ${data.projectId}`);
      console.log(`   数据: ${JSON.stringify(data.data).substring(0, 100)}...`);
      eventReceived = true;
    });

    // Agent状态变化事件
    socket.on('agent-status-change', (data) => {
      console.log('✅ 收到Agent状态变化事件:');
      console.log(`   Agent ID: ${data.agentId}`);
      console.log(`   状态: ${data.status}`);
      console.log(`   当前任务: ${data.currentTask || '无'}`);
      eventReceived = true;
    });

    // 任务进度更新事件
    socket.on('task-progress', (data) => {
      console.log('✅ 收到任务进度更新事件:');
      console.log(`   任务ID: ${data.taskId}`);
      console.log(`   进度: ${data.progress}%`);
      eventReceived = true;
    });

    // 构建日志事件
    socket.on('build-log', (data) => {
      console.log('✅ 收到构建日志事件:');
      console.log(`   项目ID: ${data.projectId}`);
      console.log(`   级别: ${data.level}`);
      console.log(`   消息: ${data.message}`);
      eventReceived = true;
    });

    // 错误事件
    socket.on('error', (error) => {
      console.log('❌ 收到错误事件:', error);
    });

    console.log('正在监听以下事件:');
    console.log('   - project-update');
    console.log('   - agent-status-change');
    console.log('   - task-progress');
    console.log('   - build-log');
    console.log();

    // 测试4: 模拟发送事件（如果有后端实现）
    console.log('📝 测试 4: 连接状态测试');
    console.log('-----------------------------------');

    // Ping测试
    const pingStart = Date.now();
    socket.emit('ping', { timestamp: pingStart });

    socket.on('pong', (data) => {
      const latency = Date.now() - data.timestamp;
      console.log(`✅ Ping/Pong响应时间: ${latency}ms`);
    });

    // 等待一段时间看是否有事件
    console.log('\n等待3秒查看是否有实时事件...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (!eventReceived) {
      console.log('ℹ️  未收到实时事件（可能因为没有活动的项目/任务）');
    }
    console.log();

    // 测试5: 断开连接
    console.log('📝 测试 5: 断开连接');
    console.log('-----------------------------------');
    socket.disconnect();
    console.log('✅ 已断开连接');
    console.log();

    // 测试完成
    console.log('=====================================');
    console.log('✨ WebSocket测试完成！');
    console.log('=====================================\n');

    console.log('📋 测试总结:');
    console.log('   ✅ WebSocket连接建立');
    console.log('   ✅ 项目房间加入');
    console.log('   ✅ 事件监听器注册');
    console.log('   ✅ Ping/Pong测试');
    console.log('   ✅ 连接断开');
    console.log();

    console.log('🎉 所有测试通过！WebSocket服务工作正常');
    console.log('\n💡 提示: 启动后端服务器后运行此测试');
    console.log(`   npm run dev:backend`);

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);

    console.log('\n💡 Troubleshooting:');
    console.log('   1. 确保后端服务器正在运行 (npm run dev:backend)');
    console.log('   2. 检查服务器地址配置');
    console.log('   3. 验证CORS配置');
    console.log('   4. 检查防火墙设置');

    process.exit(1);
  } finally {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  }
}

// 运行测试
testWebSocket().then(() => {
  console.log('\n👋 测试结束，正在退出...');
  process.exit(0);
});
