/**
 * Test Alarm Speech Trigger
 * 模拟报警触发语音播报测试
 */

const speech = require('../server/runtime/alarms/speech');

async function testAlarmSpeech() {
    console.log('========================================');
    console.log('  报警语音播报测试');
    console.log('========================================\n');

    console.log('[初始化] 正在初始化语音模块...');
    await speech.init(console);
    console.log('[初始化] 完成\n');

    console.log('[测试 1] 模拟高限报警触发...');
    speech.speak('注意，温度传感器高限报警', { priority: 'normal' });
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    console.log('[测试 2] 模拟高高限报警触发（高优先级）...');
    speech.speak('注意，压力传感器高高限报警', { priority: 'high' });
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    console.log('[测试 3] 模拟报警恢复...');
    speech.speak('温度传感器高限报警已恢复', { priority: 'normal' });
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    console.log('\n========================================');
    console.log('  测试完成！');
    console.log('========================================');
    
    const stats = speech.getStats();
    console.log('\n播报统计:');
    console.log(`  总播报次数: ${stats.totalSpoken}`);
    console.log(`  错误次数: ${stats.errors}`);
}

testAlarmSpeech().catch(console.error);
