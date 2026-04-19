/**
 * FUXA Speech Synthesis Test Script
 * Tests the speech synthesis module independently
 */

const speech = require('../server/runtime/alarms/speech');

console.log('========================================');
console.log('  FUXA Speech Synthesis Test');
console.log('========================================\n');

async function runTests() {
    try {
        console.log('[Test 1] Initializing speech synthesizer...');
        const initResult = await speech.init(console);
        console.log(`  Result: ${initResult ? 'SUCCESS' : 'FAILED'}\n`);

        if (!initResult) {
            console.log('Speech synthesis initialization failed. Please check system requirements.');
            return;
        }

        console.log('[Test 2] Getting available voices...');
        const voices = await speech.getAvailableVoices();
        console.log(`  Found ${voices.length} voices:`);
        voices.forEach(voice => {
            console.log(`    - ${voice.name} [${voice.cultureName}] (${voice.enabled ? 'Enabled' : 'Disabled'})`);
        });
        console.log();

        console.log('[Test 3] Testing basic speech synthesis...');
        console.log('  Speaking: "FUXA语音播报测试成功"');
        await speech.test('FUXA语音播报测试成功');
        console.log('  Result: SUCCESS\n');

        console.log('[Test 4] Testing speech with custom rate...');
        speech.setRate(2);
        console.log('  Speaking with rate 2: "语速测试"');
        await speech.speakAsync('语速测试', { rate: 2 });
        console.log('  Result: SUCCESS\n');

        console.log('[Test 5] Testing speech with custom volume...');
        speech.setVolume(50);
        console.log('  Speaking with volume 50: "音量测试"');
        await speech.speakAsync('音量测试', { volume: 50 });
        console.log('  Result: SUCCESS\n');

        console.log('[Test 6] Testing queue mechanism...');
        console.log('  Adding 3 messages to queue...');
        speech.speak('第一条消息');
        speech.speak('第二条消息');
        speech.speak('第三条消息');
        console.log(`  Queue length: ${speech.getQueueLength()}`);
        console.log('  Waiting for queue to process...');
        
        await new Promise(resolve => {
            speech.on('queueEmpty', resolve);
            setTimeout(resolve, 10000);
        });
        console.log('  Result: SUCCESS\n');

        console.log('[Test 7] Testing enable/disable...');
        speech.disable();
        console.log(`  Speech enabled: ${speech.enabled}`);
        speech.speak('这条消息不应该被播报');
        console.log(`  Queue length after disabled: ${speech.getQueueLength()}`);
        speech.enable();
        console.log(`  Speech enabled: ${speech.enabled}`);
        console.log('  Result: SUCCESS\n');

        console.log('[Test 8] Getting statistics...');
        const stats = speech.getStats();
        console.log('  Statistics:');
        console.log(`    - Total spoken: ${stats.totalSpoken}`);
        console.log(`    - Errors: ${stats.errors}`);
        console.log(`    - Queue overflows: ${stats.queueOverflows}`);
        console.log(`    - Current queue length: ${stats.queueLength}`);
        console.log(`    - Enabled: ${stats.enabled}`);
        console.log(`    - Rate: ${stats.rate}`);
        console.log(`    - Volume: ${stats.volume}`);
        console.log('  Result: SUCCESS\n');

        console.log('[Test 9] Testing alarm-like messages...');
        const alarmMessages = [
            '注意，温度传感器高高限报警',
            '温度传感器高高限报警已恢复',
            '注意，压力传感器高限报警',
            '压力传感器高限报警已恢复',
            '注意，液位传感器低限报警',
            '液位传感器低限报警已恢复'
        ];
        
        console.log('  Speaking alarm messages:');
        for (const msg of alarmMessages) {
            console.log(`    - ${msg}`);
            await speech.speakAsync(msg);
        }
        console.log('  Result: SUCCESS\n');

        console.log('========================================');
        console.log('  All tests completed successfully!');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n[ERROR] Test failed:', error.message);
        console.error(error.stack);
    }
}

runTests();
