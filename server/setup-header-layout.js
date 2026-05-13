/**
 * setup-header-layout.js - 页眉导航栏配置脚本
 *
 * Phase 1 开发期 - 配置页眉导航栏的Header items
 *
 * 用法: node setup-header-layout.js [--dry-run] [--apply]
 *
 * --dry-run: 仅打印配置，不实际修改
 * --apply:   实际修改项目
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FUXA_URL = 'http://127.0.0.1:1881';
const API_BASE = `${FUXA_URL}/api`;

// ============================================
// 方案A - 页眉导航栏配置
// ============================================
const HEADER_CONFIG = {
    title: '注塑机HMI',
    bkcolor: '#1a1a2e',
    fgcolor: '#ffffff',
    fontFamily: 'Microsoft YaHei,system-ui,sans-serif',
    fontSize: 16,
    itemsAnchor: 'left',

    alarms: 'item.notifymode-fix',
    infos: 'item.notifymode-hide',
    dateTimeDisplay: 'yyyy/MM/dd HH:mm:ss',
    language: 'nothing',
    loginInfo: 'username',

    items: [
        // ===== 第1项: 合模位置 =====
        {
            id: 'hdr_pos_close',
            type: 'label',
            text: '{value}',
            bkcolor: 'transparent',
            fgcolor: '#ffffff',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: 't_d0_0100',
                format: '#.#',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [
                    { min: 0, max: 999.9, color: '#ffffff' },
                    { min: 0, max: 850, color: '#ffffff' },
                    { min: 850, max: 950, color: '#fbbf24' },
                    { min: 950, max: 999.9, color: '#ef4444' }
                ],
                events: [],
                actions: [],
                options: {}
            }
        },
        {
            id: 'hdr_pos_close_lbl',
            type: 'label',
            text: '合模',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: null,
                format: '',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],
                events: [],
                actions: [],
                options: {}
            }
        },
        {
            id: 'hdr_pos_close_unit',
            type: 'label',
            text: 'mm',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 24,
            property: {
                variableId: null,
                format: '',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],
                events: [],
                actions: [],
                options: {}
            }
        },

        // ===== 第2项: 开模位置 =====
        {
            id: 'hdr_pos_open',
            type: 'label',
            text: '{value}',
            bkcolor: 'transparent',
            fgcolor: '#ffffff',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: 't_d0_0101',
                format: '#.#',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [
                    { min: 0, max: 999.9, color: '#ffffff' },
                    { min: 0, max: 850, color: '#ffffff' },
                    { min: 850, max: 950, color: '#fbbf24' },
                    { min: 950, max: 999.9, color: '#ef4444' }
                ],
                events: [],
                actions: [],
                options: {}
            }
        },
        {
            id: 'hdr_pos_open_lbl',
            type: 'label',
            text: '开模',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: null,
                format: '',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],
                events: [],
                actions: [],
                options: {}
            }
        },
        {
            id: 'hdr_pos_open_unit',
            type: 'label',
            text: 'mm',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 24,
            property: {
                variableId: null,
                format: '',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],
                events: [],
                actions: [],
                options: {}
            }
        },

        // ===== 第3项: 合模压力 =====
        {
            id: 'hdr_pressure',
            type: 'label',
            text: '{value}',
            bkcolor: 'transparent',
            fgcolor: '#ffffff',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: 't_d0_0201',
                format: '#.#',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [
                    { min: 0, max: 250, color: '#ffffff' },
                    { min: 0, max: 180, color: '#ffffff' },
                    { min: 180, max: 220, color: '#fbbf24' },
                    { min: 220, max: 250, color: '#ef4444' }
                ],
                events: [],
                actions: [],
                options: {}
            }
        },
        {
            id: 'hdr_pressure_lbl',
            type: 'label',
            text: '压力',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: null,
                format: '',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],
                events: [],
                actions: [],
                options: {}
            }
        },
        {
            id: 'hdr_pressure_unit',
            type: 'label',
            text: 'bar',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 24,
            property: {
                variableId: null,
                format: '',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],
                events: [],
                actions: [],
                options: {}
            }
        },

        // ===== 第4项: 射胶速度 =====
        {
            id: 'hdr_speed',
            type: 'label',
            text: '{value}',
            bkcolor: 'transparent',
            fgcolor: '#ffffff',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: 't_d0_0301',
                format: '#',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [
                    { min: 0, max: 100, color: '#ffffff' },
                    { min: 0, max: 70, color: '#ffffff' },
                    { min: 70, max: 90, color: '#fbbf24' },
                    { min: 90, max: 100, color: '#ef4444' }
                ],
                events: [],
                actions: [],
                options: {}
            }
        },
        {
            id: 'hdr_speed_lbl',
            type: 'label',
            text: '射速',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: null,
                format: '',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],
                events: [],
                actions: [],
                options: {}
            }
        },
        {
            id: 'hdr_speed_unit',
            type: 'label',
            text: 'rpm',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 24,
            property: {
                variableId: null,
                format: '',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],
                events: [],
                actions: [],
                options: {}
            }
        },

        // ===== 第5项: 循环周期 =====
        {
            id: 'hdr_cycle',
            type: 'label',
            text: '{value}',
            bkcolor: 'transparent',
            fgcolor: '#ffffff',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: 't_d0_0401',
                format: '0.00',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [
                    { min: 0, max: 99.99, color: '#ffffff' },
                    { min: 0, max: 30, color: '#ffffff' },
                    { min: 30, max: 50, color: '#fbbf24' },
                    { min: 50, max: 99.99, color: '#ef4444' }
                ],
                events: [],
                actions: [],
                options: {}
            }
        },
        {
            id: 'hdr_cycle_lbl',
            type: 'label',
            text: '周期',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: null,
                format: '',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],
                events: [],
                actions: [],
                options: {}
            }
        },
        {
            id: 'hdr_cycle_unit',
            type: 'label',
            text: 's',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 0,
            property: {
                variableId: null,
                format: '',
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],
                events: [],
                actions: [],
                options: {}
            }
        }
    ]
};

// 自定义CSS样式
const CUSTOM_CSS = `
/* ===== 方案A: 页眉导航栏样式增强 ===== */

