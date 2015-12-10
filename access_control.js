/**
 * Access control
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

 var record_definitions = require('./public/record_definitions');

//  database
var database = null;
// Default to console logging
var logger = console;

// Is the given configuration valid for download?
function isConfigValid(config) {

    // Mandatory control
    var isOk = config.enabled;

    // Optional count
    if ((config.count_remaining !== null) && (config.count_remaining === 0)) {
        isOk = false;
    }

    return isOk;
}

module.exports = {

    // Initialise with the active database
    init: function(db, log) {
        database = db;
        logger = log;
    },

    // Is the requested download allowed?
    // Callback with bool
    isAllowed: function(category, filename, callback) {
        database.getUrl(record_definitions.makeUrlPath(category, filename), function(err, urlRecord) {
            var isOk = false;

            if (!err && (urlRecord !== null)) {
                isOk = isConfigValid(urlRecord.config);
            }

            callback(isOk);
        });
    },

    // Indication that a given file has been downloaded
    downloaded: function(category, filename) {

        database.getUrl(record_definitions.makeUrlPath(category, filename), function(err, urlRecord) {
            if (err) {
                logger.log('getUrl error: '+err);
            }
            else {
                if (urlRecord) {
                    // Need to decrement the count?
                    if (urlRecord.config.count_remaining !== null) {
                        urlRecord.config.count_remaining--;
                        // Used up all the counts?
                        if (urlRecord.config.count_remaining <=0) {
                            // Disable the record from further downloads
                            urlRecord.config.enabled = false;
                        }
                    }
                    urlRecord.stats.num_downloads++;;
                    // And update the database
                    database.setUrl(urlRecord.name, urlRecord, function(err) {
                        if (err) {
                            logger.log('error updating URL after download: '+err);
                        }
                    });
                }
                else {
                    logger.log('strange, URL downloaded but does not exist: '+category);
                }
            }
        });

        database.getCategory(category, function(err, category) {
            if (err) {
                logger.log('getCategory error: '+err);
            }
            else {
                if (category) {
                    category.stats.num_downloads++;;
                    // And update the database
                    database.setCategory(category.name, category, function(err) {
                        if (err) {
                            logger.log('error updating category after download: '+err);
                        }
                    });
                }
                else {
                    logger.log('strange, category downloaded but does not exist: '+category);
                }
            }
        });

        database.getFile(filename, function(err, fileRecord) {
            if (err) {
                logger.log('getFile error: '+err);
            }
            else {
                if (fileRecord) {
                    fileRecord.stats.num_downloads++;;
                    // And update the database
                    database.setFile(fileRecord.name, fileRecord, function(err) {
                        if (err) {
                            logger.log('error updating file record after download: '+err);
                        }
                    });
                }
                else {
                    logger.log('strange, file downloaded but does not exist: '+filename);
                }
            }
        });
    }

};
