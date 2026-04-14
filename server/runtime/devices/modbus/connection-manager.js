/**
 * Connection Manager for Modbus devices
 * Manages shared connections and mutexes for multiple slaves on the same port
 */

"use strict";
const Mutex = require("async-mutex").Mutex;

class ConnectionManager {
    constructor() {
        this.connections = new Map();
    }

    /**
     * Get a shared connection for a device
     * @param {Object} data - Device configuration data
     * @param {Number} type - Modbus type (RTU/TCP)
     * @param {Object} ModbusRTU - ModbusRTU library
     * @returns {Object} Connection object
     */
    getConnection(data, type, ModbusRTU) {
        const key = this._getConnectionKey(data, type);
        let connection = this.connections.get(key);

        if (!connection) {
            connection = {
                key: key,
                client: new ModbusRTU(),
                mutex: new Mutex(),
                slaveId: parseInt(data.property.slaveid || 1),
                refCount: 0,
                connected: false
            };
            this.connections.set(key, connection);
        }

        connection.refCount++;
        return connection;
    }

    /**
     * Release a connection
     * @param {Object} connection - Connection object to release
     */
    release(connection) {
        if (connection) {
            connection.refCount--;
            if (connection.refCount <= 0) {
                if (connection.client.isOpen) {
                    try {
                        connection.client.close();
                    } catch (err) {
                        // Ignore error
                    }
                }
                this.connections.delete(connection.key);
            }
        }
    }

    /**
     * Check if a connection is connected
     * @param {String} key - Connection key
     * @returns {Boolean} True if connected
     */
    isConnected(key) {
        const connection = this.connections.get(key);
        return connection ? connection.connected : false;
    }

    /**
     * Set connection status
     * @param {String} key - Connection key
     * @param {Boolean} status - Connection status
     */
    setConnected(key, status) {
        const connection = this.connections.get(key);
        if (connection) {
            connection.connected = status;
        }
    }

    /**
     * Generate a connection key
     * @param {Object} data - Device configuration data
     * @param {Number} type - Modbus type (RTU/TCP)
     * @returns {String} Connection key
     */
    _getConnectionKey(data, type) {
        if (type === 0) { // RTU
            return `RTU:${data.property.address}`;
        } else { // TCP
            return `TCP:${data.property.address}`;
        }
    }
}

// Export a singleton instance
module.exports = new ConnectionManager();
