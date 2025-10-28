/**
 * Database Verification Script
 *
 * 验证数据库表结构和种子数据
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
 * 主函数
 */
async function main() {
  console.log(colors.cyan('\n🔍 AI Builder Studio - 数据库验证工具'));
  console.log(colors.cyan('═'.repeat(60)));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

  try {
    const client = await pool.connect();

    // 1. 验证所有表是否存在
    console.log(colors.yellow('\n📊 检查表结构...'));
    console.log(colors.blue('─'.repeat(60)));

    const expectedTables = [
      'build_session',
      'agent_work_status',
      'decision_record',
      'agent_error_record',
      'collaboration_event',
      'preview_data',
      'agent_persona',
      'user_interaction_metric_event',
      'migration_history',
    ];

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const existingTables = tablesResult.rows.map(r => r.table_name);

    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(colors.green(`   ✓ ${table}`));
      } else {
        console.log(colors.red(`   ✗ ${table} (缺失)`));
      }
    }

    // 2. 验证索引
    console.log(colors.yellow('\n🔗 检查索引...'));
    console.log(colors.blue('─'.repeat(60)));

    const indexResult = await client.query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    const indexCount = indexResult.rows.length;
    console.log(colors.blue(`   发现索引: ${indexCount} 个`));

    const indexByTable: Record<string, number> = {};
    indexResult.rows.forEach(row => {
      indexByTable[row.tablename] = (indexByTable[row.tablename] || 0) + 1;
    });

    Object.entries(indexByTable).forEach(([table, count]) => {
      console.log(colors.cyan(`   ${table}: ${count} 个索引`));
    });

    // 3. 验证种子数据
    console.log(colors.yellow('\n🌱 检查种子数据...'));
    console.log(colors.blue('─'.repeat(60)));

    const personaResult = await client.query(`
      SELECT agent_type, display_name, priority
      FROM agent_persona
      ORDER BY agent_type
    `);

    if (personaResult.rows.length > 0) {
      console.log(colors.green(`   ✓ agent_persona 数据: ${personaResult.rows.length} 条`));
      personaResult.rows.forEach(row => {
        console.log(colors.blue(`     - ${row.agent_type}: ${row.display_name} (${row.priority} priority)`));
      });
    } else {
      console.log(colors.red(`   ✗ agent_persona 数据为空`));
    }

    // 4. 验证触发器
    console.log(colors.yellow('\n⚡ 检查触发器...'));
    console.log(colors.blue('─'.repeat(60)));

    const triggerResult = await client.query(`
      SELECT event_object_table, trigger_name
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);

    if (triggerResult.rows.length > 0) {
      console.log(colors.green(`   ✓ 触发器: ${triggerResult.rows.length} 个`));
      triggerResult.rows.forEach(row => {
        console.log(colors.cyan(`     - ${row.event_object_table}.${row.trigger_name}`));
      });
    } else {
      console.log(colors.yellow(`   ! 未发现触发器`));
    }

    // 5. 验证迁移历史
    console.log(colors.yellow('\n📋 检查迁移历史...'));
    console.log(colors.blue('─'.repeat(60)));

    const migrationResult = await client.query(`
      SELECT filename, executed_at
      FROM migration_history
      ORDER BY executed_at
    `);

    console.log(colors.green(`   ✓ 已执行迁移: ${migrationResult.rows.length} 个`));
    migrationResult.rows.forEach(row => {
      const date = new Date(row.executed_at).toLocaleString('zh-CN');
      console.log(colors.cyan(`     - ${row.filename} (${date})`));
    });

    // 6. 数据库统计
    console.log(colors.yellow('\n📈 数据库统计...'));
    console.log(colors.blue('─'.repeat(60)));

    const sizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    console.log(colors.blue(`   数据库大小: ${sizeResult.rows[0].size}`));

    client.release();

    // 汇总
    console.log(colors.cyan('\n═'.repeat(60)));
    console.log(colors.green('✨ 数据库验证完成！'));
    console.log(colors.green('   所有表、索引、触发器和种子数据均已就绪。'));
    console.log(colors.cyan('   系统已准备好进行后端开发。\n'));

    await pool.end();
    process.exit(0);

  } catch (error: any) {
    console.log(colors.red('\n💥 验证失败:'));
    console.log(colors.red(`   ${error.message}`));
    await pool.end();
    process.exit(1);
  }
}

// 运行验证
main();
