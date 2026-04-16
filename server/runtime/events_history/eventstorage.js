/**
 *  Module to manage the users in a database
 *  Table: 'users' 
 */

'use strict';

const fs = require('fs');
const path = require('path');
var sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

var settings        // Application settings
var logger;         // Application logger
var db_event;       // Database of events

/**
 * Init and bind the database resource
 * @param {*} _settings 
 * @param {*} _log 
 */
function init(_settings, _log) {
    settings = _settings;
    logger = _log;

    return _bind();
}

/**
 * Bind the database resource by create the table if not exist
 */
function _bind() {
    return new Promise(function (resolve, reject) {
        var dbfile = path.join(settings.workDir, 'events.fuxap.db');
        db_event = new sqlite3.Database(dbfile, function (err) {
            if (err) {
                logger.error(`eventstorage.bind failed! ${err}`);
                reject();
            }
            logger.info(`eventstorage.connected ${dbfile} database`, true);
        });
        // prepare query
        var sql = "CREATE TABLE if not exists chronicle (Sn INTEGER, type TEXT, text TEXT, ontime INTEGER, PRIMARY KEY(Sn AUTOINCREMENT));";
        db_event.exec(sql, function (err) {
            if (err) {
                logger.error(`eventstorage.bind failed! ${err}`);
                reject();
            } else {
                resolve();
            }
        });  
    });
}


/**
 * Clear all Events from table
 */
function clearEvents(all) {
    return new Promise(function (resolve, reject) {
        var sql = "DELETE FROM chronicle;";
        db_event.exec(sql, function (err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Return the Events history
 */
function getEventsHistory(from, to) {
    return new Promise(function (resolve, reject) {
        if (!db_event) {
            reject(false);
        } else {
            var start = from || 0;
            var end = to || Number.MAX_SAFE_INTEGER;
            var sql = "SELECT * FROM chronicle WHERE ontime BETWEEN ? and ? ORDER BY ontime DESC";
            db_event.all(sql, [start, end], function (err, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }
    });
}

/**
 * Set Event value in database
 */
function addEvent(eventToStore) {
    return new Promise(function (resolve, reject) {
        // prepare query
        if (eventToStore) {
            var sql = "INSERT OR REPLACE INTO chronicle (type, text, ontime) VALUES('" + eventToStore.type + "','" + eventToStore.text + "','" + eventToStore.ontime + "');";
            db_event.exec(sql, function (err) {
                if (err) {
                    logger.error('eventstorage.failed-to-set: ' + err);
                    reject();
                } else {
                    resolve();
                }
            });
        }
    });
}

/**
 * Close the database
 */
function close() {
    if (db_event) {
        db_event.close();
    }
}

module.exports = {
    init: init,
    close: close,
    clearEvents: clearEvents,
    getEventsHistory: getEventsHistory,
    addEvent: addEvent
};