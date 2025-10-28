/**
 * Database Connection Test Script
 *
 * 测试 PostgreSQL 和 Redis 连接
 */

import { Pool } from 'pg';
import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 颜色输出
const colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
};

/**
 * 测试 PostgreSQL 连接
 */
async function testPostgreSQL(): Promise<boolean> {
  console.log(colors.yellow('\n🔍 测试 PostgreSQL 连接...'));
  console.log(colors.blue('─'.repeat(60)));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log(colors.red('❌ DATABASE_URL 未配置'));
    return false;
  }

  console.log(colors.cyan(`   连接地址: ${databaseUrl.replace(/:[^:]*@/, ':****@')}`));

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();

    // 测试基本查询
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version.split(',')[0];

    const dbNameResult = await client.query('SELECT current_database()');
    const dbName = dbNameResult.rows[0].current_database;

    const userResult = await client.query('SELECT current_user');
    const user = userResult.rows[0].current_user;

    console.log(colors.green('✅ PostgreSQL 连接成功'));
    console.log(colors.blue(`   版本: ${version}`));
    console.log(colors.blue(`   数据库: ${dbName}`));
    console.log(colors.blue(`   用户: ${user}`));

    // 测试表查询权限
    const tablesResult = await client.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log(colors.blue(`   public schema 表数量: ${tablesResult.rows[0].table_count}`));

    client.release();
    await pool.end();

    return true;
  } catch (error: any) {
    console.log(colors.red('❌ PostgreSQL 连接失败'));
    console.log(colors.red(`   错误: ${error.message}`));
    await pool.end();
    return false;
  }
}

/**
 * 测试 Redis 连接
 */
async function testRedis(): Promise<boolean> {
  console.log(colors.yellow('\n🔍 测试 Redis 连接...'));
  console.log(colors.blue('─'.repeat(60)));

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log(colors.red('❌ REDIS_URL 未配置'));
    return false;
  }

  console.log(colors.cyan(`   连接地址: ${redisUrl}`));

  const client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
    },
  });

  client.on('error', (err) => {
    console.log(colors.red(`   Redis 错误: ${err.message}`));
  });

  try {
    await client.connect();

    // 测试基本操作
    const testKey = 'test:connection:' + Date.now();
    await client.set(testKey, 'test-value', { EX: 10 });
    const value = await client.get(testKey);
    await client.del(testKey);

    // 获取 Redis 信息
    const info = await client.info('server');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';

    console.log(colors.green('✅ Redis 连接成功'));
    console.log(colors.blue(`   版本: ${version}`));
    console.log(colors.blue(`   读写测试: 通过`));

    await client.quit();
    return true;
  } catch (error: any) {
    console.log(colors.red('❌ Redis 连接失败'));
    console.log(colors.red(`   错误: ${error.message}`));
    try {
      await client.quit();
    } catch {}
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(colors.cyan('\n🚀 AI Builder Studio - 数据库连接测试'));
  console.log(colors.cyan('═'.repeat(60)));

  const results: boolean[] = [];

  // 测试 PostgreSQL
  results.push(await testPostgreSQL());

  // 测试 Redis
  results.push(await testRedis());

  // 汇总结果
  console.log(colors.cyan('\n═'.repeat(60)));
  console.log(colors.yellow('📊 测试结果汇总:'));
  console.log(colors.blue('─'.repeat(60)));

  const allPassed = results.every(r => r);

  if (allPassed) {
    console.log(colors.green('✨ 所有连接测试通过！'));
    console.log(colors.green('   系统已准备就绪，可以运行迁移和启动服务。\n'));
    process.exit(0);
  } else {
    console.log(colors.red('💥 部分连接测试失败'));
    console.log(colors.yellow('   请检查以下配置:'));
    console.log(colors.yellow('   1. .env 文件中的数据库连接信息'));
    console.log(colors.yellow('   2. 数据库服务器是否可访问'));
    console.log(colors.yellow('   3. 用户名和密码是否正确\n'));
    process.exit(1);
  }
}

// 运行测试
main();
