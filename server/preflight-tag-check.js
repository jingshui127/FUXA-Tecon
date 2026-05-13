/**
 * preflight-tag-check.js - 页眉标签预检脚本
 *
 * Phase 0 准备工作 - P0-T1: 确认标签ID清单
 *
 * 用法: node preflight-tag-check.js [tagId1] [tagId2] ...
 *       不带参数时检查默认的Header标签清单
 */

const axios = require('axios');

const FUXA_URL = 'http://127.0.0.1:1881';
const API_BASE = `${FUXA_URL}/api`;

// 页眉导航栏需要的标签清单
const HEADER_TAG_MAP = {
    '合模位置':   { id: 't_d0_0100', unit: 'mm',   divisor: 1,  decimals: 1, range: [0, 999.9] },
    '开模位置':   { id: 't_d0_0101', unit: 'mm',   divisor: 1,  decimals: 1, range: [0, 999.9] },
    '合模压力':   { id: 't_d0_0201', unit: 'bar',  divisor: 10, decimals: 1, range: [0, 250] },
    '射胶速度':   { id: 't_d0_0301', unit: 'rpm',  divisor: 1,  decimals: 0, range: [0, 100] },
    '循环周期':   { id: 't_d0_0401', unit: 's',    divisor: 10, decimals: 2, range: [0, 99.99] },
};

const HEADER_TAG_BY_ID = Object.fromEntries(
    Object.values(HEADER_TAG_MAP).map(v => [v.id, v])
);

const DEFAULT_TAGS = Object.values(HEADER_TAG_MAP).map(v => v.id);

