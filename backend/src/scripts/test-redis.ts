import { testRedisConnection, closeRedisConnection, RedisCache } from '../config/redis';

async function testRedis() {
  console.log('🔍 测试Redis连接配置...\n');

  try {
    // 测试基本连接
    console.log('1️⃣ 测试基本连接...');
    const isConnected = await testRedisConnection();

    if (!isConnected) {
      console.error('❌ Redis连接测试失败');
      process.exit(1);
    }

    // 测试缓存操作
    console.log('\n2️⃣ 测试RedisCache辅助类...');

    // 测试字符串缓存
    const testKey = 'test:cache';
    const testValue = 'Hello Redis!';
    await RedisCache.set(testKey, testValue, 60);
    console.log('   ✅ SET操作成功');

    const retrievedValue = await RedisCache.get(testKey);
    console.log(`   ✅ GET操作成功: ${retrievedValue}`);

    // 测试JSON缓存
    const jsonKey = 'test:json';
    const jsonValue = { name: 'AI Builder', version: '1.0.0', timestamp: Date.now() };
    await RedisCache.setJSON(jsonKey, jsonValue, 60);
    console.log('   ✅ setJSON操作成功');

    const retrievedJSON = await RedisCache.getJSON(jsonKey);
    console.log(`   ✅ getJSON操作成功:`, retrievedJSON);

    // 测试exists
    const exists = await RedisCache.exists(testKey);
    console.log(`   ✅ exists操作成功: ${exists}`);

    // 测试TTL
    const ttl = await RedisCache.ttl(testKey);
    console.log(`   ✅ TTL操作成功: ${ttl}秒`);

    // 清理测试数据
    await RedisCache.del(testKey);
    await RedisCache.del(jsonKey);
    console.log('   ✅ 清理测试数据成功');

    console.log('\n🎉 所有Redis测试通过！');
    console.log('\n✅ T006任务完成：Redis连接池配置成功');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  } finally {
    await closeRedisConnection();
  }
}

testRedis();
