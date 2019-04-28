/**
 * logger
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

const {transports, createLogger, format} = require('winston');

// Logger instances
var logOk   = null;
var logFail = null;
var logServer = null;

// Log query helper, returns result via callback(err, events)
function queryLog(logger, name, callback) {
    if (logger) {

        var options = {
            limit: 50,
            start: 0,
            order: 'desc',
            fields: ['message', 'level', 'timestamp']
        };

        logger.query(options, function(err, results) {
            var events;
            if (!err) {
                events = results[name];
            }
            callback(err, events);
        });
    }
}

module.exports = {

    // Initialise using the config module
    init: function(config) {

        // Create 3 logger instances, because we want to log only specific
        // levels to each log file rather than the 'up to level n' as supported
        // by one winston instance with multiple transports
        logOk = new (createLogger)({
            levels: { download: 10 },
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new (transports.Console)(),
                new (transports.File)({
                    name: 'downloads-file',
                    level: 'download',
                    filename: config.log_directory+'/downloads.log',
                    maxsize: 1000000,
                    maxFiles: 5,
                    tailable: true
                })
            ]
        });

        logFail = new (createLogger)({
            levels: { failure: 11 },
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new (transports.Console)(),
                new (transports.File)({
                    name: 'failures-file',
                    level: 'failure',
                    filename: config.log_directory+'/failures.log',
                    maxsize: 1000000,
                    maxFiles: 5,
                    tailable: true
                })
            ]
        });

        logServer = new (createLogger)({
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new (transports.Console)(),
                //And log all up to info level to file
                new (transports.File)({
                    name: 'server-file',
                    filename: config.log_directory+'/server.log',
                    level: 'info',
                    handleExceptions: true,
                    humanReadableUnhandledException: true,
                    exitOnError: false,
                    maxsize: 1000000,
                    maxFiles: 5,
                    tailable: true
                })
            ]
        });
    },

    // Shut down the logging system
    end: function() {
        if (logOk) {
            logOk.end();
        }
        if (logFail) {
            logFail.end();
        }
        if (logServer) {
            logServer.end();
        }
    },

    // Application exit hook that can be used to ensure all SERVER file logs are flushed
    exitAfterFlush: function(code) {
        logServer.transports['server-file'].on('flush', function() {
            process.exit(code);
        });
    },

    // Log a download
    logDownload: function(category, filename, statusCode, info) {
        if (logOk && logFail) {
            if (statusCode === 200) {
                logOk.download({ category: category, file: filename, info: info});
            }
            else {
                logFail.failure({ category: category, file: filename, info: info, code: statusCode});
            }
        }
    },

    // Get logged downloads - only load into in-memory when access required
    getDownloads: function(callback) {
        queryLog(logOk, 'downloads-file', callback);
    },

    // Get logged download failures
    getFailures: function(callback) {
        queryLog(logFail, 'failures-file', callback);
    },

    // Generic logging for server events
    log: function(text) {
        if (logServer) {
            logServer.info(text);
        }
    },

    // Generic logging for server errors
    error: function(text) {
        if (logServer) {
            logServer.info(text);
        }
    },

    getServerEvents: function(callback) {
        queryLog(logServer, 'server-file', callback);
    }

};
