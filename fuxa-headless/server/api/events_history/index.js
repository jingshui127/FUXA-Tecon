/**
 * 'api/logs': Diagnose API to GET logs data
 */

const fs = require('fs');
const path = require('path');
var express = require("express");
const authJwt = require('../jwt-helper');
var runtime;
var secureFnc;
var checkGroupsFnc;

module.exports = {
    init: function (_runtime, _secureFnc, _checkGroupsFnc) {
        runtime = _runtime;
        secureFnc = _secureFnc;
        checkGroupsFnc = _checkGroupsFnc;
    },
    app: function () {
        var eventsApp = express();
        eventsApp.use(function (req, res, next) {
            if (!runtime.project) {
                res.status(404).end();
            } else {
                next();
            }
        });

        /**
         * GET Events history
         */
        eventsApp.get('/api/events', secureFnc, function (req, res) {
            const permission = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api get events history: Tocken Expired");
            } else if (!authJwt.haveAdminPermission(permission)) {
                res.status(401).json({ error: "unauthorized_error", message: "Unauthorized!" });
                runtime.logger.error("api get events history: Unauthorized!");
            } else {
                runtime.eventsHistoryMgr.getEventsHistory(req.query, permission).then(result => {
                    // res.header("Access-Control-Allow-Origin", "*");
                    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    if (result) {
                        res.json(result);
                    } else {
                        res.end();
                    }
                }).catch(function(err) {
                    if (err.code) {
                        res.status(400).json({error:err.code, message: err.message});
                    } else {
                        res.status(400).json({error:"unexpected_error", message:err.toString()});
                    }
                    runtime.logger.error("api get events history: " + err.message);
                });   
            }
        });

        /**
         * POST Events clear
         */
        eventsApp.post("/api/eventsClear", secureFnc, function(req, res, next) {
            const permission = checkGroupsFnc(req);
			 if (res.statusCode === 403) {
                runtime.logger.error("api post events-clear: Tocken Expired");
            } else if (!authJwt.haveAdminPermission(permission)) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api post events-clear: Unauthorized");
            } else {
            runtime.eventsHistoryMgr.clearEvents(req.body.params).then(function() {
                runtime.alarmsMgr.reset();
                res.end();
            }).catch(function(err) {
                if (err.code) {
                    res.status(400).json({error:err.code, message: err.message});
                } else {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                }
                runtime.logger.error("api post events-clear: " + err.message);
            });      
		  }			
        });

        return eventsApp;
    }
}