/* 基础样式 */
.header {
    height: 48px !important;
    min-height: 48px !important;
    background-color: #1a1a2e !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    z-index: 100 !important;
}

/* 参数数值样式 */
.header-items-button button[type="label"],
.header-items-button button.mat-button {
    padding: 4px 12px !important;
    margin: 0 !important;
    border-radius: 4px !important;
    font-family: 'Microsoft YaHei', system-ui, sans-serif !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    background: transparent !important;
    color: #ffffff !important;
    transition: background-color 150ms ease-out,
                color 300ms ease-out !important;
}

/* 参数标签名(小字) */
.header-items-button button[ng-reflect-text="合模"],
.header-items-button button[ng-reflect-text="开模"],
.header-items-button button[ng-reflect-text="压力"],
.header-items-button button[ng-reflect-text="射速"],
.header-items-button button[ng-reflect-text="周期"] {
    font-size: 10px !important;
    font-weight: 400 !important;
    color: #94a3b8 !important;
    padding-bottom: 0 !important;
}

/* 单位标签 */
.header-items-button button[ng-reflect-text="mm"],
.header-items-button button[ng-reflect-text="bar"],
.header-items-button button[ng-reflect-text="rpm"],
.header-items-button button[ng-reflect-text="s"] {
    font-size: 11px !important;
    font-weight: 400 !important;
    color: #94a3b8 !important;
    padding-top: 0 !important;
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
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.15);
        opacity: 0.75;
    }
}

/* 参数值接近警告(黄) */
.param-warning {
    color: #fbbf24 !important;
}

/* 参数值超限危险(红) */
.param-danger {
    color: #ef4444 !important;
    animation: hdr-value-blink 500ms ease-in-out infinite !important;
}

@keyframes hdr-value-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

