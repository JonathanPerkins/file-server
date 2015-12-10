/**
 * Download logger
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

// nedb-logger uses same file format as nedb, but without keeping database in memory.
var Logger = require('nedb-logger');
var Reader = require('./log_reader');

// Full logfile paths
var okLogFile = null;
var failureLogFile = null;
var serverLogFile = null;

// Logger instances
var logOk   = null;
var logFail = null;
var logServer = null;

module.exports = {

    // Initialise with reference to config module
    init: function(config) {
        okLogFile      = config.log_directory+'/downloads.db';
        failureLogFile = config.log_directory+'/failures.db';
        serverLogFile  = config.log_directory+'/server.db';

        logOk   = new Logger({ filename: okLogFile });
        logFail = new Logger({ filename: failureLogFile });
        logServer = new Logger({ filename: serverLogFile });
    },

    // Log a download
    logDownload: function(category, filename, statusCode, info) {
        if (logOk && logFail) {
            if (statusCode === 200) {
                logOk.insert({ category: category, file: filename, info: info, timestamp: new Date() }, function (err) {
                    if (err) {
                        console.log('Failed to log download, error: '+JSON.stringify(err));
                    }
                });
            }
            else {
                logFail.insert({ category: category, file: filename, info: info, code: statusCode, timestamp: new Date() }, function (err) {
                    if (err) {
                        console.log('Failed to log failure, error: '+JSON.stringify(err));
                    }
                });
            }
        }
    },

    // Get logged downloads - only load into in-memory when access required
    getDownloads: function(callback) {
        Reader.readAll(okLogFile, function(err, downloads) {
            callback(err, downloads);
        });
    },

    getFailures: function(callback) {
        Reader.readAll(failureLogFile, function(err, failures) {
            callback(err, failures);
        });
    },

    // Generic logging for server events
    log: function(text) {
        if (logServer) {
            logServer.insert({ log: text, type: 'info', timestamp: new Date() }, function (err) {
                if (err) {
                    // Yes, I know this should be in the log, but...
                    console.log('Failed to log server event, error: '+JSON.stringify(err));
                }
            });
            // And log to the console for easy development testing
            console.log(text);
        }
    },

    getServerEvents: function(callback) {
        Reader.readAll(serverLogFile, function(err, serverEvents) {
            callback(err, serverEvents);
        });
    }

};
