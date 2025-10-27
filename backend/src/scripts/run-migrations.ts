/**
 * Database Migration Script
 *
 * 执行 src/migrations/ 目录下的所有 SQL 迁移文件
 * 按照文件名顺序依次执行（001, 002, 003...）
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 数据库连接配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

// 迁移文件目录
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

// 颜色输出工具
const colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
};

/**
 * 获取所有迁移文件，按文件名排序
 */
function getMigrationFiles(): string[] {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  return files;
}

/**
 * 执行单个迁移文件
 */
async function executeMigration(filename: string): Promise<void> {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  console.log(colors.cyan(`\n📄 执行迁移: ${filename}`));
  console.log(colors.blue('─'.repeat(60)));

  try {
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log(colors.green(`✅ 成功: ${filename}`));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(colors.red(`❌ 失败: ${filename}`));
    throw error;
  }
}

/**
 * 创建迁移历史表（如果不存在）
 */
async function ensureMigrationTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(colors.green('✅ 迁移历史表已准备就绪'));
  } finally {
    client.release();
  }
}

/**
 * 获取已执行的迁移
 */
async function getExecutedMigrations(): Promise<Set<string>> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT filename FROM migration_history ORDER BY executed_at'
    );
    return new Set(result.rows.map(row => row.filename));
  } finally {
    client.release();
  }
}

/**
 * 记录迁移执行
 */
async function recordMigration(filename: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO migration_history (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
      [filename]
    );
  } finally {
    client.release();
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(colors.cyan('\n🚀 AI Builder Studio - 数据库迁移工具'));
  console.log(colors.cyan('═'.repeat(60)));

  try {
    // 测试数据库连接
    console.log(colors.yellow('\n🔌 测试数据库连接...'));
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log(colors.green(`✅ 连接成功: ${process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@')}`));
    console.log(colors.blue(`   PostgreSQL 版本: ${result.rows[0].version.split(',')[0]}`));
    client.release();

    // 确保迁移历史表存在
    console.log(colors.yellow('\n📋 准备迁移历史表...'));
    await ensureMigrationTable();

    // 获取已执行的迁移
    const executedMigrations = await getExecutedMigrations();
    console.log(colors.blue(`   已执行迁移: ${executedMigrations.size} 个`));

    // 获取所有迁移文件
    const migrationFiles = getMigrationFiles();
    console.log(colors.blue(`   发现迁移文件: ${migrationFiles.length} 个`));

    // 过滤出未执行的迁移
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.has(file)
    );

    if (pendingMigrations.length === 0) {
      console.log(colors.green('\n✨ 所有迁移已是最新状态！'));
      return;
    }

    console.log(colors.yellow(`\n⏳ 待执行迁移: ${pendingMigrations.length} 个`));
    pendingMigrations.forEach((file, index) => {
      console.log(colors.cyan(`   ${index + 1}. ${file}`));
    });

    // 执行迁移
    console.log(colors.yellow('\n🔨 开始执行迁移...\n'));

    for (const filename of pendingMigrations) {
      await executeMigration(filename);
      await recordMigration(filename);
    }

    console.log(colors.green('\n✨ 所有迁移执行成功！'));
    console.log(colors.cyan('═'.repeat(60)));

  } catch (error) {
    console.error(colors.red('\n💥 迁移失败:'));
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 运行迁移
main();
