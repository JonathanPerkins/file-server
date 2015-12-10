/**
 * File manager
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

var fs = require('fs');
var chokidar = require('chokidar');
var crypto = require('crypto');

var record_definitions = require('./public/record_definitions');

var baseDir = null;
var watcher = null;

// Database accessor
var db = null;
// Logger accessor
var log = null;

// Strip the base directory from the path
function stripBaseDir(path) {
    if (baseDir) {
        return path.replace(baseDir+'/', '');
    }
    else {
        return path;
    }
}

// A file has been added to the system.
function fileAdded(path, callback) {
    if (db) {
        var filename = stripBaseDir(path);
        // Read file stats
        fs.stat(path, function(err, stats) {
            if (!err) {
                // Determine MD5 of file - use streams for large file handling
                var fd = fs.createReadStream(path);
                var hash = crypto.createHash('md5');
                hash.setEncoding('hex');

                fd.on('end', function() {
                    hash.end();
                    var md5 = hash.read();
                    // If file is not in the database, add it with default config
                    db.getFile(filename, function(err, file_record) {
                        if (!err) {
                            // Create a default record if the file does not exist in the database
                            var infoStr = 'Updated';
                            if (file_record === null) {
                                file_record = record_definitions.newFileRecord();
                                file_record.name = filename;
                                infoStr = 'Added new';
                            }

                            // Update the size and hash
                            file_record.size = stats.size;
                            file_record.md5 = md5;
                            db.setFile(filename, file_record, function(err) {
                                if (err) {
                                    log.log(infoStr+' file ERROR: '+filename+' error: '+err);
                                }
                                else {
                                    log.log(infoStr+" file: "+filename);
                                }
                                callback(err);
                            });
                        }
                        else {
                            callback(err);
                        }
                    });
                });

                // read all file and pipe it (write it) to the hash object
                fd.pipe(hash);
            }
            else {
                callback(err);
            }
        });
    }
}

function fileRemoved(path, callback) {
    if (db) {
        var filename = stripBaseDir(path);
        db.deleteFile(filename, function(err, numRemoved) {
            if (err) {
                log.log('Error removing file: '+filename+' error: '+err);
            }
            else if (numRemoved > 0) {
                log.log('File removed '+filename);
            }
            callback(err);
        });
    }
}

module.exports = {

    // Initialise with the base directory to watch for files
    init: function(base_directory, database, logger) {
        baseDir = base_directory;
        db = database;
        log = logger;

        // Create watcher (ignore dot files) and install callbacks
        watcher = chokidar.watch(base_directory, {
            ignored: /[\/\\]\./,
            persistent: true,
            // By default, add events will fire when a file first appears on disk,
            // before the entire file has been written. Force polling for file
            // write completion with this option.
            awaitWriteFinish: true
        });

        // Install watcher callbacks - so files can be added by dropping
        // into the baseDir as well as using the upload API.
        watcher.on('add', function(path) { fileAdded(path, function(err){}); });
        watcher.on('unlink', function(path) { fileRemoved(path, function(err){}); });
    },

    // Save a file to the filesystem.
    // Return result via callback(err) with err === null on success.
    save: function(file_path, stream_reader, callback) {
        var writer = fs.createWriteStream(baseDir+'/'+file_path);
        stream_reader.pipe(writer);
        writer.on('finish', function() {
            fileAdded(baseDir+'/'+file_path, callback);
        });
    },

    // Delete a file.
    // Return result via callback(err) with err === null
    // on success.
    delete: function(file_path, callback) {
        fs.unlink(baseDir+'/'+file_path, function(err) {
            if (err) callback(err);
            fileRemoved(baseDir+'/'+file_path, callback);
        });
    },

    close: function() {
        if (watcher) {
            watcher.close();
        }
    }
};
