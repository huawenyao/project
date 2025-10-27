/**
 * Database Creation Script
 *
 * 创建 ai-builder 数据库（如果不存在）
 */

import { Pool } from 'pg';
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
 * 解析数据库 URL
 */
function parseDatabaseUrl(url: string) {
  // postgresql://user:password@host:port/database
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
  };
}

/**
 * 主函数
 */
async function main() {
  console.log(colors.cyan('\n🚀 AI Builder Studio - 数据库创建工具'));
  console.log(colors.cyan('═'.repeat(60)));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log(colors.red('\n❌ DATABASE_URL 未配置'));
    process.exit(1);
  }

  const config = parseDatabaseUrl(databaseUrl);
  console.log(colors.yellow('\n📋 数据库配置:'));
  console.log(colors.blue(`   主机: ${config.host}:${config.port}`));
  console.log(colors.blue(`   用户: ${config.user}`));
  console.log(colors.blue(`   目标数据库: ${config.database}`));

  // 连接到默认的 postgres 数据库来创建新数据库
  const adminPool = new Pool({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: 'postgres', // 连接到默认数据库
  });

  try {
    console.log(colors.yellow('\n🔌 连接到 PostgreSQL 服务器...'));
    const client = await adminPool.connect();

    try {
      // 检查数据库是否已存在
      const checkResult = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [config.database]
      );

      if (checkResult.rows.length > 0) {
        console.log(colors.green(`\n✅ 数据库 "${config.database}" 已存在`));
      } else {
        console.log(colors.yellow(`\n⏳ 创建数据库 "${config.database}"...`));

        // 创建数据库
        await client.query(`CREATE DATABASE "${config.database}"`);

        console.log(colors.green(`✅ 数据库 "${config.database}" 创建成功`));
      }

      // 连接到新数据库验证
      const targetPool = new Pool({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        database: config.database,
      });

      const targetClient = await targetPool.connect();
      console.log(colors.green(`\n✅ 成功连接到数据库 "${config.database}"`));

      // 获取数据库信息
      const sizeResult = await targetClient.query(`
        SELECT pg_size_pretty(pg_database_size($1)) as size
      `, [config.database]);

      console.log(colors.blue(`   数据库大小: ${sizeResult.rows[0].size}`));

      targetClient.release();
      await targetPool.end();

      console.log(colors.green('\n✨ 数据库准备就绪！'));
      console.log(colors.cyan('   下一步: 运行 npm run migrate 执行数据库迁移\n'));

    } finally {
      client.release();
    }

    await adminPool.end();
    process.exit(0);

  } catch (error: any) {
    console.log(colors.red('\n💥 操作失败:'));
    console.log(colors.red(`   ${error.message}`));

    if (error.code === 'ECONNREFUSED') {
      console.log(colors.yellow('\n💡 提示:'));
      console.log(colors.yellow('   1. 请确认 PostgreSQL 服务器正在运行'));
      console.log(colors.yellow('   2. 检查主机地址和端口是否正确'));
      console.log(colors.yellow('   3. 确认防火墙允许连接'));
    } else if (error.code === '28P01') {
      console.log(colors.yellow('\n💡 提示:'));
      console.log(colors.yellow('   用户名或密码错误，请检查 .env 文件配置'));
    }

    await adminPool.end();
    process.exit(1);
  }
}

// 运行脚本
main();
