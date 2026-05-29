/**
 * Resources manager: template (read/write)
 */
'use strict';

const resStorage = require('./resourcesStorage');

const version = '1.00';

function ResourcesManager(_runtime) {
    var runtime = _runtime;
    var settings = runtime.settings;    // Settings
    var logger = runtime.logger;        // Logger

    var _init = function () {
        resStorage.init(settings, logger).then(result => {
            logger.info('resources.resStorage-init successful!', true);
        }).catch(function (err) {
            logger.error(`resources.resStorage-init failed ${err}`);
        });
    }

    /**
     * Get the template list
     */
    this.getTemplates = (query) => {
        return new Promise((resolve, reject) => {
            resStorage.getTemplates(query.name, query.type).then(drows => {
                if (drows.length > 0) {
                    resolve(drows);
                } else {
                    resolve();
                }
            }).catch(function (err) {
                logger.error(`resources.resStorage-get-template-list failed! ${err}`);
                reject(err);
            });
        });
    }

    /**
     * Set the template
     */
    this.setTemplate = (query) => {
        return new Promise((resolve, reject) => {
            if (query.name) {
                resStorage.setTemplate(query.name, query.type, query.content).then(() => {
                    resolve(true);
                }).catch(function (err) {
                    logger.error(`content.resStorage-set-template failed! ${err}`);
                    reject(err);
                });
            } else {
                reject();
            }
        });
    }

    /**
     * Delete templates
     */
    this.removeTemplates = (query) => {
        return new Promise((resolve, reject) => {
            if (query) {
                resStorage.removeTemplates(query).then(() => {
                    resolve(true);
                }).catch(function (err) {
                    logger.error(`content.resStorage-remove-templates failed! ${err}`);
                    reject(err);
                });
            } else {
                reject();
            }
        });
    }

    _init();
}

module.exports = {
    create: function (runtime) {
        return new ResourcesManager(runtime);
    },
}