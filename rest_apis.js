/**
 * REST APIs for the management interface
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

var Boom = require('@hapi/boom');
var Joi = require('@hapi/joi');
var record_definitions = require('./public/record_definitions');

// Helper for processing API callback(err, docs) with JSON data
function apiDataResponse(err, data) {
    if (err) {
        return Boom.notFound('database error: '+err);
    }
    else {
        if (data === null) {
            return Boom.notFound();
        }
        else {
            return data;
        }
    }
}

// Helper for processing API callback(err, message) with text message
function apiMessageResponse(err, msg) {
    if (err) {
        return Boom.notFound('error: '+err);
    }
    else {
        return { message: msg };
    }
}

module.exports = {

    init: function(admin_server, config, database, file_manager, logger) {

        // ********************************************************
        // Categories
        // ********************************************************

        admin_server.route({
            method: "GET",
            path: "/api/category/{name}",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    database.getCategory(request.params.name, function(err, category){
                        resolve(apiDataResponse(err, category));
                    });
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/categories/{attr?}",
            handler: function(request, h) {
                if (request.params.attr) {
                    if (request.params.attr === 'public') {
                        return new Promise(function(resolve, reject) {
                            database.getPublicCategories(function(err, categories){
                                resolve(apiDataResponse(err, categories));
                            });
                        });
                    }
                    else {
                        return Boom.notFound('Invalid attribute: '+request.params.attr);
                    }
                }
                else {
                    return new Promise(function(resolve, reject) {
                        database.getCategories(function(err, categories){
                            resolve(apiDataResponse(err, categories));
                        });
                    });
                }
            }
        });

        admin_server.route({
            method: "POST",
            path: "/api/category/{name}",
            handler: function(request, h) {
                try {
                    // Category has been stringify'd to avoid ajax POST number->string conversion
                    var category = JSON.parse(request.payload.category);
                    return new Promise(function(resolve, reject) {
                        database.setCategory(request.params.name, category, function(err) {
                            resolve(apiMessageResponse(err, "category updated OK"));
                        });
                    });
                }
                catch (e) {
                    return Boom.badData('Malformed POST data for URL', request.payload);
                }
            }
        });

        admin_server.route({
            method: "DELETE",
            path: "/api/category/{name}",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    database.deleteCategory(request.params.name, function(err) {
                        resolve(apiMessageResponse(err, "category deleted OK"));
                    });
                });
            }
        });

        // ********************************************************
        // Files
        // ********************************************************

        admin_server.route({
            method: "GET",
            path: "/api/files",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    database.getFiles(function(err, files){
                        resolve(apiDataResponse(err, files));
                    });
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/file/{name*}",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    database.getFile(request.params.name, function(err, file){
                        resolve(apiDataResponse(err, file));
                    });
                });
            }
        });

        // File uploader
        admin_server.route({
            method: "POST",
            path: "/api/file/upload/{name*}",
            handler: function(request, h) {
                if (request.params.name) {
                    return new Promise(function(resolve, reject) {
                        // This route is configured below to deliver the payload as a Stream.Readable
                        file_manager.save(request.params.name, request.payload, function(err) {
                            resolve(apiMessageResponse(err, "file uploaded OK"));
                        });
                    });
                }
                else {
                    return Boom.badRequest('Missing filename');
                }
            },
            config: {
                payload: {
                    allow: 'application/octet-stream',
                    parse: true,
                    output: 'stream',
                    maxBytes: 100*1024*1024
                },
                validate: {
                    params: {
                        // Don't accept dodgy looking URLs - just a simple filename
                        name: Joi.string().regex(/^[a-zA-Z0-9_\-\s\.]+$/)
                    },
                    failAction: function(request, reply, source, error) {
                        logger.log('URL validation fail: '+source);
                        return Boom.badRequest('URL validation fail');
                    },
                    query: false
                }
            }
        });

        admin_server.route({
            method: "DELETE",
            path: "/api/file/{name*}",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    file_manager.delete(request.params.name, function(err) {
                        resolve(apiMessageResponse(err, "file deleted OK"));
                    });
                });
            }
        });

        // ********************************************************
        // URLs
        // ********************************************************

        // URL prefix from the config file, so web UI can present a complete URL
        admin_server.route({
            method: "GET",
            path: "/api/url_prefix",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    resolve(apiDataResponse(null, { prefix: config.public_url_prefix }));
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/urls",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    database.getUrls(function(err, urls){
                        resolve(apiDataResponse(err, urls));
                    });
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/url/{name*}",  // For URLs, name is the path (category/filename) so allow multiple fields
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    database.getUrl(request.params.name, function(err, url){
                        resolve(apiDataResponse(err, url));
                    });
                });
            }
        });

        admin_server.route({
            method: "POST",
            path: "/api/url/{name*}",
            handler: function(request, h) {
                // URL has been stringify'd to avoid ajax POST number->string conversion
                try {
                    if (request.payload.url) {
                        var url = JSON.parse(request.payload.url);
                        return new Promise(function(resolve, reject) {
                            database.setUrl(request.params.name, url, function(err) {
                                resolve(apiMessageResponse(err, "URL updated OK"));
                            });
                        });
                    }
                    else {
                        throw Error('Missing URL');
                    }
                }
                catch (e) {
                    return Boom.badData('Malformed POST data for URL', request.payload);
                }
            }
        });

        admin_server.route({
            method: "DELETE",
            path: "/api/url/{name*}",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    database.deleteUrl(request.params.name, function(err) {
                        resolve(apiMessageResponse(err, "URL deleted OK"));
                    });
                });
            }
        });

        // ********************************************************
        // logs
        // ********************************************************

        admin_server.route({
            method: "GET",
            path: "/api/logs/downloads",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    logger.getDownloads(function(err, downloads){
                        resolve(apiDataResponse(err, downloads));
                    });
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/logs/failures",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    logger.getFailures(function(err, failures){
                        resolve(apiDataResponse(err, failures));
                    });
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/logs/server",
            handler: function(request, h) {
                return new Promise(function(resolve, reject) {
                    logger.getServerEvents(function(err, serverEvents){
                        resolve(apiDataResponse(err, serverEvents));
                    });
                });
            }
        });

    }

};
