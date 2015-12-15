/**
 * File server application
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

var server = require('./server');
var config = require('./config');

// Start the server
server.init(config, function(err) {
    if (err) {
        console.error('Failed to configure file server: '+err);
    }
    else {
        server.start(function(err) {
            if (err) {
                console.error('Failed to start file server: '+err);
            }
        });
    }
});
