/**
 * 通过FUXA API添加导航按钮
 * 使用REST API确保数据被正确保存
 */

const http = require('http');
const https = require('https');

function apiRequest(method, path, data) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        const options = {
            hostname: '127.0.0.1',
            port: 1881,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData ? Buffer.byteLength(postData) : 0
            }
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (e) { resolve(body); }
            });
        });
        
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function main() {
    console.log('=== 通过API获取当前项目 ===\n');
    
    // 获取项目配置
    const project = await apiRequest('GET', '/api/project');
    
    if (!project || !project.hmi) {
        console.log('❌ 无法获取项目');
        return;
    }
    
    console.log(`项目: ${project.name}`);
    console.log(`视图数: ${project.hmi.views?.length || 0}`);
    
    // 显示视图列表
    project.hmi.views?.forEach((v, i) => {
        console.log(`${i+1}. ${v.name} (${v.id})`);
        console.log(`   items: ${Object.keys(v.items || {}).length}`);
    });
    
    // 导航按钮配置
    const NAV_ITEMS = [
        { text: '开合模', targetViewName: '开合模参数' },
        { text: '斜率/PID', targetViewName: '斜率/PID' }
    ];
    
    console.log('\n=== 准备添加导航按钮 ===\n');
    
    // 为每个视图添加导航按钮
    for (const view of project.hmi.views) {
        if (!view.items) view.items = {};
        
        console.log(`处理视图: ${view.name}`);
        
        // 找到目标视图的ID
        for (const nav of NAV_ITEMS) {
            const targetView = project.hmi.views.find(v => v.name === nav.targetViewName);
            if (!targetView || targetView.id === view.id) continue;
            
            // 检查是否已有同名按钮
            const hasBtn = Object.values(view.items).some(
                item => item.name === nav.text && item.type === 'svg-ext-html_button'
            );
            
            if (hasBtn) {
                console.log(`  ⏭️ "${nav.text}" 已存在`);
                continue;
            }
            
            // 创建按钮（完全复制用户的格式）
            const btnId = 'HXB_' + require('crypto').randomUUID();
            view.items[btnId] = {
                id: btnId,
                type: 'svg-ext-html_button',
                name: nav.text,
                property: {
                    ranges: [{ min: 20, max: 80, color: '', type: 2, stroke: '' }],
                    events: [{
                        type: 'click',
                        action: 'onpage',
                        actparam: targetView.id,
                        actoptions: {}
                    }],
                    actions: []
                },
                label: 'HtmlButton',
                hide: false,
                lock: false
            };
            
            console.log(`  ✅ 添加 "${nav.text}" -> ${nav.targetViewName} (${targetView.id})`);
        }
    }
    
    // 保存项目
    console.log('\n=== 保存项目 ===');
    const saveResult = await apiRequest('POST', '/api/project', project);
    console.log('保存结果:', saveResult ? '✅ 成功' : '❌ 失败');
}

main().catch(console.error);
