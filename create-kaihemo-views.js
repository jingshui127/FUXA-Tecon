const http = require('http');
const fs = require('fs');

const FUXA_URL = 'http://127.0.0.1:1881';
const DEVICE_ID = 'd_f9faa9df-f80c40de';
const PAGE_W = 1280;
const PAGE_H = 960;

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function apiGet(path) {
    return new Promise((resolve, reject) => {
        http.get(FUXA_URL + path, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(data); }
            });
        }).on('error', reject);
    });
}

function apiPost(path, payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const url = new URL(FUXA_URL + path);
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

function makeInputItem(variableId, name) {
    const id = 'HXI_' + uuid();
    return {
        id: id, type: 'svg-ext-html_input', name: name,
        property: {
            variableId: variableId,
            ranges: [{ min: 0, max: 99999, color: '', type: 6, stroke: '' }],
            events: [], actions: [],
            options: { updated: true, numeric: true, type: 'number' }
        },
        label: 'HtmlInput', hide: false, lock: false
    };
}

let _sid = 0;
function sid() { return 's' + (++_sid); }

function svgHeader(w, h) {
    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
 <defs>
  <style>
    .pg-bg{fill:#eef1f5}
    .sec-hdr{fill:#1e5a8a;rx:4}
    .sec-title{font-family:Microsoft YaHei,sans-serif;font-weight:bold;font-size:14px;fill:#ffffff}
    .sec-sub{font-family:Microsoft YaHei,sans-serif;font-size:12px;fill:#8ab4d8}
    .col-hdr{font-family:Microsoft YaHei,sans-serif;font-weight:bold;font-size:12px;fill:#2c3e50;text-anchor:middle}
    .row-lbl{font-family:Microsoft YaHei,sans-serif;font-size:12px;fill:#34495e}
    .row-lbl-sm{font-family:Microsoft YaHei,sans-serif;font-size:11px;fill:#5d6d7e}
    .stat-lbl{font-family:Microsoft YaHei,sans-serif;font-size:12px;fill:#5d6d7e}
    .inp-bg{fill:#ffffff;stroke:#bdc3c7;stroke-width:1;rx:3}
    .dis-bg{fill:#ecf0f1;stroke:#d5dbdb;stroke-width:1;rx:3}
    .tbl-line{fill:none;stroke:#d5dbdb;stroke-width:0.5}
    .divider{fill:none;stroke:#bdc3c7;stroke-width:1}
  </style>
 </defs>`;
}

function svgFooter() { return '</svg>'; }

function elRect(id, x, y, w, h, cls) {
    return ` <rect id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>\n`;
}

function elText(x, y, text, cls, anchor) {
    return ` <text x="${x}" y="${y}" class="${cls}"${anchor ? ' text-anchor="'+anchor+'"' : ''}>${text}</text>\n`;
}

function elInput(itemId, x, y, w, h, disabled) {
    const inputId = 'I-' + itemId;
    const bgCls = disabled ? 'dis-bg' : 'inp-bg';
    const bgColor = disabled ? '#ecf0f1' : '#ffffff';
    return ` <g data-name="input" id="${itemId}" type="svg-ext-html_input">
  <rect class="${bgCls}" height="${h}" width="${w}" y="${y}" x="${x}"/>
  <foreignObject id="H-${itemId}" width="${w}" height="${h}" y="${y}" x="${x}">
   <INPUT id="${inputId}" style="width:calc(100% - 6px);height:calc(100% - 4px);text-align:center;border:unset;font-size:12px;font-family:Microsoft YaHei,sans-serif;background-color:${bgColor};color:#2c3e50;" value="#.##" type="text"/>
  </foreignObject>
 </g>\n`;
}

function sectionHeader(x, y, w, title, sub) {
    let s = elRect(sid(), x, y, w, 30, 'sec-hdr');
    s += elText(x + 12, y + 21, title, 'sec-title');
    if (sub) s += elText(x + w - 12, y + 21, sub, 'sec-sub', 'end');
    return s;
}

function buildTable(x, y, colHeaders, rows, items, cellW, cellH) {
    const lblW = 100;
    const hdrH = 28;
    const totalW = lblW + colHeaders.length * cellW;
    const totalH = hdrH + rows.length * cellH;
    let s = '';

    for (let i = 0; i < colHeaders.length; i++) {
        s += elText(x + lblW + i * cellW + cellW / 2, y + 19, colHeaders[i], 'col-hdr');
    }

    for (let r = 0; r < rows.length; r++) {
        const ry = y + hdrH + r * cellH;
        s += elText(x + 8, ry + cellH / 2 + 5, rows[r].label, 'row-lbl');
        for (let c = 0; c < rows[r].cells.length; c++) {
            const cx = x + lblW + c * cellW;
            if (rows[r].cells[c]) {
                const cell = rows[r].cells[c];
                const item = makeInputItem(cell.id, cell.name);
                items[item.id] = item;
                s += elInput(item.id, cx + 3, ry + 3, cellW - 6, cellH - 6, false);
            } else {
                s += elRect(sid(), cx + 3, ry + 3, cellW - 6, cellH - 6, 'dis-bg');
            }
        }
        s += elRect(sid(), x, ry, totalW, cellH, 'tbl-line');
    }
    s += elRect(sid(), x, y, totalW, totalH, 'tbl-line');

    return { svg: s, w: totalW, h: totalH };
}

function buildLabelInput(x, y, label, tag, items, inputW) {
    if (!tag) return '';
    const item = makeInputItem(tag.id, tag.name);
    items[item.id] = item;
    let s = elText(x, y + 14, label, 'row-lbl-sm');
    s += elInput(item.id, x + label.length * 12 + 8, y, inputW || 80, 24, false);
    return s;
}

async function main() {
    console.log('Fetching project data...');
    const project = await apiGet('/api/project');
    const device = project.devices[DEVICE_ID];
    const tags = device.tags;
    const tagIds = Object.keys(tags);

    function findTag(name) {
        const ids = tagIds.filter(id => tags[id].name === name);
        if (ids.length === 0) { console.log('  WARN: ' + name); return null; }
        return { id: ids[0], name };
    }

    // ============================================================
    // PAGE 1: 开合模参数 (1280x960)
    // ============================================================
    console.log('\n=== Page 1 ===');
    const items1 = {};
    let s1 = svgHeader(PAGE_W, PAGE_H);
    s1 += elRect(sid(), 0, 0, PAGE_W, PAGE_H, 'pg-bg');

    const MARGIN = 24;
    const HALF_W = (PAGE_W - MARGIN * 3) / 2;

    // --- 合模 (左半) ---
    const hmX = MARGIN, hmY = MARGIN;
    s1 += sectionHeader(hmX, hmY, HALF_W, '合模', '段数 4');

    const hmTbl = buildTable(
        hmX, hmY + 36,
        ['一段', '二段', '三段', '低压', '高压'],
        [
            { label: '压力 [bar]', cells: [
                findTag('合模1压力1'), findTag('合模2压力1'),
                findTag('合模3压力1'), findTag('合模低压压力1'), findTag('合模高压压力1')
            ]},
            { label: '速度 [%]', cells: [
                findTag('合模1流量1'), findTag('合模2流量1'),
                findTag('合模3流量1'), findTag('合模低压流量1'), findTag('合模高压流量1')
            ]},
            { label: '位置 [mm]', cells: [
                null, findTag('合模1位置1'),
                findTag('合模2位置1'), null, findTag('合模低压位置1')
            ]},
        ],
        items1, 100, 30
    );
    s1 += hmTbl.svg;

    const hmExtraY = hmY + 36 + hmTbl.h + 12;
    s1 += buildLabelInput(hmX + 8, hmExtraY, '时间 [s]', findTag('合模1时间1'), items1, 80);
    s1 += buildLabelInput(hmX + 260, hmExtraY, '高压推力座位置', findTag('合模AD'), items1, 80);

    // --- 开模 (右半) ---
    const kmX = MARGIN * 2 + HALF_W, kmY = MARGIN;
    s1 += sectionHeader(kmX, kmY, HALF_W, '开模', '段数 5');

    const kmTbl = buildTable(
        kmX, kmY + 36,
        ['五段', '四段', '三段', '二段', '一段'],
        [
            { label: '压力 [bar]', cells: [
                findTag('开模5压力1'), findTag('开模4压力1'),
                findTag('开模3压力1'), findTag('开模2压力1'), findTag('开模1压力1')
            ]},
            { label: '速度 [%]', cells: [
                findTag('开模5流量1'), findTag('开模4流量1'),
                findTag('开模3流量1'), findTag('开模2流量1'), findTag('开模1流量1')
            ]},
            { label: '位置 [mm]', cells: [
                null, findTag('开模5位置1'),
                findTag('开模4位置1'), findTag('开模3位置1'), findTag('开模1位置1')
            ]},
        ],
        items1, 100, 30
    );
    s1 += kmTbl.svg;

    const kmExtraY = kmY + 36 + kmTbl.h + 12;
    s1 += buildLabelInput(kmX + 8, kmExtraY, '时间 [s]', findTag('开模1时间1'), items1, 80);
    s1 += buildLabelInput(kmX + 260, kmExtraY, '一段推力座位置', findTag('移模AD'), items1, 80);

    // --- 调模 (左下) ---
    const tmY = hmExtraY + 44;
    s1 += sectionHeader(hmX, tmY, HALF_W, '调模参数');

    const tmTbl = buildTable(
        hmX, tmY + 36,
        ['调模进', '调模退'],
        [
            { label: '压力 [bar]', cells: [findTag('调模进压力1'), findTag('调模退压力1')] },
            { label: '速度 [%]', cells: [findTag('调模进流量1'), findTag('调模退流量1')] },
            { label: '时间 [s]', cells: [findTag('调模进时间1'), findTag('调模退时间1')] },
        ],
        items1, 160, 30
    );
    s1 += tmTbl.svg;

    // --- 功能参数 (右下) ---
    s1 += sectionHeader(kmX, tmY, HALF_W, '功能参数');

    const fnTags = [
        ['合模自保', '低压保护', '开模同时储料'],
        ['合模压', '已开模数', '开合模限时'],
    ];
    let fny = tmY + 40;
    for (let r = 0; r < fnTags.length; r++) {
        for (let c = 0; c < fnTags[r].length; c++) {
            const fx = kmX + 12 + c * 210;
            const ft = findTag(fnTags[r][c]);
            if (ft) {
                const item = makeInputItem(ft.id, ft.name);
                items1[item.id] = item;
                s1 += elText(fx, fny + 14, fnTags[r][c], 'row-lbl-sm');
                s1 += elInput(item.id, fx + fnTags[r][c].length * 12 + 8, fny, 80, 24, false);
            }
        }
        fny += 34;
    }

    // --- 状态栏 ---
    const stY = Math.max(tmY + 36 + tmTbl.h + 16, fny + 8);
    s1 += elRect(sid(), MARGIN, stY, PAGE_W - MARGIN * 2, 2, 'divider');
    s1 += sectionHeader(MARGIN, stY + 10, PAGE_W - MARGIN * 2, '状态监控');

    const statusItems = [
        { label: '已开模数', tag: findTag('已开模数'), unit: '' },
        { label: '合模压', tag: findTag('合模压'), unit: '' },
        { label: '合模AD', tag: findTag('合模AD'), unit: '' },
        { label: '移模AD', tag: findTag('移模AD'), unit: '' },
        { label: '合模高压压力', tag: findTag('合模高压压力'), unit: 'bar' },
        { label: '开模卸荷压力', tag: findTag('开模卸荷压力1'), unit: 'bar' },
    ];
    let stx = MARGIN + 12;
    const sty = stY + 50;
    for (const si of statusItems) {
        if (si.tag) {
            const item = makeInputItem(si.tag.id, si.tag.name);
            items1[item.id] = item;
            s1 += elText(stx, sty + 14, si.label, 'stat-lbl');
            s1 += elInput(item.id, stx + si.label.length * 12 + 8, sty, 80, 24, false);
            if (si.unit) {
                s1 += elText(stx + si.label.length * 12 + 96, sty + 14, si.unit, 'stat-lbl');
            }
        }
        stx += 200;
    }

    s1 += svgFooter();
    console.log('Page 1 items: ' + Object.keys(items1).length);

    // ============================================================
    // PAGE 2: 斜率/PID (1280x960)
    // ============================================================
    console.log('\n=== Page 2 ===');
    const items2 = {};
    let s2 = svgHeader(PAGE_W, PAGE_H);
    s2 += elRect(sid(), 0, 0, PAGE_W, PAGE_H, 'pg-bg');

    // --- 合模斜率 (左) ---
    s2 += sectionHeader(MARGIN, MARGIN, HALF_W, '合模斜率参数');

    const xlHM = buildTable(
        MARGIN, MARGIN + 36,
        ['一段', '二段', '三段', '四段', '低压', '高压'],
        [
            { label: '压力斜率', cells: [
                findTag('合模1段压力斜率'), findTag('合模2段压力斜率'),
                findTag('合模3段压力斜率'), findTag('合模4段压力斜率'),
                findTag('合模低压段压力斜率'), findTag('合模高压段压力斜率')
            ]},
            { label: '速度斜率', cells: [
                findTag('合模1段速度斜率'), findTag('合模2段速度斜率'),
                findTag('合模3段速度斜率'), findTag('合模4段速度斜率'),
                findTag('合模低压段速度斜率'), findTag('合模高压段速度斜率')
            ]},
        ],
        items2, 90, 30
    );
    s2 += xlHM.svg;

    // --- 开模斜率 (右) ---
    s2 += sectionHeader(kmX, MARGIN, HALF_W, '开模斜率参数');

    const xlKM = buildTable(
        kmX, MARGIN + 36,
        ['五段', '四段', '三段', '二段', '一段', '卸荷'],
        [
            { label: '压力斜率', cells: [
                findTag('开模5段压力斜率'), findTag('开模4段压力斜率'),
                findTag('开模3段压力斜率'), findTag('开模2段压力斜率'),
                findTag('开模1段压力斜率'), findTag('开模卸荷段压力斜率')
            ]},
            { label: '速度斜率', cells: [
                findTag('开模5段速度斜率'), findTag('开模4段速度斜率'),
                findTag('开模3段速度斜率'), findTag('开模2段速度斜率'),
                findTag('开模1段速度斜率'), findTag('开模卸荷段速度斜率')
            ]},
        ],
        items2, 90, 30
    );
    s2 += xlKM.svg;

    // --- PID 参数 (左下) ---
    const pidY = MARGIN + 36 + xlHM.h + 20;
    s2 += sectionHeader(MARGIN, pidY, HALF_W, 'PID 参数');

    const pidHM = ['合模P启动','合模P中间','合模P停止','合模P中途停止','合模F中间','合模F停止','合模F中途停止'];
    const pidKM = ['开模P启动','开模P中间','开模P停止','开模P中途停止','开模F启动','开模F中间','开模F停止','开模F中途停止'];

    let py = pidY + 40;
    s2 += elText(MARGIN + 12, py + 14, '合模 PID', 'row-lbl');
    py += 26;
    for (let i = 0; i < pidHM.length; i++) {
        const px = MARGIN + 12 + (i % 4) * 155;
        if (i > 0 && i % 4 === 0) py += 32;
        const pt = findTag(pidHM[i]);
        if (pt) {
            const item = makeInputItem(pt.id, pt.name);
            items2[item.id] = item;
            s2 += elText(px, py + 14, pidHM[i], 'row-lbl-sm');
            s2 += elInput(item.id, px + pidHM[i].length * 12 + 8, py, 60, 24, false);
        }
    }
    py += 36;
    s2 += elText(MARGIN + 12, py + 14, '开模 PID', 'row-lbl');
    py += 26;
    for (let i = 0; i < pidKM.length; i++) {
        const px = MARGIN + 12 + (i % 4) * 155;
        if (i > 0 && i % 4 === 0) py += 32;
        const pt = findTag(pidKM[i]);
        if (pt) {
            const item = makeInputItem(pt.id, pt.name);
            items2[item.id] = item;
            s2 += elText(px, py + 14, pidKM[i], 'row-lbl-sm');
            s2 += elInput(item.id, px + pidKM[i].length * 12 + 8, py, 60, 24, false);
        }
    }

    // --- 状态信号 (右下) ---
    s2 += sectionHeader(kmX, pidY, HALF_W, '状态信号');

    const stateTags = [
        ['合模起始', '合模结束', '合模压力'],
        ['合模流量', '合模自保', '开模起始'],
        ['开模结束', '开模压力', '开模流量'],
    ];
    let sty2 = pidY + 40;
    for (let r = 0; r < stateTags.length; r++) {
        for (let c = 0; c < stateTags[r].length; c++) {
            const sx = kmX + 12 + c * 210;
            const st = findTag(stateTags[r][c]);
            if (st) {
                const item = makeInputItem(st.id, st.name);
                items2[item.id] = item;
                s2 += elText(sx, sty2 + 14, stateTags[r][c], 'row-lbl-sm');
                s2 += elInput(item.id, sx + stateTags[r][c].length * 12 + 8, sty2, 80, 24, false);
            }
        }
        sty2 += 34;
    }

    s2 += svgFooter();
    console.log('Page 2 items: ' + Object.keys(items2).length);

    // ============================================================
    // Upload
    // ============================================================
    console.log('\nUploading...');
    const view1Id = 'v_' + uuid();
    const view2Id = 'v_' + uuid();

    await apiPost('/api/projectData', {
        cmd: 'set-view',
        data: {
            id: view1Id, name: '开合模参数',
            profile: { width: PAGE_W, height: PAGE_H, bkcolor: '#ffffffff', margin: 10, align: 'topCenter', gridType: 'fixed' },
            items: items1, variables: {}, svgcontent: s1, type: 'svg'
        }
    });

    await apiPost('/api/projectData', {
        cmd: 'set-view',
        data: {
            id: view2Id, name: '斜率/PID',
            profile: { width: PAGE_W, height: PAGE_H, bkcolor: '#ffffffff', margin: 10, align: 'topCenter', gridType: 'fixed' },
            items: items2, variables: {}, svgcontent: s2, type: 'svg'
        }
    });

    // Delete ALL old views
    const project2 = await apiGet('/api/project');
    for (const v of project2.hmi.views) {
        if (![view1Id, view2Id].includes(v.id)) {
            console.log('Deleting: ' + v.name + ' (' + v.id + ')');
            await apiPost('/api/projectData', { cmd: 'del-view', data: { id: v.id } });
        }
    }

    // Update layout
    await apiPost('/api/projectData', {
        cmd: 'layout',
        data: {
            autoresize: false, start: view1Id,
            navigation: {
                mode: 'over', type: 'block', bkcolor: '#F4F5F7', fgcolor: '#1D1D1D',
                items: [
                    { text: '开合模参数', view: view1Id, icon: 'brightness_7', image: '', permission: 0 },
                    { text: '斜率/PID', view: view2Id, icon: 'tune', image: '', permission: 0 }
                ], logo: false
            },
            header: { alarms: 'float', infos: 'float', bkcolor: '#ffffff', fgcolor: '#000000',
                fontFamily: 'Roboto-Bold', fontSize: 13, items: [], itemsAnchor: 'left',
                loginInfo: 'username', dateTimeDisplay: 'YYYY/dd/MM - HH:MM:SS' },
            showdev: true, inputdialog: 'keyboard', hidenavigation: false, theme: '',
            loginonstart: false, loginoverlaycolor: 'none', show_connection_error: true, customStyles: ''
        }
    });

    // Verify
    const project3 = await apiGet('/api/project');
    console.log('\n=== Verification ===');
    project3.hmi.views.forEach(v => {
        console.log('View: ' + v.name + ' (' + Object.keys(v.items||{}).length + ' items, ' + (v.profile?.width||'?') + 'x' + (v.profile?.height||'?') + ')');
    });
    console.log('Nav: ' + project3.hmi.layout.navigation.items.map(i => i.text).join(', '));

    console.log('\n=== DONE ===');
    console.log('Page 1: ' + Object.keys(items1).length + ' params');
    console.log('Page 2: ' + Object.keys(items2).length + ' params');
    console.log('Total: ' + (Object.keys(items1).length + Object.keys(items2).length));
    console.log('\nhttp://127.0.0.1:1881');
}

main().catch(e => { console.error(e); process.exit(1); });