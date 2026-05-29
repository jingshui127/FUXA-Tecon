/**
 * Stardust Express Middleware
 * HTTP 请求追踪中间件
 */

'use strict';

function createExpressMiddleware(tracer) {
    return function stardustMiddleware(req, res, next) {
        const startTime = Date.now();
        const span = tracer.newSpan(`HTTP ${req.method} ${req.path}`);
        
        span.setTag(`method=${req.method}, path=${req.path}, ip=${req.ip || req.connection.remoteAddress}`);
        
        const originalEnd = res.end;
        res.end = function(...args) {
            const cost = Date.now() - startTime;
            span.setTag(`method=${req.method}, path=${req.path}, status=${res.statusCode}, cost=${cost}ms`);
            
            if (res.statusCode >= 400) {
                span.setError(new Error(`HTTP ${res.statusCode}`));
            }
            
            span.finish();
            originalEnd.apply(res, args);
        };
        
        next();
    };
}

function createDeviceTracer(tracer, deviceName) {
    return {
        traceRead: function(tags, callback) {
            const span = tracer.newSpan(`Device.Read:${deviceName}`);
            span.setTag(`device=${deviceName}, tags=${Array.isArray(tags) ? tags.length : 1}`);
            
            return function(err, result) {
                if (err) {
                    span.setError(err);
                }
                span.finish();
                if (callback) callback(err, result);
            };
        },
        
        traceWrite: function(tags, values, callback) {
            const span = tracer.newSpan(`Device.Write:${deviceName}`);
            span.setTag(`device=${deviceName}, tags=${Array.isArray(tags) ? tags.length : 1}`);
            
            return function(err, result) {
                if (err) {
                    span.setError(err);
                }
                span.finish();
                if (callback) callback(err, result);
            };
        }
    };
}

function traceAlarm(tracer, alarmName, alarmType) {
    const span = tracer.newSpan(`Alarm:${alarmType}`);
    span.setTag(`name=${alarmName}, type=${alarmType}`);
    span.finish();
}

function traceReport(tracer, reportName) {
    const span = tracer.newSpan(`Report:${reportName}`);
    span.setTag(`name=${reportName}`);
    return {
        finish: function() {
            span.finish();
        },
        error: function(err) {
            span.setError(err);
            span.finish();
        }
    };
}

module.exports = {
    createExpressMiddleware,
    createDeviceTracer,
    traceAlarm,
    traceReport
};
