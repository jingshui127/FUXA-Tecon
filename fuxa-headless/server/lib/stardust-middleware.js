const StardustTracker = require('./stardust');

function stardustMiddleware(tracker) {
  return (req, res, next) => {
    const startTime = Date.now();
    const originalEnd = res.end;

    res.end = function(chunk, encoding) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 追踪 HTTP 请求
      if (tracker && tracker.enabled) {
        tracker.trackEvent('http_request', {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: duration,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        // 追踪错误状态码
        if (res.statusCode >= 400) {
          tracker.trackError(new Error(`HTTP ${res.statusCode}`), {
            method: req.method,
            path: req.path,
            status: res.statusCode
          });
        }
      }

      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

module.exports = stardustMiddleware;