const fs = require('fs');
const path = require('path');

console.log('=== 应用深海军蓝主题CSS样式 ===\n');

const scssFilePath = path.join(__dirname, '..', 'client', 'src', 'app', 'home', 'home.component.scss');

// 读取现有的SCSS文件
let existingContent = fs.readFileSync(scssFilePath, 'utf8');

// 检查是否已经添加过自定义样式
if (existingContent.includes('/* ===== 方案A: 页眉导航栏样式增强 ===== */')) {
    console.log('⚠️  自定义样式已经存在，跳过添加');
    console.log('   如需重新应用，请先手动删除现有自定义样式部分');
    process.exit(0);
}

// 定义要添加的自定义样式
const customStyles = `
    
/* ===== 方案A: 页眉导航栏样式增强 ===== */
/* 基于计划文档第4章视觉设计规范 */

.header {
    height: 48px !important;
    line-height: 48px !important;
    background-color: #1a1a2e !important;  /* 深海军蓝背景 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    
    /* 参数数值样式 */
    .header-items-button {
        button[type="label"],
        button.mat-button {
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
        button[ng-reflect-text="合模"],
        button[ng-reflect-text="开模"],
        button[ng-reflect-text="压力"],
        button[ng-reflect-text="射速"],
        button[ng-reflect-text="周期"] {
            font-size: 10px !important;
            font-weight: 400 !important;
            color: #94a3b8 !important;
        }
        
        /* 单位标签 */
        button[ng-reflect-text="mm"],
        button[ng-reflect-text="bar"],
        button[ng-reflect-text="rpm"],
        button[ng-reflect-text="s"] {
            font-size: 11px !important;
            font-weight: 400 !important;
            color: #94a3b8 !important;
        }
        
        /* 按钮悬停效果 */
        button:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        /* 按钮点击效果 */
        button:active {
            background-color: rgba(255, 255, 255, 0.18) !important;
            transform: scale(0.97);
        }
    }
}

/* 报警Badge脉冲动画 */
.button-counter.alarm-color {
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
.button-counter.info-color {
    background-color: #f59e0b !important;
    color: #fff !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    min-width: 18px !important;
    height: 18px !important;
    border-radius: 9px !important;
}

/* 日期时间样式 */
.header-date-time {
    font-family: 'Consolas', 'Monaco', monospace !important;
    font-size: 13px !important;
    color: #94a3b8 !important;
    border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* 用户信息样式 */
.header-login {
    border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
    
    .info .primary {
        font-family: 'Microsoft YaHei', sans-serif !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        color: #ffffff !important;
    }
    
    .info .secondary {
        font-size: 11px !important;
        color: #94a3b8 !important;
    }
}

/* 语言切换器样式 */
.header-language {
    border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
    
    mat-icon {
        color: #94a3b8 !important;
    }
    
    .inbk {
        color: #94a3b8 !important;
        font-size: 12px !important;
    }
}

/* 报警/信息按钮图标样式 */
.header-notify-button {
    mat-icon {
        color: #94a3b8 !important;
        transition: color 200ms ease-out !important;
    }
    
    mat-icon:hover {
        color: #ffffff !important;
    }
}

/* 运行状态指示灯特殊样式 */
#hdr_status_light {
    font-size: 20px !important;
    line-height: 20px !important;
    text-shadow: 0 0 8px currentColor !important;
}

`;

// 在文件末尾添加自定义样式（在最后一个 } 之前）
const lastBraceIndex = existingContent.lastIndexOf('}');

if (lastBraceIndex === -1) {
    console.error('❌ 无法找到SCSS文件的结束位置');
    process.exit(1);
}

// 在最后的 } 之前插入自定义样式
const newContent = existingContent.slice(0, lastBraceIndex) + customStyles + '\n' + existingContent.slice(lastBraceIndex);

// 写入更新后的内容
fs.writeFileSync(scssFilePath, newContent, 'utf8');

console.log('✅ 深海军蓝主题CSS样式已成功应用！');
console.log('\n【应用的样式特性】');
console.log('  • 背景色: #1a1a2e (深海军蓝)');
console.log('  • 高度: 48px (从46px增加)');
console.log('  • 参数数值: 16px Bold 白色');
console.log('  • 参数标签/单位: 10-11px 灰蓝色(#94a3b8)');
console.log('  • 报警Badge: 红色脉冲动画');
console.log('  • 信息Badge: 琥珀色');
console.log('  • 日期时间: Consolas等宽字体 13px');
console.log('  • 用户信息: 12px Medium 白色');
console.log('  • 分隔线: rgba(255,255,255,0.08)');
console.log('  • 交互效果: 悬停/点击反馈');
console.log('\n【下一步操作】');
console.log('  1. 重新编译FUXA客户端 (npm run build 或 ng build)');
console.log('  2. 重启FUXA服务查看效果');
console.log('  3. 如需调整样式，编辑 home.component.scss 文件');
