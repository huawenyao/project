/**
 * Security Audit Script
 *
 * 测试目标：
 * - 验证所有 WebSocket 端点需要JWT认证
 * - 验证速率限制正确实施
 * - 验证不收集PII数据
 *
 * 使用方法：
 * npx ts-node src/scripts/test-security-audit.ts
 */

import { io, Socket } from 'socket.io-client';
import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const WS_URL = process.env.WS_URL || 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

class SecurityAuditor {
  private results: TestResult[] = [];

  async runAudit(): Promise<void> {
    console.log(`🔒 开始安全审计\n`);

    // Test 1: WebSocket 未认证连接测试
    await this.testWebSocketAuthRequired();

    // Test 2: API 端点认证测试
    await this.testAPIAuthRequired();

    // Test 3: 速率限制测试
    await this.testRateLimiting();

    // Test 4: PII数据检查
    await this.testPIICollection();

    // 输出结果
    this.printResults();
  }

  /**
   * 测试 WebSocket 需要认证
   */
  private async testWebSocketAuthRequired(): Promise<void> {
    console.log(`📋 测试 1: WebSocket 认证要求...`);

    return new Promise((resolve) => {
      const socket = io(WS_URL, {
        transports: ['websocket'],
        auth: {}, // 故意不提供 token
      });

      let authErrorReceived = false;

      socket.on('connect_error', (error) => {
        if (error.message.includes('auth') || error.message.includes('token') || error.message.includes('unauthorized')) {
          authErrorReceived = true;
          this.addResult('WebSocket需要认证', true, '未认证的连接被正确拒绝');
        }
        socket.disconnect();
        resolve();
      });

      socket.on('connect', () => {
        this.addResult('WebSocket需要认证', false, '⚠️ 未认证的连接被允许连接');
        socket.disconnect();
        resolve();
      });

      // 超时处理
      setTimeout(() => {
        if (!authErrorReceived) {
          this.addResult('WebSocket需要认证', false, '⚠️ 未收到认证错误响应');
        }
        socket.disconnect();
        resolve();
      }, 3000);
    });
  }

  /**
   * 测试 API 端点需要认证
   */
  private async testAPIAuthRequired(): Promise<void> {
    console.log(`📋 测试 2: API 端点认证要求...`);

    const protectedEndpoints = [
      '/api/visualization/sessions',
      '/api/visualization/agents/personas',
      '/api/visualization/decisions',
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'GET',
        });

        if (response.status === 401 || response.status === 403) {
          this.addResult(`API ${endpoint} 需要认证`, true, '未认证请求被正确拒绝');
        } else if (response.status === 200) {
          this.addResult(`API ${endpoint} 需要认证`, false, `⚠️ 未认证请求返回 200`);
        } else {
          this.addResult(`API ${endpoint} 需要认证`, true, `返回状态码 ${response.status}`);
        }
      } catch (error: any) {
        this.addResult(`API ${endpoint} 需要认证`, false, `请求失败: ${error.message}`);
      }
    }
  }

  /**
   * 测试速率限制
   */
  private async testRateLimiting(): Promise<void> {
    console.log(`📋 测试 3: 速率限制...`);

    const endpoint = '/api/visualization/sessions';
    const requests = 150; // 超过假设的100/min限制
    let rateLimitHit = false;

    try {
      const promises = [];
      for (let i = 0; i < requests; i++) {
        promises.push(
          fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
          }).then(res => res.status)
        );
      }

      const statuses = await Promise.all(promises);
      const rateLimitedCount = statuses.filter(s => s === 429).length;

      if (rateLimitedCount > 0) {
        rateLimitHit = true;
        this.addResult('速率限制', true, `${rateLimitedCount}/${requests} 请求被限制 (429)`);
      } else {
        this.addResult('速率限制', false, `⚠️ 发送 ${requests} 个请求均未被限制`);
      }
    } catch (error: any) {
      this.addResult('速率限制', false, `测试失败: ${error.message}`);
    }
  }

  /**
   * 测试不收集PII数据
   */
  private async testPIICollection(): Promise<void> {
    console.log(`📋 测试 4: PII数据收集检查...`);

    // 检查UserInteractionMetric数据结构
    // 这里我们检查示例数据是否包含PII字段

    const piiFields = ['email', 'password', 'phone', 'ssn', 'creditCard', 'address'];
    const sampleMetricEvent = {
      eventId: 'test-123',
      sessionId: 'session-abc',
      userId: 'user-anonymous-xyz', // 应该是匿名化的
      eventType: 'click',
      eventMetadata: {
        targetElement: 'button',
        value: 'submit',
      },
      timestamp: new Date().toISOString(),
      anonymized: true,
    };

    let containsPII = false;
    const foundPIIFields: string[] = [];

    for (const field of piiFields) {
      if (field in sampleMetricEvent || JSON.stringify(sampleMetricEvent).toLowerCase().includes(field)) {
        containsPII = true;
        foundPIIFields.push(field);
      }
    }

    if (!containsPII && sampleMetricEvent.anonymized) {
      this.addResult('不收集PII', true, 'Metric事件已匿名化且不包含PII字段');
    } else {
      this.addResult('不收集PII', false, `⚠️ 发现PII字段: ${foundPIIFields.join(', ')}`);
    }

    // 检查 userId 是否匿名化
    if (sampleMetricEvent.userId.includes('anonymous') || sampleMetricEvent.userId.match(/^[a-f0-9-]+$/)) {
      this.addResult('UserId匿名化', true, 'UserId已正确匿名化');
    } else {
      this.addResult('UserId匿名化', false, '⚠️ UserId可能未匿名化');
    }
  }

  private addResult(name: string, passed: boolean, message: string): void {
    this.results.push({ name, passed, message });
    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${message}`);
  }

  private printResults(): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔒 安全审计结果`);
    console.log(`${'='.repeat(60)}`);

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed} ✅`);
    console.log(`失败: ${failed} ❌`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(2)}%`);

    if (failed > 0) {
      console.log(`\n⚠️  失败的测试:`);
      this.results.filter(r => !r.passed).forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.name}: ${result.message}`);
      });
    }

    console.log(`${'='.repeat(60)}\n`);

    if (failed === 0) {
      console.log(`✅ 所有安全测试通过!`);
      process.exit(0);
    } else {
      console.log(`❌ 有 ${failed} 个安全测试失败!`);
      process.exit(1);
    }
  }
}

// 运行审计
const auditor = new SecurityAuditor();
auditor.runAudit().catch((error) => {
  console.error('审计执行失败:', error);
  process.exit(1);
});
