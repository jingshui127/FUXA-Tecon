const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

console.log('=== 添加导航按钮（包含SVG元素）===\n');

function generateUUID() {
    return crypto.randomUUID();
}

// 创建按钮的SVG元素
function createButtonSVG(btnId, btnText, x, y, width = 100, height = 32) {
    const svgRectId = 'svg_' + generateUUID().substring(0, 8);
    const foreignObjId = 'H-' + btnId.substring(0, 18) + '-' + generateUUID().substring(0, 8);
    const buttonId = 'B-' + btnId.substring(0, 18) + '-' + generateUUID().substring(0, 8);
    
    return ` <g stroke="rgba(0,0,0,0)" fill="rgba(0,0,0,0)" type="svg-ext-html_button" id="${btnId}">
   <rect id="${svgRectId}" height="${height}" width="${width}" y="${y}" x="${x}" stroke-width="0"/>
   <foreignObject id="${foreignObjId}" width="${width}" height="${height}" y="${y}" x="${x}">     
    <BUTTON style="width:calc(100% - 6px);height:calc(100% - 6px);text-align:center;background-color:#FFFFFF;color:#000000;font-size:14px;font-family:sans-serif;" class="md-btn  md-btn-raised" id="${buttonId}">${btnText}</BUTTON>
   </foreignObject>
  </g>`;
}

const db = new sqlite3.Database(DB_PATH);

db.all("SELECT rowid, value FROM views", async (err, rows) => {
    if (!rows || err) {
        console.log('Error:', err?.message);
        db.close();
        return;
    }
    
    // 构建视图映射
    const viewMap = {};
    rows.forEach(row => {
        try {
            const v = JSON.parse(row.value);
            viewMap[v.name] = { id: v.id, rowid: row.rowid };
        } catch (e) {}
    });
    
    console.log('视图列表:');
    Object.entries(viewMap).forEach(([name, info]) => {
        console.log(`  ${name} -> ${info.id}`);
    });
    
    // 导航配置
    const NAV_ITEMS = [
        { text: '开合模', targetName: '开合模参数' },
        { text: '斜率/PID', targetName: '斜率/PID' }
    ];
    
    const BTN_WIDTH = 100;
    const BTN_HEIGHT = 32;
    const BTN_Y = 592; // 与用户按钮相同的位置
    const START_X = 220; // 在用户按钮后面
    
    for (const row of rows) {
        let view;
        try { view = JSON.parse(row.value); } catch (e) { continue; }
        
        if (!view.items) view.items = {};
        
        console.log(`\n处理视图: ${view.name}`);
        console.log(`  svgcontent长度: ${view.svgcontent?.length || 0}`);
        
        let modified = false;
        let btnIndex = 0;
        
        for (const nav of NAV_ITEMS) {
            const target = viewMap[nav.targetName];
            if (!target || target.id === view.id) continue;
            
            // 检查items中是否已存在
            const existsInItems = Object.values(view.items).some(
                item => item.name === nav.text && item.type === 'svg-ext-html_button'
            );
            
            // 检查svgcontent中是否已存在
            const existsInSvg = view.svgcontent && view.svgcontent.includes(`>${nav.text}</BUTTON>`);
            
            if (existsInItems && existsInSvg) {
                console.log(`  ⏭️ "${nav.text}" 已存在`);
                btnIndex++;
                continue;
            }
            
            // 生成ID
            const btnId = 'HXB_' + generateUUID();
            const x = START_X + btnIndex * (BTN_WIDTH + 10);
            
            // 1. 添加到items
            view.items[btnId] = {
                id: btnId,
                type: 'svg-ext-html_button',
                name: nav.text,
                property: {
                    ranges: [{ min: 20, max: 80, color: '', type: 2, stroke: '' }],
                    events: [{
                        type: 'click',
                        action: 'onpage',
                        actparam: target.id,
                        actoptions: {}
                    }],
                    actions: []
                },
                label: 'HtmlButton',
                hide: false,
                lock: false
            };
            
            // 2. 添加到svgcontent
            if (!view.svgcontent) {
                console.log(`  ⚠️ 无svgcontent，跳过SVG添加`);
            } else {
                // 在</g></svg>之前插入按钮
                const svgEnd = view.svgcontent.lastIndexOf('</g>\n</svg>');
                if (svgEnd > -1) {
                    const btnSVG = createButtonSVG(btnId, nav.text, x, BTN_Y, BTN_WIDTH, BTN_HEIGHT);
                    view.svgcontent = view.svgcontent.substring(0, svgEnd) + 
                                      btnSVG + '\n' + 
                                      view.svgcontent.substring(svgEnd);
                    console.log(`  ✅ SVG已添加 "${nav.text}" at (${x}, ${BTN_Y})`);
                } else {
                    console.log(`  ⚠️ 找不到SVG结尾`);
                }
            }
            
            console.log(`  ✅ Items已添加 "${nav.text}" -> ${target.id}`);
            modified = true;
            btnIndex++;
        }
        
        // 保存到数据库
        if (modified) {
            await new Promise((resolve) => {
                db.run("UPDATE views SET value = ? WHERE rowid = ?",
                    [JSON.stringify(view), row.rowid],
                    () => resolve()
                );
            });
        }
    }
    
    // 验证
    console.log('\n=== 验证 ===\n');
    
    db.all("SELECT value FROM views", (err2, finalRows) => {
        finalRows.forEach(row => {
            const v = JSON.parse(row.value);
            const btnsInItems = Object.values(v.items || {}).filter(
                i => i.type === 'svg-ext-html_button'
            );
            const btnsInSvg = (v.svgcontent?.match(/type="svg-ext-html_button"/g) || []).length;
            
            console.log(`${v.name}:`);
            console.log(`  Items中按钮: ${btnsInItems.length}个`);
            console.log(`  SVG中按钮: ${btnsInSvg}个`);
            
            btnsInItems.forEach(b => 
                console.log(`    - ${b.name}: ${b.property.events?.[0]?.actparam}`)
            );
        });
        
        console.log('\n✅ 完成！');
        console.log('⚠️  请重启FUXA服务');
        
        db.close();
    });
});