/* 参数值离线 */
.param-offline {
    color: #64748b !important;
}
`;

class HeaderLayoutSetup {
    constructor(dryRun = true) {
        this.dryRun = dryRun;
        this.results = {
            success: false,
            headerConfig: null,
            customStyles: CUSTOM_CSS
        };
    }

    async getProject() {
        try {
            const response = await axios.get(`${API_BASE}/project`);
            return response.data;
        } catch (error) {
            throw new Error(`无法获取项目数据: ${error.message}`);
        }
    }

    async saveProject(project) {
        if (this.dryRun) {
            console.log('\n[DRY-RUN] 跳过保存项目');
            return;
        }

        try {
            const response = await axios.post(`${API_BASE}/project`, project);
            console.log('✅ 项目保存成功');
            return response.data;
        } catch (error) {
            throw new Error(`无法保存项目: ${error.message}`);
        }
    }

    buildHeaderLayout() {
        const header = {
            ...HEADER_CONFIG,
            customStyles: CUSTOM_CSS
        };

        return header;
    }

    printCurrentConfig(project) {
        console.log('\n========== 当前Header配置 ==========\n');

        const layout = project.layout || {};
        const header = layout.header || {};

        console.log(`标题: ${header.title || '(未设置)'}`);
        console.log(`背景色: ${header.bkcolor || '(未设置)'}`);
        console.log(`文字色: ${header.fgcolor || '(未设置)'}`);
        console.log(`字体: ${header.fontFamily || '(未设置)'}`);
        console.log(`字号: ${header.fontSize || '(未设置)'}`);
        console.log(`报警模式: ${header.alarms || '(未设置)'}`);
        console.log(`信息模式: ${header.infos || '(未设置)'}`);
        console.log(`日期格式: ${header.dateTimeDisplay || '(未设置)'}`);
        console.log(`登录信息: ${header.loginInfo || '(未设置)'}`);
        console.log(`Items数量: ${header.items ? header.items.length : 0}`);

        if (header.items && header.items.length > 0) {
            console.log('\n当前Header Items:');
            header.items.forEach((item, idx) => {
                const varId = item.property?.variableId || '(无绑定)';
                console.log(`  ${idx + 1}. ${item.id}: ${item.text} [${varId}]`);
            });
        }

        console.log('\n');
    }

    printNewConfig() {
        console.log('\n========== 新Header配置 ==========\n');

        console.log(`标题: ${HEADER_CONFIG.title}`);
        console.log(`背景色: ${HEADER_CONFIG.bkcolor}`);
        console.log(`文字色: ${HEADER_CONFIG.fgcolor}`);
        console.log(`字体: ${HEADER_CONFIG.fontFamily}`);
        console.log(`字号: ${HEADER_CONFIG.fontSize}`);
        console.log(`报警模式: ${HEADER_CONFIG.alarms}`);
        console.log(`信息模式: ${HEADER_CONFIG.infos}`);
        console.log(`日期格式: ${HEADER_CONFIG.dateTimeDisplay}`);
        console.log(`登录信息: ${HEADER_CONFIG.loginInfo}`);
        console.log(`Items数量: ${HEADER_CONFIG.items.length}`);

        console.log('\n新Header Items:');
        HEADER_CONFIG.items.forEach((item, idx) => {
            const varId = item.property?.variableId || '(无绑定)';
            console.log(`  ${idx + 1}. ${item.id}: ${item.text} [${varId}]`);
        });

        console.log('\n自定义CSS: 已配置 (长度: ' + CUSTOM_CSS.length + ' 字符)');
        console.log('\n');
    }

    applyHeaderConfig(project) {
        const layout = project.layout || {};
        layout.header = this.buildHeaderLayout();
        project.layout = layout;
        return project;
    }

    async run() {
        console.log('\n========================================');
        console.log('  页眉导航栏配置脚本 (Phase 1)');
        console.log('========================================\n');
        console.log(`模式: ${this.dryRun ? 'DRY-RUN (仅预览)' : 'APPLY (实际修改)'}`);
        console.log('');

        console.log('----------------------------------------');
        console.log('Step 1: 获取当前项目...');
        console.log('----------------------------------------');

        const project = await this.getProject();
        console.log('✅ 项目加载成功');

        console.log('\n----------------------------------------');
        console.log('Step 2: 当前Header配置:');
        console.log('----------------------------------------');
        this.printCurrentConfig(project);

        console.log('----------------------------------------');
        console.log('Step 3: 新Header配置:');
        console.log('----------------------------------------');
        this.printNewConfig();

        if (this.dryRun) {
            console.log('========================================');
            console.log('  DRY-RUN 完成 - 使用 --apply 实际修改');
            console.log('========================================\n');
            return;
        }

        console.log('----------------------------------------');
        console.log('Step 4: 应用新配置...');
        console.log('----------------------------------------');

        const updatedProject = this.applyHeaderConfig(project);
        await this.saveProject(updatedProject);

        this.results.success = true;
        this.results.headerConfig = this.buildHeaderLayout();

        console.log('\n========================================');
        console.log('  ✅ 配置应用成功');
        console.log('========================================\n');

        return this.results;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--apply');

    const setup = new HeaderLayoutSetup(dryRun);

    try {
        await setup.run();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 执行失败:', error.message);
        process.exit(1);
    }
}

main();
