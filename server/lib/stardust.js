const axios = require('axios');

class StardustTracker {
  constructor(options = {}) {
    this.server = options.server || 'http://localhost:6600';
    this.appName = options.appName || 'fuxaScada';
    this.deviceId = options.deviceId || this.generateDeviceId();
    this.enabled = options.enabled !== false;
    this.heartbeatInterval = null;
  }

  generateDeviceId() {
    return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  async start() {
    if (!this.enabled) return;

    try {
      await this.register();
      this.heartbeatInterval = setInterval(() => this.heartbeat(), 30000);
      console.log('[Stardust] APM tracer initialized');
    } catch (error) {
      console.error('[Stardust] Failed to initialize:', error.message);
    }
  }

  async register() {
    try {
      const response = await axios.post(`${this.server}/api/agent/register`, {
        appName: this.appName,
        deviceId: this.deviceId,
        os: process.platform,
        version: require('../package.json').version,
        runtime: `Node.js ${process.version}`
      });
      return response.data;
    } catch (error) {
      throw new Error(`Register failed: ${error.message}`);
    }
  }

  async heartbeat() {
    try {
      await axios.post(`${this.server}/api/agent/heartbeat`, {
        deviceId: this.deviceId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Stardust] Heartbeat failed:', error.message);
    }
  }

  async trackEvent(eventName, data = {}) {
    if (!this.enabled) return;

    try {
      await axios.post(`${this.server}/api/agent/event`, {
        deviceId: this.deviceId,
        eventName,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Stardust] Track event failed:', error.message);
    }
  }

  async trackError(error, context = {}) {
    if (!this.enabled) return;

    try {
      await axios.post(`${this.server}/api/agent/error`, {
        deviceId: this.deviceId,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[Stardust] Track error failed:', err.message);
    }
  }

  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

module.exports = StardustTracker;