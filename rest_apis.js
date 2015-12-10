/**
 * REST APIs for the management interface
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

var Boom = require('boom');
var Joi = require('joi');
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
            handler: function(request, reply) {
                database.getCategory(request.params.name, function(err, category){
                    reply(apiDataResponse(err, category));
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/categories/{attr?}",
            handler: function(request, reply) {
                if (request.params.attr) {
                    if (request.params.attr === 'public') {
                        database.getPublicCategories(function(err, categories){
                            reply(apiDataResponse(err, categories));
                        });
                    }
                    else {
                        reply(Boom.notFound('Invalid attribute: '+request.params.attr));
                    }
                }
                else {
                    database.getCategories(function(err, categories){
                        reply(apiDataResponse(err, categories));
                    });
                }
            }
        });

        admin_server.route({
            method: "POST",
            path: "/api/category/{name}",
            handler: function(request, reply) {
                try {
                    // Category has been stringify'd to avoid ajax POST number->string conversion
                    var category = JSON.parse(request.payload.category);
                    database.setCategory(request.params.name, category, function(err) {
                        reply(apiMessageResponse(err, "category updated OK"));
                    });
                }
                catch (e) {
                    reply(Boom.badData('Malformed POST data for URL', request.payload));
                }
            }
        });

        admin_server.route({
            method: "DELETE",
            path: "/api/category/{name}",
            handler: function(request, reply) {
                database.deleteCategory(request.params.name, function(err) {
                    reply(apiMessageResponse(err, "category deleted OK"));
                });
            }
        });

        // ********************************************************
        // Files
        // ********************************************************

        admin_server.route({
            method: "GET",
            path: "/api/files",
            handler: function(request, reply) {
                database.getFiles(function(err, files){
                    reply(apiDataResponse(err, files));
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/file/{name*}",
            handler: function(request, reply) {
                database.getFile(request.params.name, function(err, file){
                    reply(apiDataResponse(err, file));
                });
            }
        });

        // File uploader
        admin_server.route({
            method: "POST",
            path: "/api/file/upload/{name*}",
            handler: function(request, reply) {
                if (request.params.name) {
                    // This route is configured below to deliver the payload as a Stream.Readable
                    file_manager.save(request.params.name, request.payload, function(err) {
                        reply(apiMessageResponse(err, "file uploaded OK"));
                    });
                }
                else {
                    reply(Boom.badRequest('Missing filename'));
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
                    }
                }
            }
        });

        admin_server.route({
            method: "DELETE",
            path: "/api/file/{name*}",
            handler: function(request, reply) {
                file_manager.delete(request.params.name, function(err) {
                    reply(apiMessageResponse(err, "file deleted OK"));
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
            handler: function(request, reply) {
                reply(apiDataResponse(null, { prefix: config.public_url_prefix }));
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/urls",
            handler: function(request, reply) {
                database.getUrls(function(err, urls){
                    reply(apiDataResponse(err, urls));
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/url/{name*}",  // For URLs, name is the path (category/filename) so allow multiple fields
            handler: function(request, reply) {
                database.getUrl(request.params.name, function(err, url){
                    reply(apiDataResponse(err, url));
                });
            }
        });

        admin_server.route({
            method: "POST",
            path: "/api/url/{name*}",
            handler: function(request, reply) {
                // URL has been stringify'd to avoid ajax POST number->string conversion
                try {
                    var url = JSON.parse(request.payload.url);
                    database.setUrl(request.params.name, url, function(err) {
                        reply(apiMessageResponse(err, "URL updated OK"));
                    });
                }
                catch (e) {
                    reply(Boom.badData('Malformed POST data for URL', request.payload));
                }
            }
        });

        admin_server.route({
            method: "DELETE",
            path: "/api/url/{name*}",
            handler: function(request, reply) {
                database.deleteUrl(request.params.name, function(err) {
                    reply(apiMessageResponse(err, "URL deleted OK"));
                });
            }
        });

        // ********************************************************
        // logs
        // ********************************************************

        admin_server.route({
            method: "GET",
            path: "/api/logs/downloads",
            handler: function(request, reply) {
                logger.getDownloads(function(err, downloads){
                    reply(apiDataResponse(err, downloads));
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/logs/failures",
            handler: function(request, reply) {
                logger.getFailures(function(err, failures){
                    reply(apiDataResponse(err, failures));
                });
            }
        });

        admin_server.route({
            method: "GET",
            path: "/api/logs/server",
            handler: function(request, reply) {
                logger.getServerEvents(function(err, serverEvents){
                    reply(apiDataResponse(err, serverEvents));
                });
            }
        });

    }

};
