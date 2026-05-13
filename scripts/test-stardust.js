/**
 * Test Stardust APM Integration
 */

const stardust = require('../server/runtime/stardust');

async function testStardust() {
    console.log('========================================');
    console.log('  Stardust APM 集成测试');
    console.log('========================================\n');

    const tracer = stardust.createTracer(
        'http://47.113.219.65:6600',
        'FUXA-Test',
        ''
    );

    console.log('[1] 启动追踪器...');
    tracer.start();
    console.log('    完成\n');

    console.log('[2] 测试 HTTP 请求追踪...');
    const httpSpan = tracer.newSpan('HTTP GET /api/test');
    httpSpan.setTag('method=GET, path=/api/test, status=200');
    await new Promise(resolve => setTimeout(resolve, 100));
    httpSpan.finish();
    console.log('    完成\n');

    console.log('[3] 测试设备读取追踪...');
    const readSpan = tracer.newSpan('Device.Read');
    readSpan.setTag('deviceId=test-device, tagId=test-tag');
    await new Promise(resolve => setTimeout(resolve, 50));
    readSpan.finish();
    console.log('    完成\n');

    console.log('[4] 测试设备写入追踪...');
    const writeSpan = tracer.newSpan('Device.Write');
    writeSpan.setTag('deviceId=test-device, tagId=test-tag');
    await new Promise(resolve => setTimeout(resolve, 30));
    writeSpan.finish();
    console.log('    完成\n');

    console.log('[5] 测试报警追踪...');
    const alarmSpan = tracer.newSpan('Alarm:Trigger');
    alarmSpan.setTag('name=温度报警, type=高限, priority=high');
    alarmSpan.finish();
    console.log('    完成\n');

    console.log('[6] 测试错误追踪...');
    const errorSpan = tracer.newSpan('Device.Read');
    errorSpan.setTag('deviceId=error-device, tagId=error-tag');
    errorSpan.setError(new Error('连接超时'));
    errorSpan.finish();
    console.log('    完成\n');

    console.log('[7] 等待数据上报 (60秒自动)...');
    console.log('    数据将自动上报到星尘服务器\n');

    console.log('[8] 等待自动上报 (60秒)...');
    console.log('    数据将自动上报到星尘服务器\n');

    console.log('========================================');
    console.log('  测试完成！');
    console.log('========================================');
    console.log('\n请访问星尘服务器查看监控数据:');
    console.log('http://47.113.219.65:6600');

    setTimeout(() => {
        tracer.stop();
        console.log('\n[Stardust] 追踪器已停止');
    }, 5000);
}

testStardust().catch(console.error);
