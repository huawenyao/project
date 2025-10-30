/**
 * WebSocket Load Testing Script
 *
 * 测试目标：验证1000+并发 WebSocket 连接
 *
 * 使用方法：
 * npx ts-node src/scripts/test-websocket-load.ts
 */

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.WS_URL || 'http://localhost:3001';
const TARGET_CONNECTIONS = parseInt(process.env.TARGET_CONNECTIONS || '1000', 10);
const RAMP_UP_TIME = parseInt(process.env.RAMP_UP_TIME || '10000', 10); // 10秒
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '60000', 10); // 60秒

interface ConnectionStats {
  total: number;
  connected: number;
  failed: number;
  disconnected: number;
  errors: string[];
}

class WebSocketLoadTester {
  private sockets: Socket[] = [];
  private stats: ConnectionStats = {
    total: 0,
    connected: 0,
    failed: 0,
    disconnected: 0,
    errors: [],
  };

  async runTest(): Promise<void> {
    console.log(`🚀 开始 WebSocket 负载测试`);
    console.log(`目标连接数: ${TARGET_CONNECTIONS}`);
    console.log(`爬坡时间: ${RAMP_UP_TIME}ms`);
    console.log(`测试持续时间: ${TEST_DURATION}ms`);
    console.log(`WebSocket URL: ${WS_URL}\n`);

    // 逐步建立连接
    await this.rampUp();

    // 持续测试
    await this.holdLoad();

    // 清理连接
    await this.cleanup();

    // 输出结果
    this.printResults();
  }

  private async rampUp(): Promise<void> {
    console.log(`📈 爬坡阶段: 建立 ${TARGET_CONNECTIONS} 个连接...`);
    const interval = RAMP_UP_TIME / TARGET_CONNECTIONS;

    for (let i = 0; i < TARGET_CONNECTIONS; i++) {
      this.createConnection(i);

      if (i % 100 === 0 && i > 0) {
        console.log(`  已创建 ${i} 个连接...`);
      }

      await this.sleep(interval);
    }

    // 等待所有连接完成
    await this.sleep(2000);
    console.log(`✅ 爬坡完成! 成功连接: ${this.stats.connected}/${TARGET_CONNECTIONS}\n`);
  }

  private createConnection(id: number): void {
    this.stats.total++;

    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: false, // 负载测试期间禁用自动重连
    });

    socket.on('connect', () => {
      this.stats.connected++;
    });

    socket.on('disconnect', (reason) => {
      this.stats.disconnected++;
      console.warn(`  连接 ${id} 断开: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      this.stats.failed++;
      this.stats.errors.push(`Connection ${id}: ${error.message}`);
    });

    this.sockets.push(socket);
  }

  private async holdLoad(): Promise<void> {
    console.log(`⏱️  维持负载阶段: ${TEST_DURATION}ms...`);

    const startTime = Date.now();
    const checkInterval = 5000; // 每5秒检查一次

    while (Date.now() - startTime < TEST_DURATION) {
      await this.sleep(checkInterval);
      console.log(`  当前状态 - 已连接: ${this.stats.connected}, 断开: ${this.stats.disconnected}, 失败: ${this.stats.failed}`);
    }

    console.log(`✅ 负载测试完成!\n`);
  }

  private async cleanup(): Promise<void> {
    console.log(`🧹 清理连接...`);

    for (const socket of this.sockets) {
      socket.disconnect();
    }

    await this.sleep(1000);
    console.log(`✅ 清理完成!\n`);
  }

  private printResults(): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 负载测试结果`);
    console.log(`${'='.repeat(60)}`);
    console.log(`总连接数:     ${this.stats.total}`);
    console.log(`成功连接:     ${this.stats.connected} (${((this.stats.connected / this.stats.total) * 100).toFixed(2)}%)`);
    console.log(`连接失败:     ${this.stats.failed} (${((this.stats.failed / this.stats.total) * 100).toFixed(2)}%)`);
    console.log(`连接断开:     ${this.stats.disconnected}`);

    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  错误列表 (前10条):`);
      this.stats.errors.slice(0, 10).forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    console.log(`${'='.repeat(60)}`);

    // 评估结果
    const successRate = (this.stats.connected / this.stats.total) * 100;
    if (successRate >= 95) {
      console.log(`\n✅ 测试通过! 成功率: ${successRate.toFixed(2)}%`);
      process.exit(0);
    } else {
      console.log(`\n❌ 测试失败! 成功率: ${successRate.toFixed(2)}% (低于95%)`);
      process.exit(1);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 运行测试
const tester = new WebSocketLoadTester();
tester.runTest().catch((error) => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
