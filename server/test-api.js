const http = require('http');

// 测试不同的API端点
async function testAPI() {
    console.log('测试FUXA API...\n');
    
    // 1. 获取项目
    const getRes = await fetch('http://127.0.0.1:1881/api/project');
    const project = await getRes.json();
    
    console.log('GET /api/project:');
    console.log(`  status: ${getRes.status}`);
    console.log(`  views: ${project.hmi?.views?.length || 0}`);
    
    // 2. 尝试PUT保存
    console.log('\n尝试PUT /api/project...');
    try {
        const putRes = await fetch('http://127.0.0.1:1881/api/project', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        const putText = await putRes.text();
        console.log(`  status: ${putRes.status}`);
        console.log(`  response: ${putText.substring(0, 200)}`);
    } catch (e) {
        console.log(`  error: ${e.message}`);
    }
}

testAPI();
