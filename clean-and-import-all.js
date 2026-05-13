const fs = require('fs');
const http = require('http');
const path = require('path');

const FUXA_URL = 'http://127.0.0.1:1881';
const DEVICE_ID = 'd_f9faa9df-f80c40de';
const BASE_DIR = __dirname;

const CSVS = [
    'plc-tags-D0.csv',
    'plc-tags-D1.csv',
    'plc-tags-D2.csv',
    'plc-tags-D3.csv',
    'plc-tags-D4.csv',
    'plc-tags-D5.csv',
    'plc-tags-D6.csv',
    'plc-tags-D7.csv',
];

// ============================================================
// Placeholder detection rules per sheet
// ============================================================
// Each rule: { sheet: 'D0', pattern: /regex/, minCount: N }
// If a base-name group has >= minCount entries AND matches pattern → placeholder
const PLACEHOLDER_RULES = [
    // D0 - Parameter settings page
    { sheet: 'D0', pattern: /^验证程序(_\d+)?$/, minCount: 1 },
    { sheet: 'D0', pattern: /^取样间隔(_\d+)?$/, minCount: 1 },
    { sheet: 'D0', pattern: /^功能(_\d+)?$/, minCount: 1 },

    // D1 - Analog I/O monitoring (most are real, few placeholders)
    // No obvious placeholder clusters found; D1 looks clean

    // D2 - Monitoring/HMI display page
    { sheet: 'D2', pattern: /^开模位置(_\d+)?$/, minCount: 1 },
    { sheet: 'D2', pattern: /^报警提示(_\d+)?$/, minCount: 1 },
    { sheet: 'D2', pattern: /^包箱模数(_\d+)?$/, minCount: 1 },

    // D3 - I/O Diagnostics (massive template fillers)
    { sheet: 'D3', pattern: /^托模退结束(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^功能选择(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^合模终止(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^备用(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^机械行程(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^现在位置(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^绝对位置(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^限长(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^最小校正保存值(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^最大校正保存值(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^最小校正(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^最大校正(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^最大压力(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^开模卸压流量(_\d+)?$/, minCount: 1 },
    { sheet: 'D3', pattern: /^强制4(_\d+)?$/, minCount: 1 },

    // D7 - Reference values (all are HMI template fillers)
    { sheet: 'D7', pattern: /^设置值参考值\d+$/, minCount: 1 },
    { sheet: 'D7', pattern: /^设置值参考值\d+_\d+$/, minCount: 1 },
    { sheet: 'D7', pattern: /^数据值参考值\d+$/, minCount: 1 },
    { sheet: 'D7', pattern: /^数据值参考值\d+_\d+$/, minCount: 1 },
];

function isPlaceholder(sheet, name) {
    for (const rule of PLACEHOLDER_RULES) {
        if (rule.sheet === sheet && rule.pattern.test(name)) {
            return true;
        }
    }
    return false;
}

// ============================================================
// CSV parsing
// ============================================================
function parseCSVLine(line) {
    const values = [];
    let inQuote = false, cur = '';
    for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { values.push(cur); cur = ''; }
        else { cur += ch; }
    }
    values.push(cur);
    return values;
}

function parseCSV(csvContent) {
    const lines = csvContent.trim().split(/\r?\n/);
    const header = lines[0];
    const headers = header.split(',');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseCSVLine(lines[i]);
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').replace(/^"|"$/g, '').trim(); });
            rows.push(row);
        }
    }
    return { header, rows };
}

function typeMap(csvType) {
    switch (csvType) {
        case 'UInt': return 'UInt16';
        case 'Int32': return 'Int32MLE';
        case 'Float32': return 'Float32MLE';
        case 'Bool': return 'UInt16';
        default: return 'UInt16';
    }
}

function parseModbusAddress(modbusAddr) {
    const match = modbusAddr.match(/^4x(\d+)$/i);
    if (match) return parseInt(match[1], 10);
    return null;
}

// ============================================================
// FUXA API
// ============================================================
async function getProject() {
    return new Promise((resolve, reject) => {
        http.get(FUXA_URL + '/api/project', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function postProjectData(payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const url = new URL(FUXA_URL + '/api/projectData');
        const options = {
            hostname: url.hostname, port: url.port, path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(data); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    const allTags = {};
    const totalStats = { cleaned: {}, imported: 0, filtered: 0, skipped: 0 };

    // Phase 1: Clean all CSV files and collect tags
    for (const csvFile of CSVS) {
        const csvPath = path.join(BASE_DIR, csvFile);
        if (!fs.existsSync(csvPath)) {
            console.log(`SKIP ${csvFile}: file not found`);
            continue;
        }

        const sheet = csvFile.match(/plc-tags-(D\d+)\.csv/)[1];
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const { header, rows } = parseCSV(csvContent);

        let kept = 0, filtered = 0;
        const cleanedLines = [header];

        for (const row of rows) {
            const tagName = row['标签名'];
            const modbusAddr = row['Modbus地址(0-based)'];

            if (isPlaceholder(sheet, tagName)) {
                filtered++;
                continue;
            }

            const address = parseModbusAddress(modbusAddr);
            if (address === null) {
                filtered++;
                continue;
            }

            kept++;
            // Reconstruct CSV line
            const cols = [];
            for (const h of header.split(',')) {
                let val = row[h.trim()] || '';
                if (val.includes(',') || val.includes('"')) {
                    val = '"' + val.replace(/"/g, '""') + '"';
                }
                cols.push(val);
            }
            cleanedLines.push(cols.join(','));

            // Build tag for FUXA
            const tagId = 't_d' + sheet.toLowerCase().substring(1) + '_' + String(address).padStart(4, '0');
            allTags[tagId] = {
                id: tagId,
                name: tagName,
                type: typeMap(row['类型']),
                memaddress: '400000',
                address: address,
                divisor: null,
                daq: { enabled: false, interval: 60, changed: false, restored: false },
                description: `${row['类型'] || 'UInt'}, ${row['字数'] || '1字'}`
            };
        }

        // Save cleaned CSV
        fs.writeFileSync(csvPath, cleanedLines.join('\n') + '\n', 'utf-8');

        totalStats.cleaned[sheet] = { total: rows.length, kept, filtered };
        console.log(`${csvFile}: ${rows.length} rows → ${kept} kept, ${filtered} filtered out`);
    }

    // Phase 2: Import to FUXA
    console.log(`\nTotal tags to import: ${Object.keys(allTags).length}`);
    console.log('\nFetching current project...');
    const project = await getProject();
    const device = project.devices[DEVICE_ID];
    if (!device) {
        console.error('Device not found: ' + DEVICE_ID);
        process.exit(1);
    }
    console.log(`Found device: ${device.name} (${device.type})`);

    device.tags = allTags;

    console.log('Sending to FUXA API...');
    const result = await postProjectData({ cmd: 'set-device', data: device });
    console.log('API response:', JSON.stringify(result).substring(0, 300));

    console.log('\n=== SUMMARY ===');
    console.log('Cleaning results:');
    for (const [sheet, stats] of Object.entries(totalStats.cleaned)) {
        console.log(`  ${sheet}: ${stats.total} → ${stats.kept} (removed ${stats.filtered})`);
    }
    console.log(`\nTotal tags imported to FUXA: ${Object.keys(allTags).length}`);
    console.log('Done!');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
