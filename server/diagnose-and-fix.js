/**
 * diagnose-and-fix.js - 诊断并修复所有问题
 *
 * 问题分析:
 * 1. Header需要showNavigation=true才能显示
 * 2. Label类型的text不会自动替换变量值
 * 3. 视图中的按钮可能没有正确渲染
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

async function fetchAPI(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('\n========================================');
    console.log('  诊断并修复 FUXA 配置问题');
    console.log('========================================\n');

    // 1. 获取API返回的实际配置
    console.log('【步骤1】获取API配置...\n');
    let project;
    try {
        project = await fetchAPI('http://127.0.0.1:1881/api/project');
        const hmi = project.hmi?.layout;
        
        console.log('navigation.mode:', hmi?.navigation?.mode);
        console.log('navigation.type:', hmi?.navigation?.type);
        console.log('header.items数量:', hmi?.header?.items?.length);
        
        // 检查header items的text内容
        if (hmi?.header?.items) {
            console.log('\nHeader Items文本:');
            hmi.header.items.slice(0, 5).forEach((item, i) => {
                console.log(`  ${i+1}. [${item.type}] text="${item.text}" var=${item.property?.variableId || '-'}`);
            });
        }
    } catch (e) {
        console.error('API错误:', e.message);
    }

    // 2. 修复数据库配置
    console.log('\n【步骤2】修复配置...\n');
    
    const db = new sqlite3.Database(DB_PATH, async (err) => {
        if (err) {
            console.error('DB错误:', err.message);
            return;
        }

        db.get("SELECT value FROM general WHERE name = 'layout'", async (err, row) => {
            if (err || !row) {
                console.error('读取失败');
                db.close();
                return;
            }

            let layout = JSON.parse(row.value);

            // 修复1: 确保navigation模式正确（非void）
            if (!layout.navigation || layout.navigation.mode === 'item.navsmode-none') {
                layout.navigation = {
                    mode: 'item.navsmode-over',
                    type: 'item.navtype-icons-text-block',
                    bkcolor: '#f0f0f0',
                    fgcolor: '#1d1d1d',
                    logo: false,
                    items: [
                        { id: 'nav_home', text: '主页', link: '', view: 'v_home_main', icon: 'home', image: '' },
                        { id: 'nav_mold', text: '开合模', link: '', view: 'v_mold_param', icon: 'maximize', image: '' },
                        { id: 'nav_pid', text: '斜率/PID', link: '', view: 'v_pid_param', icon: 'trending-up', image: '' },
                        { id: 'nav_alarm', text: '报警', link: '', view: 'v_alarm_main', icon: 'alert-circle', image: '' },
                        { id: 'nav_history', text: '趋势', link: '', view: 'v_history_main', icon: 'clock', image: '' }
                    ]
                };
                console.log('✅ 已设置navigation为over模式(确保Header显示)');
            } else {
                console.log(`✅ navigation模式: ${layout.navigation.mode}`);
            }

            // 修复2: 更新Header items - 使用正确的格式
            const HEADER_ITEMS = [
                // 合模位置
                { id: 'hdr_pos_close_val', type: 'label', text: '--', bkcolor: 'transparent', fgcolor: '#ffffff', marginLeft: 8, marginRight: 0,
                  property: { variableId: 't_d0_0100', format: '#.#', ranges: [], events: [], actions: [], options: {} }},
                { id: 'hdr_pos_close_lbl', type: 'label', text: '合模', bkcolor: 'transparent', fgcolor: '#94a3b8', marginLeft: 0, marginRight: 0,
                  property: { variableId: null, format: '', ranges: [], events: [], actions: [], options: {} }},
                { id: 'hdr_pos_close_unit', type: 'label', text: 'mm', bkcolor: 'transparent', fgcolor: '#94a3b8', marginLeft: 0, marginRight: 24,
                  property: { variableId: null, format: '', ranges: [], events: [], actions: [], options: {} }},
                // 开模位置
                { id: 'hdr_pos_open_val', type: 'label', text: '--', bkcolor: 'transparent', fgcolor: '#ffffff', marginLeft: 8, marginRight: 0,
                  property: { variableId: 't_d0_0101', format: '#.#', ranges: [], events: [], actions: [], options: {} }},
                { id: 'hdr_pos_open_lbl', type: 'label', text: '开模', bkcolor: 'transparent', fgcolor: '#94a3b8', marginLeft: 0, marginRight: 0,
                  property: { variableId: null, format: '', ranges: [], events: [], actions: [], options: {} }},
                { id: 'hdr_pos_open_unit', type: 'label', text: 'mm', bkcolor: 'transparent', fgcolor: '#94a3b8', marginLeft: 0, marginRight: 24,
                  property: { variableId: null, format: '', ranges: [], events: [], actions: [], options: {} }},
                // 压力
                { id: 'hdr_pressure_val', type: 'label', text: '--', bkcolor: 'transparent', fgcolor: '#ffffff', marginLeft: 8, marginRight: 0,
                  property: { variableId: 't_d0_0201', format: '#.#', ranges: [], events: [], actions: [], options: {} }},
                { id: 'hdr_pressure_lbl', type: 'label', text: '压力', bkcolor: 'transparent', fgcolor: '#94a3b8', marginLeft: 0, marginRight: 0,
                  property: { variableId: null, format: '', ranges: [], events: [], actions: [], options: {} }},
                { id: 'hdr_pressure_unit', type: 'label', text: 'bar', bkcolor: 'transparent', fgcolor: '#94a3b8', marginLeft: 0, marginRight: 24,
                  property: { variableId: null, format: '', ranges: [], events: [], actions: [], options: {} }},
                // 射速
                { id: 'hdr_speed_val', type: 'label', text: '--', bkcolor: 'transparent', fgcolor: '#ffffff', marginLeft: 8, marginRight: 0,
                  property: { variableId: 't_d0_0301', format: '#', ranges: [], events: [], actions: [], options: {} }},
                { id: 'hdr_speed_lbl', type: 'label', text: '射速', bkcolor: 'transparent', fgcolor: '#94a3b8', marginLeft: 0, marginRight: 0,
                  property: { variableId: null, format: '', ranges: [], events: [], actions: [], options: {} }},
                { id: 'hdr_speed_unit', type: 'label', text: 'rpm', bkcolor: 'transparent', fgcolor: '#94a3b8', marginLeft: 0, marginRight: 24,
                  property: { variableId: null, format: '', ranges: [], events: [], actions: [], options: {} }},
                // 周期
                { id: 'hdr_cycle_val', type: 'label', text: '--', bkcolor: 'transparent', fgcolor: '#ffffff', marginLeft: 8, marginRight: 0,
                  property: { variableId: 't_d0_0401', format: '0.0', ranges: [], events: [], actions: [], options: {} }},
                { id: 'hdr_cycle_lbl', type: 'label', text: '周期', bkcolor: 'transparent', fgcolor: '#94a3b8', marginLeft: 0, marginRight: 0,
                  property: { variableId: null, format: '', ranges: [], events: [], actions: [], options: {} }},
                { id: 'hdr_cycle_unit', type: 'label', text: 's', bkcolor: 'transparent', fgcolor: '#94a3b8', marginLeft: 0, marginRight: 0,
                  property: { variableId: null, format: '', ranges: [], events: [], actions: [], options: {} }}
            ];

            layout.header.items = HEADER_ITEMS;
            console.log('✅ 已更新Header items (15个)');

            // 保存
            db.run(
                "UPDATE general SET value = ? WHERE name = 'layout'",
                [JSON.stringify(layout)],
                function(err) {
                    if (err) {
                        console.error('❌ 保存失败:', err.message);
                    } else {
                        console.log('✅ 配置已保存\n');
                        
                        console.log('========================================');
                        console.log('  修复完成！请重启FUXA服务');
                        console.log('========================================');
                    }
                    db.close();
                }
            );
        });
    });
}

main();
