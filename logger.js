/**
 * logger
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

var winston = require('winston');
var cbuff   = require('winston-circular-buffer');

// Logger instances
var logOk   = null;
var logFail = null;
var logServer = null;

// Log query helper, returns result via callback(err, events)
function queryLog(logger, name, callback) {
    if (logger) {

        var options = {
            // Want the circular buffer to return data as json objects.
            json: true,
            // Circular buffer always returns up to the buffer limit, so
            // we can use the options.limit to restrict the returned
            // results from the file transport, since we won't be using those.
            limit: 1
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
        logOk = new (winston.Logger)({
            levels: { download: 10 },
            transports: [
                new (winston.transports.Console)(),
                new (winston.transports.CircularBuffer)({
                    name: 'downloads-buffer',
                    level: 'download',
                    json: true,
                    size: 50
                }),
                new (winston.transports.File)({
                    name: 'downloads-file',
                    level: 'download',
                    filename: config.log_directory+'/downloads.log',
                    maxsize: 1000000,
                    maxFiles: 5,
                    tailable: true
                })
            ]
        });

        logFail = new (winston.Logger)({
            levels: { failure: 11 },
            transports: [
                new (winston.transports.Console)(),
                new (winston.transports.CircularBuffer)({
                    name: 'failures-buffer',
                    level: 'failure',
                    json: true,
                    size: 50
                }),
                new (winston.transports.File)({
                    name: 'failures-file',
                    level: 'failure',
                    filename: config.log_directory+'/failures.log',
                    maxsize: 1000000,
                    maxFiles: 5,
                    tailable: true
                })
            ]
        });

        logServer = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)(),
                new (winston.transports.CircularBuffer)({
                    name: 'server-buffer',
                    level: 'info',
                    json: true,
                    size: 50
                }),
                // And log all up to info level to file
                new (winston.transports.File)({
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
        queryLog(logOk, 'downloads-buffer', callback);
    },

    // Get logged download failures
    getFailures: function(callback) {
        queryLog(logFail, 'failures-buffer', callback);
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
            logServer.error(text);
        }
    },

    getServerEvents: function(callback) {
        queryLog(logServer, 'server-buffer', callback);
    }

};
