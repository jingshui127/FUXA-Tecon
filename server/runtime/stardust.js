/**
 * Stardust APM Integration Module
 * 性能监控追踪模块 - 基于官方 SDK 规范
 */

'use strict';

const http = require('http');
const https = require('https');
const zlib = require('zlib');
const os = require('os');
const { randomBytes } = require('crypto');
const v8 = require('v8');

class Span {
    constructor(name, tracer, parentId = '') {
        this.id = randomBytes(8).toString('hex');
        this.parentId = parentId;
        this.traceId = randomBytes(16).toString('hex');
        this.name = name;
        this.startTime = Date.now();
        this.endTime = 0;
        this.tag = '';
        this.error = '';
        this._tracer = tracer;
    }

    setTag(tag) {
        this.tag = tag;
        if (this.tag && this.tag.length > this._tracer.maxTagLength) {
            this.tag = this.tag.substring(0, this._tracer.maxTagLength);
        }
    }

    setError(err) {
        this.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    }

    finish() {
        this.endTime = Date.now();
        this._tracer._finishSpan(this);
    }

    toJSON() {
        return {
            Id: this.id,
            ParentId: this.parentId,
            TraceId: this.traceId,
            StartTime: this.startTime,
            EndTime: this.endTime,
            Tag: this.tag,
            Error: this.error,
        };
    }
}

class SpanBuilder {
    constructor(name, maxSamples = 1, maxErrors = 10) {
        this.name = name;
        this.startTime = Date.now();
        this.endTime = 0;
        this.total = 0;
        this.errors = 0;
        this.cost = 0;
        this.maxCost = 0;
        this.minCost = 0;
        this.samples = [];
        this.errorSamples = [];
        this._maxSamples = maxSamples;
        this._maxErrors = maxErrors;
    }

    addSpan(span) {
        const elapsed = span.endTime - span.startTime;
        this.total++;
        this.cost += elapsed;
        if (this.maxCost === 0 || elapsed > this.maxCost) this.maxCost = elapsed;
        if (this.minCost === 0 || elapsed < this.minCost) this.minCost = elapsed;

        if (span.error) {
            this.errors++;
            if (this.errorSamples.length < this._maxErrors) this.errorSamples.push(span);
        } else {
            if (this.samples.length < this._maxSamples) this.samples.push(span);
        }
        this.endTime = Date.now();
    }

    toJSON() {
        return {
            Name: this.name,
            StartTime: this.startTime,
            EndTime: this.endTime,
            Total: this.total,
            Errors: this.errors,
            Cost: this.cost,
            MaxCost: this.maxCost,
            MinCost: this.minCost,
            Samples: this.samples.map(s => s.toJSON()),
            ErrorSamples: this.errorSamples.map(s => s.toJSON()),
        };
    }
}

class StardustTracer {
    constructor(server, appId, secret = '') {
        this.server = server.replace(/\/+$/, '');
        this.appId = appId;
        this.appName = appId;
        this.secret = secret;
        this.clientId = `${this._getLocalIP()}@${process.pid}`;

        this._token = '';
        this._tokenExpire = 0;

        this.period = 60;
        this.maxSamples = 1;
        this.maxErrors = 10;
        this.timeout = 5000;
        this.maxTagLength = 1024;
        this.excludes = [];

        this._builders = new Map();
        this._running = false;
        this._reportTimer = null;
        this._pingTimer = null;
    }

    async start() {
        await this._login();
        this._running = true;
        this._reportTimer = setInterval(() => this._flush(), this.period * 1000);
        this._pingTimer = setInterval(() => this._ping(), 30000);
    }

    stop() {
        this._running = false;
        if (this._reportTimer) clearInterval(this._reportTimer);
        if (this._pingTimer) clearInterval(this._pingTimer);
        this._flush();
    }

    newSpan(name, parentId = '') {
        return new Span(name, this, parentId);
    }

    _finishSpan(span) {
        if (span.name === '/Trace/Report' || span.name === '/Trace/ReportRaw') return;
        for (const exc of this.excludes) {
            if (exc && span.name.toLowerCase().includes(exc.toLowerCase())) return;
        }

        if (span.tag && span.tag.length > this.maxTagLength) {
            span.tag = span.tag.substring(0, this.maxTagLength);
        }

        let builder = this._builders.get(span.name);
        if (!builder) {
            builder = new SpanBuilder(span.name, this.maxSamples, this.maxErrors);
            this._builders.set(span.name, builder);
        }
        builder.addSpan(span);
    }

