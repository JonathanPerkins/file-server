/**
 * File server application
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

/*jslint node: true */
'use strict';

var Hapi = require('hapi');
var Good = require('good');
var Boom = require('boom');
var Joi = require('joi');
var Path = require('path');
var Vision = require('vision');
var Inert = require('inert');
var Handlebars = require('handlebars');
var Layouts = require('handlebars-layouts');
// Application modules
var database = require('./database');
var file_manager = require('./file_manager');
var access_control = require('./access_control');
var rest_apis = require('./rest_apis');
var logger = require('./logger');

// Server instance
var server = null;

module.exports = {

    // Initialise the server - callback(err) on error or init ok (err===null)
    init: function(config, callback) {
        // Initialise modules
        logger.init(config);
        database.init(config, logger);
        access_control.init(database, logger);

        // Initialise the file manager
        file_manager.init(config.file_directory, database, logger);

        // *************************************************
        // hapi.js initialisation
        // *************************************************

        // Create a server with 2 ports
        server = new Hapi.Server();
        var file_server  = server.connection({ host: 'localhost', address: '127.0.0.1', port: 3100, labels: ['files'] });
        var admin_server = server.connection({ host: 'localhost', address: '127.0.0.1', port: 3200, labels: ['admin'] });

        // Adds server.views() support via vision plugin
        server.register(Vision, function (err) {
            if (err) {
                logger.error("Failed to load hapi.js vision plugin.");
            }
        });
        // Adds file and directory handling support via inert plugin
        server.register(Inert, function (err) {
            if (err) {
                logger.error("Failed to load hapi.js inert plugin.");
            }
        });

        // Configure handlebars
        var engine = Handlebars.create();
        Layouts.register(engine);

        // Use handlebars for rendering views
        server.views({
          engines: {
            html: engine
          },
          relativeTo: __dirname,
          path: Path.join(__dirname, 'views'),
          partialsPath: Path.join(__dirname, 'views/partials')
        });

        // *************************************************
        // File server
        // *************************************************

        file_server.route({
            method: "GET",
            path: "/{category}/{filename*}",
            handler: function(request, reply) {
                var filename = request.params.filename;
                if (request.params.category && filename) {
                    access_control.isAllowed(request.params.category, filename, function(isAllowed) {
                        if (isAllowed) {
                            // optional query ?hash=md5 will return the MD5 sum of the
                            // requested file instead of the file itself.
                            if (request.query.hash === 'md5') {
                                database.getFile(filename, function(err, fileRecord) {
                                    if (err || (fileRecord === null)) {
                                        reply(Boom.notFound('error: MD5 unavailable'));
                                    }
                                    else {
                                        reply(fileRecord.md5).type('text/plain');
                                    }
                                });
                            }
                            else {
                                reply.file(config.file_directory+'/'+filename);
                            }
                        }
                        else {
                            reply(Boom.notFound());
                        }
                    });
                }
                else {
                    logger.log('Dodgy URL: '+request.params.category+' ,'+filename);
                    reply(Boom.notFound());
                }
            },
            config: {
                validate: {
                    params: {
                        // Validation of categories and filenames
                        category: Joi.string().regex(/^[a-zA-Z0-9_\-]+$/),
                        filename: Joi.string().regex(/^[a-zA-Z0-9_\-\s\.]+$/)
                    },
                    query: {
                        // Optional query 'hash' to return only checksum instead of file
                        hash: Joi.string().valid('md5')
                    },
                    failAction: function(request, reply, source, error) {
                        logger.log('URL validation fail: '+error);
                        // Don't give anything away on validation errors on the public interface
                        reply(Boom.notFound());
                    }
                }
            }
        });

        // Record successful downloads
        file_server.on('response', function (request) {
            // Don't bother logging robots.txt or favicon.ico requests
            if (request.path !== '/robots.txt' && request.path !== '/favicon.ico') {
                // Update the stats if the file was downloaded successfully
                if ((request.response.statusCode === 200) && (!request.query.hash)) {
                    access_control.downloaded(request.params.category, request.params.filename);
                }
                // Client IP address - support proxy
                var client = null;
                if (request.headers['x-forwarded-for']) {
                    // Store the X-Forwarded-For list for offline processing
                    client = request.headers['x-forwarded-for'];
                }
                else if (request.headers['x-real-ip']) {
                    client = request.headers['x-real-ip'];
                }
                else {
                    // For non-proxied requests
                    client = request.info.remoteAddress;
                }
                var info = { referrer: request.info.referrer, remote: client };
                logger.logDownload(request.params.category, request.params.filename, request.response.statusCode, info);
            }
        });

        // *************************************************
        // File server misc
        // *************************************************

        file_server.route({
            method: "GET",
            path: "/robots.txt",
            handler: function(request, reply) {
                // Build multi-line string
                var robots = [
                    'User-agent: *',
                    'Disallow: /',
                    ''
                ].join('\n');
                return reply(robots).type('text/plain');
            }
        });

        // Don't log any errors for favicon.ico requests
        file_server.route({
            method: "GET",
            path: "/favicon.ico",
            handler: function(request, reply) {
                return reply(Boom.notFound());
            }
        });

        // *************************************************
        // Admin web interface
        // *************************************************

        admin_server.route({
            method: "GET",
            path: "/{page?}",
            handler: function(request, reply) {
                var context = {};
                if (request.params.page) {
                    reply.view(request.params.page, context);
                }
                else {
                    reply.view("urls.html", context);
                }
            }
        });

        // Admin REST APIs
        rest_apis.init(admin_server, config, database, file_manager, logger);

        // Static content
        admin_server.route([
            { method: 'GET', path: '/public/{param}', handler: { directory: { path: 'public', listing: false } }},
            // Resources directly from the node_modules directory tree
            { method: 'GET', path: '/ag-grid/{param}', handler: { directory: { path: 'node_modules/ag-grid/dist', listing: false } }},
            { method: 'GET', path: '/fa/{param}', handler: { directory: { path: 'node_modules/font-awesome/css', listing: false } }},
            { method: 'GET', path: '/fonts/{param}', handler: { directory: { path: 'node_modules/font-awesome/fonts', listing: false } }},
            { method: 'GET', path: '/jquery/{param}', handler: { directory: { path: 'node_modules/jquery/dist', listing: false } }}
        ]);

        callback(null);
    },

    // Start the server - callback(err) on error or started ok (err===null)
    start: function(callback) {
        if (server) {
            // *************************************************
            // Add console logging and start server
            // *************************************************

            server.register({
                register: Good,
                options: {
                    // hapi.js connection logging just to console to avoid filling log files
                    reporters: [{
                        reporter: require('good-console'),
                        events: {
                            response: '*',
                            log: '*'
                        }
                    }]
                }
            }, function (err) {
                if (err) {
                    callback(err); // something bad happened loading the plugin
                }

                server.start(function (err) {
                    if (err) {
                        logger.error('Error starting server: '+err);
                        callback(err);
                    }
                    else {
                        var info = '';
                        for (var i=0; i<server.connections.length; i++) {
                            info += ('  ' + server.connections[i].info.uri);
                        }
                        logger.log('***** Server start, listening on:'+info+' *****');
                        callback(null);
                    }
                });
            });
        }
    },

    stop: function(callback) {
        if (server) {
            server.stop(function(err) {
                if (err) {
                    logger.error('Error stopping server: '+err);
                    callback(err);
                }
                else {
                    logger.log('***** Server stopped *****');
                    callback(null);
                }
            });
        }
    }

};
