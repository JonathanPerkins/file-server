/**
 * Migrate any old format nedb-logger based logs to the new winston file
 * based ones.
 *
 * N.B: this tool is designed to be used once during an upgrade; it will
 * only create the new winston based logs if they don't already exist.
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

var async = require('async');
var fs = require('fs');
var config = require('../config');

// Check to see if a given file does not exist.
// returns true if the file does not exist, false otherwise
function fileDoesNotExist(fileName, callback) {
    try {
        fs.statSync(fileName);
        return false;
    }
    catch (err) {
        if (err && (err.code === 'ENOENT')) {
            // Fail-safe function - we only say it doesn't exist if we get
            // that specific error from the filesystem
            return true;
        }
        else {
            return false;
        }
    }
}

// read an old nedb-logger log file, returning data via callback(err, results)
function readOldLog(oldLogFile, callback) {

    fs.readFile(oldLogFile, 'utf8', function (err, data) {
        if (err) {
            callback(err, null);
        }
        else {
            var results = [];

            // Each line in the log file is a JSON object
            var lines = data.split("\n");
            for(var i=0; i<lines.length-1; i++) {
                try {
                    var entry = JSON.parse(lines[i]);
                    // Don't need to keep the nedb _id property
                    if (entry._id) {
                        delete entry._id;
                    }
                    // Convert the timestamp property
                    if (entry.timestamp.$$date) {
                        var date = new Date(entry.timestamp.$$date);
                        entry.timestamp = date.toISOString();
                    }
                    results.push(entry);
                }
                catch(e) {
                    console.log('skipping log entry, error: ', e);
                }
            }

            callback(null, results);
        }
    });
}

// New log files
var newDownloadLog = config.log_directory+'/downloads.log';
var newFailureLog  = config.log_directory+'/failures.log';
var newServerLog   = config.log_directory+'/server.log';

// Only migrate if the new log files do not exist
if (fileDoesNotExist(newDownloadLog) && fileDoesNotExist(newFailureLog) && fileDoesNotExist(newServerLog)) {

    async.waterfall([

        // N.B: this upgrade code directly writes the winston log files
        //      rather than using winston itself, so that log timestamps
        //      can be preserved. Its not elegant, but as a one-off for
        //      limited use is OK.

        function(next) {
            readOldLog(config.log_directory+'/downloads.db', function(err, results) {
                if (err) {
                    next(err);
                }
                else {
                    fs.open(newDownloadLog, 'w', function(err, fd){
                        if (err) {
                            next(err);
                        }
                        else {
                            for (var i=0; i<results.length; i++) {
                                fs.writeSync(fd, JSON.stringify(results[i])+'\n');
                            }
                            fs.close(fd, function(err){
                                next(err);
                            });
                        }
                    });
                }
            });
        },

        function(next) {
            readOldLog(config.log_directory+'/failures.db', function(err, results) {
                if (err) {
                    next(err);
                }
                else {
                    fs.open(newFailureLog, 'w', function(err, fd){
                        if (err) {
                            next(err);
                        }
                        else {
                            for (var i=0; i<results.length; i++) {
                                fs.writeSync(fd, JSON.stringify(results[i])+'\n');
                            }
                            fs.close(fd, function(err){
                                next(err);
                            });
                        }
                    });
                }
            });
        },

        function(next) {
            readOldLog(config.log_directory+'/server.db', function(err, results) {
                if (err) {
                    next(err);
                }
                else {
                    fs.open(newServerLog, 'w', function(err, fd){
                        if (err) {
                            next(err);
                        }
                        else {
                            for (var i=0; i<results.length; i++) {
                                var record = {};
                                record.level = 'info';
                                record.message = results[i].log;
                                record.timestamp = results[i].timestamp;
                                fs.writeSync(fd, JSON.stringify(record)+'\n');
                            }
                            fs.close(fd, function(err){
                                next(err);
                            });
                        }
                    });
                }
            });
        }

    ], function (err, result) {
        if (err) {
            console.error(err);
        }
        else {
            console.log('\nUpgrade complete\n');
        }
    });

}
else {
    console.log('\nIt appears the new log files already exist. Skipping upgrade!\n');
}