    async _login() {
        const payload = {
            AppId: this.appId,
            Secret: this.secret,
            ClientId: this.clientId,
            AppName: this.appName,
        };

        try {
            const data = await this._postJson(`${this.server}/App/Login`, payload);
            if (data) {
                this._token = data.Token || '';
                this._tokenExpire = Date.now() / 1000 + (data.Expire || 7200);
                if (data.Code) this.appId = data.Code;
                if (data.Secret) this.secret = data.Secret;
            }
        } catch (err) {
            console.error(`[Stardust] Login failed: ${err.message}`);
        }
    }

    async _ping() {
        const payload = {
            Id: process.pid,
            Name: this.appName,
            Time: Date.now(),
        };

        try {
            const data = await this._postJson(
                `${this.server}/App/Ping?Token=${encodeURIComponent(this._token)}`,
                payload
            );
            if (data && data.Token) {
                this._token = data.Token;
            }
        } catch (err) {
            console.error(`[Stardust] Ping failed: ${err.message}`);
        }
    }

    async _report(buildersData) {
        const payload = {
            AppId: this.appId,
            AppName: this.appName,
            ClientId: this.clientId,
            Builders: buildersData,
        };

        const body = JSON.stringify(payload);

        try {
            let data;
            if (body.length > 1024) {
                const url = `${this.server}/Trace/ReportRaw?Token=${encodeURIComponent(this._token)}`;
                data = await this._postGzip(url, body);
            } else {
                const url = `${this.server}/Trace/Report?Token=${encodeURIComponent(this._token)}`;
                data = await this._postJson(url, payload);
            }
            if (data) {
                this._applyResponse(data);
            }
        } catch (err) {
            console.error(`[Stardust] Report failed: ${err.message}`);
        }
    }

    _applyResponse(result) {
        if (result.Period > 0) this.period = result.Period;
        if (result.MaxSamples > 0) this.maxSamples = result.MaxSamples;
        if (result.MaxErrors > 0) this.maxErrors = result.MaxErrors;
        if (result.Timeout > 0) this.timeout = result.Timeout;
        if (result.MaxTagLength > 0) this.maxTagLength = result.MaxTagLength;
        if (result.Excludes) this.excludes = result.Excludes;
    }

    _flush() {
        if (this._builders.size === 0) return;
        const list = [];
        for (const [, builder] of this._builders) {
            if (builder.total > 0) list.push(builder.toJSON());
        }
        this._builders.clear();
        if (list.length > 0) this._report(list);
    }

    _postJson(urlStr, payload) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify(payload);
            const parsed = new URL(urlStr);
            const mod = parsed.protocol === 'https:' ? https : http;

            const req = mod.request(parsed, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': Buffer.byteLength(body),
                },
                timeout: 10000,
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.code === 0 ? json.data : null);
                    } catch {
                        resolve(null);
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
            req.write(body);
            req.end();
        });
    }

    _postGzip(urlStr, jsonBody) {
        return new Promise((resolve, reject) => {
            zlib.gzip(Buffer.from(jsonBody, 'utf-8'), (err, compressed) => {
                if (err) { reject(err); return; }

                const parsed = new URL(urlStr);
                const mod = parsed.protocol === 'https:' ? https : http;

                const req = mod.request(parsed, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-gzip',
                        'Content-Length': compressed.length,
                    },
                    timeout: 10000,
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            resolve(json.code === 0 ? json.data : null);
                        } catch {
                            resolve(null);
                        }
                    });
                });

                req.on('error', reject);
                req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
                req.write(compressed);
                req.end();
            });
        });
    }

    _getLocalIP() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '127.0.0.1';
    }
}

let tracerInstance = null;

function createTracer(server, appId, secret) {
    if (!tracerInstance) {
        tracerInstance = new StardustTracer(server, appId, secret);
    }
    return tracerInstance;
}

function getTracer() {
    return tracerInstance;
}

module.exports = {
    StardustTracer,
    Span,
    SpanBuilder,
    createTracer,
    getTracer
};
