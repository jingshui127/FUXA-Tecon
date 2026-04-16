/*
* Event manager: to read and write all event like login, setTagValue (from script or user), Alarm, Message
*/

'use strict';

const eventstorage = require('./eventstorage');

const version = '1.00';

function EventsManager(_runtime) {
    var runtime = _runtime;
    var settings = runtime.settings;    // Settings
    var logger = runtime.logger;        // Logger

    var _init = function () {
        // Init Events database
        eventstorage.init(settings, logger).then(result => {
            logger.info('events.eventstorage-init successful!', true);
        }).catch(function (err) {
            logger.error(`events.eventstorage-init failed ${err}`);
        });
    }


    /**
     * Clear events of database
     * @param {*} all 
     * @returns 
     */
    this.clearEvents = function (all) {
        return new Promise(function (resolve, reject) {
            eventstorage.clearEvents(all).then(() => {
                resolve(true);
            }).catch(function (err) {
                reject(err);
            });
        });
    }

    /**
     * Return the events history
     */
    this.getEventsHistory = function (query, permission) {
        return new Promise(function (resolve, reject) {
            var history = [];
            eventstorage.getEventsHistory(query.start, query.end).then(result => {
                // for (var i = 0; i < result.length; i++) {
                //     var alr = new AlarmHistory(result[i].nametype);
                //     alr.status = result[i].status;
                //     alr.text = result[i].text;
                //     alr.ontime = result[i].ontime;
                //     alr.offtime = result[i].offtime;
                //     alr.acktime = result[i].acktime;
                //     alr.userack = result[i].userack;
                //     alr.group = result[i].grp;
                // }
                // resolve(history);
                resolve(result);
            }).catch(function (err) {
                logger.error('events.eventstorage-get-history.failed: ' + err);
                reject(err);
            });
        });
    }

    /**
     * Insert Event 
     * @param {*} 
     * @returns 
     */
    this.addEvent = function (type, text) {
        return new Promise(function (resolve, reject) {
            eventstorage.addEvent(new EventHistory(type, text)).then(function (result) {
                resolve(true);
            }).catch(function (err) {
                reject(err);
            });
        });
    }

    this.EventTypes = EventTypes;

    _init();
}

function EventHistory(type, text) {
    this.type = type;
    this.text = text;
    this.ontime = new Date().getTime();
}

const EventTypes = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    DEVICE_SET_VALUE: 'device-set-value',
    DEVICE_START: 'device-start',
    DEVICE_STOP: 'device-stop',
    SCRIPT: 'script',
    ALARM: 'alarm',
    NOTIFICATION: 'notification',
    REPORT: 'report',
    SYSTEM: 'system',
    CLIENT_CONNECT: 'client-connect',
    CLIENT_DISCONNECT: 'client-disconnect'
}

module.exports = {
    create: function (runtime) {
        return new EventsManager(runtime);
    },
}
