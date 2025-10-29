import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCoreTables() {
  try {
    console.log('🔍 验证核心数据库表...\n');

    // 查询所有表
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('✅ 发现的表:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));

    // 检查10个核心表
    const expectedTables = [
      'users',
      'projects',
      'agents',
      'tasks',
      'components',
      'data_models',
      'api_endpoints',
      'deployments',
      'versions',
      'build_logs'
    ];

    console.log('\n📊 核心表验证:');
    const tableNames = tables.map(t => t.table_name);
    let allPresent = true;

    for (const table of expectedTables) {
      const exists = tableNames.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) allPresent = false;
    }

    if (allPresent) {
      console.log('\n🎉 所有核心表已成功创建！');
      process.exit(0);
    } else {
      console.log('\n❌ 部分核心表缺失');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCoreTables();