class PreflightChecker {
    constructor() {
        this.results = {
            valid: [],
            invalid: [],
            warnings: [],
            errors: []
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

    extractTags(project) {
        const tags = {};

        if (project.tags) {
            Object.assign(tags, project.tags);
        }

        if (project.devices) {
            for (const device of Object.values(project.devices)) {
                if (device.tags) {
                    Object.assign(tags, device.tags);
                }
            }
        }

        return tags;
    }

    async checkTag(tagId) {
        try {
            const response = await axios.get(`${API_BASE}/getTagValue?id=${tagId}`);
            return {
                id: tagId,
                exists: true,
                value: response.data.value,
                quality: response.data.quality,
                error: null
            };
        } catch (error) {
            if (error.response) {
                if (error.response.status === 404) {
                    return {
                        id: tagId,
                        exists: false,
                        value: null,
                        quality: null,
                        error: 'TAG_NOT_FOUND'
                    };
                }
                if (error.response.status === 400) {
                    return {
                        id: tagId,
                        exists: true,
                        value: null,
                        quality: null,
                        error: 'API_400_AUTH_REQUIRED'
                    };
                }
            }
            return {
                id: tagId,
                exists: false,
                value: null,
                quality: null,
                error: error.message
            };
        }
    }

    validateTagConfig(tagId, expectedConfig, actualTag) {
        const issues = [];

        if (!actualTag) {
            issues.push({ level: 'error', msg: '标签不存在' });
            return issues;
        }

        if (expectedConfig.divisor && actualTag.divisor !== expectedConfig.divisor) {
            issues.push({
                level: 'warning',
                msg: `除数配置错误: 期望 ${expectedConfig.divisor}, 实际 ${actualTag.divisor || '未设置'}`
            });
        }

        if (expectedConfig.register) {
            if (actualTag.register !== expectedConfig.register) {
                issues.push({
                    level: 'warning',
                    msg: `寄存器类型错误: 期望 ${expectedConfig.register}, 实际 ${actualTag.register || '未设置'}`
                });
            }
        }

        if (expectedConfig.memaddress) {
            if (actualTag.memaddress !== expectedConfig.memaddress) {
                issues.push({
                    level: 'warning',
                    msg: `地址配置错误: 期望 ${expectedConfig.memaddress}, 实际 ${actualTag.memaddress || '未设置'}`
                });
            }
        }

        return issues;
    }

    async run(tagIds) {
        tagIds = tagIds || DEFAULT_TAGS;

        console.log('\n========================================');
        console.log('  页眉标签预检脚本 (Phase 0 - P0-T1)');
        console.log('========================================\n');
        console.log(`📡 FUXA: ${FUXA_URL}`);
        console.log(`📋 检查标签数: ${tagIds.length}`);
        console.log('');

        console.log('----------------------------------------');
        console.log('Step 1: 获取项目数据...');
        console.log('----------------------------------------');

        let project, allTags;
        try {
            project = await this.getProject();
            allTags = this.extractTags(project);
            console.log(`✅ 项目加载成功`);
            console.log(`   总标签数: ${Object.keys(allTags).length}`);
        } catch (error) {
            console.log(`❌ ${error.message}`);
            this.results.errors.push(error.message);
            return this.results;
        }

        console.log('\n----------------------------------------');
        console.log('Step 2: 检查标签存在性...');
        console.log('----------------------------------------');

        const tagCheckPromises = tagIds.map(async (tagId) => {
            const tagResult = await this.checkTag(tagId);
            const tagInfo = allTags[tagId];

            if (tagResult.exists) {
                this.results.valid.push({
                    id: tagId,
                    value: tagResult.value,
                    quality: tagResult.quality,
                    config: tagInfo
                });
                console.log(`  ✅ ${tagId}: ${tagResult.value} (quality: ${tagResult.quality})`);
            } else {
                this.results.invalid.push({
                    id: tagId,
                    error: tagResult.error
                });
                console.log(`  ❌ ${tagId}: ${tagResult.error}`);
            }

            if (tagInfo) {
                const issues = this.validateTagConfig(tagId, HEADER_TAG_BY_ID[tagId] || {}, tagInfo);
                issues.forEach(issue => {
                    if (issue.level === 'warning') {
                        this.results.warnings.push({ id: tagId, ...issue });
                        console.log(`     ⚠️  ${issue.msg}`);
                    }
                });
            }

            return tagResult;
        });

        await Promise.all(tagCheckPromises);

        console.log('\n----------------------------------------');
        console.log('Step 3: 生成报告...');
        console.log('----------------------------------------');

        this.printSummary();

        return this.results;
    }

    printSummary() {
        console.log('\n========== 预检结果汇总 ==========\n');

        console.log(`✅ 有效标签: ${this.results.valid.length}`);
        if (this.results.valid.length > 0) {
            this.results.valid.forEach(tag => {
                console.log(`   - ${tag.id}: ${tag.value}`);
            });
        }

        console.log(`\n❌ 无效标签: ${this.results.invalid.length}`);
        if (this.results.invalid.length > 0) {
            this.results.invalid.forEach(tag => {
                console.log(`   - ${tag.id}: ${tag.error}`);
            });
        }

        console.log(`\n⚠️  配置警告: ${this.results.warnings.length}`);
        if (this.results.warnings.length > 0) {
            this.results.warnings.forEach(w => {
                console.log(`   - [${w.id}] ${w.msg}`);
            });
        }

        console.log(`\n🚫 错误: ${this.results.errors.length}`);
        if (this.results.errors.length > 0) {
            this.results.errors.forEach(err => {
                console.log(`   - ${err}`);
            });
        }

        const allGood = this.results.invalid.length === 0 &&
                        this.results.errors.length === 0;

        console.log('\n========================================');
        if (allGood) {
            console.log('  ✅ 预检通过 - 所有标签配置正确');
        } else {
            console.log('  ❌ 预检失败 - 请修复上述问题');
        }
        console.log('========================================\n');

        return allGood;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const tagIds = args.length > 0 ? args : null;

    const checker = new PreflightChecker();
    const results = await checker.run(tagIds);

    process.exit(results.invalid.length > 0 || results.errors.length > 0 ? 1 : 0);
}

main().catch(error => {
    console.error('执行出错:', error);
    process.exit(1);
});
