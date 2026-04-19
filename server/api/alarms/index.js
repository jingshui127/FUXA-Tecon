/**
 * 'api/alarms': Alarms API to GET/POST alarms data
 */

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
    app: function() {
        var alarmsApp = express();
        alarmsApp.use(function(req, res, next) {
            if (!runtime.project) {
                res.status(404).end();
            } else {
                next();
            }
        });

        /**
         * GET current Alarms
         * Take from alarms storage and reply
         */
        alarmsApp.get("/api/alarms", secureFnc, function(req, res) {
            const permission = checkGroupsFnc(req);
			 if (res.statusCode === 403) {
                runtime.logger.error("api get alarms: Tocken Expired");
            } else {
                try {
                    var filter = req.query.filter ? JSON.parse(req.query.filter) : null;
                    var result = runtime.alarmsMgr.getAlarmsValues(filter, permission);
                    // res.header("Access-Control-Allow-Origin", "*");
                    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    if (result) {
                        res.json(result);
                    } else {
                        res.end();
                    }
                } catch (err) {
                    if (err.code) {
                        res.status(400).json({error:err.code, message: err.message});
                    } else {
                        res.status(400).json({error:"unexpected_error", message:err.toString()});
                    }
                    runtime.logger.error("api get alarms: " + err.message);
                }
			}
        });

                /**
         * GET current Alarms
         * Take from alarms storage and reply
         */
        alarmsApp.get("/api/alarmsHistory", secureFnc, function(req, res) {
            const permission = checkGroupsFnc(req);
			if (res.statusCode === 403) {
                runtime.logger.error("api get alarms: Tocken Expired");
            } else {
                runtime.alarmsMgr.getAlarmsHistory(req.query, permission).then(result => {
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
                    runtime.logger.error("api get alarms: " + err.message);
                });
			}
        });

        /**
         * POST Alarm ACK
         * Set alarm ack
         */
        alarmsApp.post("/api/alarmack", secureFnc, function(req, res, next) {
            const permission = checkGroupsFnc(req);
			 if (res.statusCode === 403) {
                runtime.logger.error("api post alarms: Tocken Expired");
            } else {
                runtime.alarmsMgr.setAlarmAck(req.body.params, req.userId, permission).then(function(data) {
                    res.end();
                }).catch(function(err) {
                    if (err.code) {
                        res.status(err.code).json({error:err.code, message: err.message});
                    } else {
                        res.status(400).json({error:"unexpected_error", message:err.toString()});
                    }
                    runtime.logger.error("api post alarm-ack: " + err.message);
                });
		  }
        });

        /**
         * POST Alarms clear
         */
        alarmsApp.post("/api/alarmsClear", secureFnc, function(req, res, next) {
            const permission = checkGroupsFnc(req);
			 if (res.statusCode === 403) {
                runtime.logger.error("api post alarms: Tocken Expired");
            } else if (!authJwt.haveAdminPermission(permission)) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api post alarms: Unauthorized");
            } else {
            runtime.alarmsMgr.clearAlarms(req.body.params).then(function() {
                runtime.alarmsMgr.reset();
                res.end();
            }).catch(function(err) {
                if (err.code) {
                    res.status(400).json({error:err.code, message: err.message});
                } else {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                }
                runtime.logger.error("api post alarms-clear: " + err.message);
            });
		  }
        });

        /**
         * POST Enable speech synthesis
         */
        alarmsApp.post("/api/alarms/speech/enable", secureFnc, function(req, res) {
            const permission = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api post speech-enable: Token Expired");
            } else if (!authJwt.haveAdminPermission(permission)) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api post speech-enable: Unauthorized");
            } else {
                try {
                    const speech = require('../../runtime/alarms/speech');
                    speech.enable();
                    res.json({ success: true, message: "Speech enabled" });
                } catch (err) {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                    runtime.logger.error("api post speech-enable: " + err.message);
                }
            }
        });

        /**
         * POST Disable speech synthesis
         */
        alarmsApp.post("/api/alarms/speech/disable", secureFnc, function(req, res) {
            const permission = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api post speech-disable: Token Expired");
            } else if (!authJwt.haveAdminPermission(permission)) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api post speech-disable: Unauthorized");
            } else {
                try {
                    const speech = require('../../runtime/alarms/speech');
                    speech.disable();
                    res.json({ success: true, message: "Speech disabled" });
                } catch (err) {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                    runtime.logger.error("api post speech-disable: " + err.message);
                }
            }
        });

        /**
         * POST Test speech synthesis
         */
        alarmsApp.post("/api/alarms/speech/test", secureFnc, function(req, res) {
            const permission = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api post speech-test: Token Expired");
            } else if (!authJwt.haveAdminPermission(permission)) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api post speech-test: Unauthorized");
            } else {
                try {
                    const speech = require('../../runtime/alarms/speech');
                    const text = req.body.text || "FUXA语音播报测试成功";
                    speech.test(text).then(() => {
                        res.json({ success: true, message: "Speech test completed" });
                    }).catch(err => {
                        res.status(400).json({error:"speech_test_failed", message:err.toString()});
                        runtime.logger.error("api post speech-test: " + err.message);
                    });
                } catch (err) {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                    runtime.logger.error("api post speech-test: " + err.message);
                }
            }
        });

        /**
         * GET Speech synthesis status
         */
        alarmsApp.get("/api/alarms/speech/status", secureFnc, function(req, res) {
            const permission = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api get speech-status: Token Expired");
            } else if (!authJwt.haveAdminPermission(permission)) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api get speech-status: Unauthorized");
            } else {
                try {
                    const speech = require('../../runtime/alarms/speech');
                    const stats = speech.getStats();
                    res.json(stats);
                } catch (err) {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                    runtime.logger.error("api get speech-status: " + err.message);
                }
            }
        });

        /**
         * GET Available voices
         */
        alarmsApp.get("/api/alarms/speech/voices", secureFnc, function(req, res) {
            const permission = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api get speech-voices: Token Expired");
            } else if (!authJwt.haveAdminPermission(permission)) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api get speech-voices: Unauthorized");
            } else {
                try {
                    const speech = require('../../runtime/alarms/speech');
                    speech.getAvailableVoices().then(voices => {
                        res.json(voices);
                    }).catch(err => {
                        res.status(400).json({error:"get_voices_failed", message:err.toString()});
                        runtime.logger.error("api get speech-voices: " + err.message);
                    });
                } catch (err) {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                    runtime.logger.error("api get speech-voices: " + err.message);
                }
            }
        });

        /**
         * POST Configure speech synthesis
         */
        alarmsApp.post("/api/alarms/speech/config", secureFnc, function(req, res) {
            const permission = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api post speech-config: Token Expired");
            } else if (!authJwt.haveAdminPermission(permission)) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api post speech-config: Unauthorized");
            } else {
                try {
                    const speech = require('../../runtime/alarms/speech');
                    const config = req.body;
                    
                    if (config.rate !== undefined) {
                        speech.setRate(config.rate);
                    }
                    if (config.volume !== undefined) {
                        speech.setVolume(config.volume);
                    }
                    if (config.voice !== undefined) {
                        speech.setVoice(config.voice);
                    }
                    
                    res.json({ success: true, message: "Speech configuration updated" });
                } catch (err) {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                    runtime.logger.error("api post speech-config: " + err.message);
                }
            }
        });

        /**
         * POST Speak custom message
         */
        alarmsApp.post("/api/alarms/speech/speak", secureFnc, function(req, res) {
            const permission = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api post speech-speak: Token Expired");
            } else if (!authJwt.haveAdminPermission(permission)) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api post speech-speak: Unauthorized");
            } else {
                try {
                    const speech = require('../../runtime/alarms/speech');
                    const text = req.body.text;
                    const options = req.body.options || {};
                    
                    if (!text) {
                        return res.status(400).json({error:"missing_text", message: "Text is required"});
                    }
                    
                    speech.speak(text, options);
                    res.json({ success: true, message: "Speech added to queue" });
                } catch (err) {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                    runtime.logger.error("api post speech-speak: " + err.message);
                }
            }
        });

        return alarmsApp;
    }
}
