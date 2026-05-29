/**
 *  Module to manage the resources in a database
 *  Table: 'templates' 
 */

'use strict';

const fs = require('fs');
const path = require('path');
var sqlite3 = require('sqlite3').verbose();

var settings        // Application settings
var logger;         // Application logger
var db_templates;   // Database of templates

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
        var dbfile = path.join(settings.workDir, 'templates.fuxap.db');
        var dbfileExist = fs.existsSync(dbfile);
        db_templates = new sqlite3.Database(dbfile, function (err) {
            if (err) {
                logger.error(`resStorage.bind failed! ${err}`);
                reject();
            }
            logger.info(`resStorage.connected ${dbfile} database`, true);
        });
        // prepare query
        var sql = "CREATE TABLE if not exists templates (name TEXT PRIMARY KEY, type TEXT, content TEXT);";
        db_templates.exec(sql, function (err) {
            if (err) {
                logger.error(`resStorage.bind failed! ${err}`);
                reject();
            } else {
                resolve(dbfileExist);
            }
        });
    });
}

/**
 * Return the template list
 */
function getTemplates(name, type) {
    return new Promise(function (resolve, reject) {
        var sql = "SELECT name, type, content FROM templates";
        if (name || type) {
            sql += " WHERE ";
            if (name) {
                sql += "name = '" + name + "' ";
                sql += (type) ? "AND " : "";
            }
            if (type) {
                sql += "type = '" + type + "'";
            }
        }
        db_templates.all(sql, function (err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Set template value in database
 */
function setTemplate(name, type, content) {
    return new Promise(function (resolve, reject) {
        var value = JSON.stringify(content).replace(/\'/g,"''");
        var sql = "INSERT OR REPLACE INTO templates (name, type, content) VALUES('" + name + "','" + type + "','" + value + "');";
        db_templates.exec(sql, function (err) {
            if (err) {
                logger.error(`resStorage.setTemplate failed! ${err}`);
                reject(err);
            } else {
                resolve(true);
            }
        });     
    });
}

/**
 * Set template value in database
 */
function removeTemplates(names) {
    return new Promise(async function (resolve, reject) {
        for (var i = 0; i < names.length; i++) {
            var sql = "DELETE FROM templates WHERE name = '" + names[i] + "'";
            await db_templates.exec(sql, function (err) {
                if (err) {
                    logger.error(`resStorage.remove template failed! ${err}`);
                    reject();
                }
            });
        }
        resolve();
    });
}


/**
 * Close the database
 */
function close() {
    if (db_templates) {
        db_templates.close();
    }
}

module.exports = {
    init: init,
    close: close,
    getTemplates: getTemplates,
    setTemplate: setTemplate,
    removeTemplates: removeTemplates,
};