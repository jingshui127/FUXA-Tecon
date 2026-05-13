const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');
const fs = require('fs');

console.log('=== 通过FUXA原生customStyles注入深海军蓝主题 ===\n');

db.get("SELECT value FROM general", (err, row) => {
    if (!row) {
        console.log('❌ 未找到general表');
        db.close();
        return;
    }
    
    const general = JSON.parse(row.value);
    
    // 检查layout是否存在
    if (!general.layout) {
        general.layout = {};
        console.log('✅ 创建layout对象');
    }
    
    // 定义深海军蓝主题CSS（基于计划文档第4章视觉设计规范）
    const navyThemeCSS = `
/* ===== 方案A: 深海军蓝工业风主题 ===== */
/* 通过FUXA layout.customStyles注入 - 不修改源代码 */

/* 页眉导航栏基础样式 */
.header {
    height: 48px !important;
    line-height: 48px !important;
    background-color: #1a1a2e !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* 参数数值样式 */
.header .header-items-button button[type="label"],
.header .header-items-button button.mat-button {
    padding: 4px 12px !important;
    margin: 0 !important;
    border-radius: 4px !important;
    font-family: 'Microsoft YaHei', system-ui, sans-serif !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    color: #ffffff !important;
    transition: background-color 150ms ease-out,
                color 300ms ease-out !important;
}

/* 参数标签名(小字) */
.header .header-items-button button[ng-reflect-text="合模"],
.header .header-items-button button[ng-reflect-text="开模"],
.header .header-items-button button[ng-reflect-text="压力"],
.header .header-items-button button[ng-reflect-text="射速"],
.header .header-items-button button[ng-reflect-text="周期"] {
    font-size: 10px !important;
    font-weight: 400 !important;
    color: #94a3b8 !important;
}

/* 单位标签 */
.header .header-items-button button[ng-reflect-text="mm"],
.header .header-items-button button[ng-reflect-text="bar"],
.header .header-items-button button[ng-reflect-text="rpm"],
.header .header-items-button button[ng-reflect-text="s"] {
    font-size: 11px !important;
    font-weight: 400 !important;
    color: #94a3b8 !important;
}

/* 按钮悬停效果 */
.header .header-items-button button:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
}

/* 按钮点击效果 */
.header .header-items-button button:active {
    background-color: rgba(255, 255, 255, 0.18) !important;
    transform: scale(0.97);
}

/* 报警Badge脉冲动画 */
.header .button-counter.alarm-color {
    background-color: #dc2626 !important;
    color: #fff !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    min-width: 18px !important;
    height: 18px !important;
    line-height: 18px !important;
    border-radius: 9px !important;
    padding: 0 5px !important;
    animation: hdr-badge-pulse 1s ease-in-out infinite !important;
}

@keyframes hdr-badge-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.75; }
}

/* 信息Badge样式 */
.header .button-counter.info-color {
    background-color: #f59e0b !important;
    color: #fff !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    min-width: 18px !important;
    height: 18px !important;
    border-radius: 9px !important;
}

/* 日期时间样式 */
.header .header-date-time {
    font-family: 'Consolas', 'Monaco', monospace !important;
    font-size: 13px !important;
    color: #94a3b8 !important;
    border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* 用户信息样式 */
.header .header-login {
    border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.header .header-login .info .primary {
    font-family: 'Microsoft YaHei', sans-serif !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    color: #ffffff !important;
}

.header .header-login .info .secondary {
    font-size: 11px !important;
    color: #94a3b8 !important;
}

/* 语言切换器样式 */
.header .header-language {
    border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.header .header-language mat-icon {
    color: #94a3b8 !important;
}

.header .header-language .inbk {
    color: #94a3b8 !important;
    font-size: 12px !important;
}

/* 报警/信息按钮图标样式 */
.header .header-notify-button mat-icon {
    color: #94a3b8 !important;
    transition: color 200ms ease-out !important;
}

.header .header-notify-button mat-icon:hover {
    color: #ffffff !important;
}

/* 运行状态指示灯特殊样式 */
#hdr_status_light {
    font-size: 20px !important;
    line-height: 20px !important;
    text-shadow: 0 0 8px currentColor !important;
}
`;
    
    // 应用customStyles
    const oldStyles = general.layout.customStyles || '';
    
    if (oldStyles.includes('方案A: 深海军蓝工业风主题')) {
        console.log('⚠️  深海军蓝主题CSS已经存在，是否要更新？');
        console.log(`   当前customStyles长度: ${oldStyles.length}字符`);
        
        // 强制更新
        general.layout.customStyles = navyThemeCSS;
        console.log('  → 已更新为最新版本');
    } else {
        // 追加到现有样式
        general.layout.customStyles = oldStyles + '\n' + navyThemeCSS;
        console.log('✅ 已添加深海军蓝主题CSS');
    }
    
    // 更新数据库
    db.run("UPDATE general SET value = ?", [JSON.stringify(general)], (updateErr) => {
        if (updateErr) {
            console.error('\n❌ 更新失败:', updateErr.message);
            db.close();
            return;
        }
        
        console.log('\n=== ✅ CSS注入成功 ===\n');
        console.log('【注入方式】通过FUXA原生 layout.customStyles 字段');
        console.log('【优势】不修改任何FUXA源代码文件');
        console.log('【兼容性】可安全升级FUXA版本\n');
        
        console.log('【应用的样式特性】');
        console.log('  • 背景色: #1a1a2e (深海军蓝)');
        console.log('  • 高度: 48px');
        console.log('  • 参数数值: 16px Bold 白色');
        console.log('  • 参数标签/单位: 10-11px 灰蓝色(#94a3b8)');
        console.log('  • 报警Badge: 红色脉冲动画');
        console.log('  • 信息Badge: 琥珀色');
        console.log('  • 日期时间: Consolas等宽字体 13px');
        console.log('  • 分隔线: rgba(255,255,255,0.08)');
        console.log('  • 交互效果: 悬停/点击反馈\n');
        
        console.log('【下一步操作】');
        console.log('  1. 重启FUXA服务查看效果');
        console.log('  2. 在浏览器中访问HMI界面验证样式');
        console.log('  3. 如需调整样式，修改此脚本的navyThemeCSS变量后重新运行');
        
        db.close();
    });
});
