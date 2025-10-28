/**
 * Simple Test - 基础连接测试
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
config({ path: resolve(__dirname, '../../.env') });

import { sequelize, testConnection } from '../config/database';

async function main() {
  console.log('\n🧪 Simple Database Test\n');

  try {
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

    // 测试连接
    const connected = await testConnection();

    if (connected) {
      console.log('\n✅ Test passed!');
    } else {
      console.log('\n❌ Test failed!');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
