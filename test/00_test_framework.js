/**
 * File server mocha test framework
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

var fs = require('fs');
var path = require('path');
var should = require('chai').use(require('chai-things')).should();
// Connection to REST API server under test
var testClient = require('supertest').agent("http://localhost:3200");

var server = require('../server');

// Server test configuration
var config =  {
    // The directory in which the files for download are stored
    file_directory : './tmp/files',

    // The directory into which the access logs will be placed
    log_directory : './tmp/logs',

    // The file server database directory
    db_directory : './tmp/database',

    // The public server download URL prefix, for building URL previews
    public_url_prefix : 'http://localhost:3100'
};

var serverStartedByTest  = false;

// Helper function to synchronously delete a non-empty directory tree
deleteFolderRecursive = function(dir) {
    var files = [];
    if( fs.existsSync(dir) ) {
        files = fs.readdirSync(dir);
        files.forEach(function(file,index){
            var curPath = path.join(dir, file);
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dir);
    }
};

// ******************************************************************
// Use the mocha root root level hooks to prepare for tests
// and tear down afterwards. If either an exsiting server config
// file is present or a server is already running, use those so that
// these mocha tests can be run either against an existing server
// or a clean repository.
// ******************************************************************

before(function(done) {

    // If the server is already running with its own config, use
    // that for the tests, otherwise create a running server here
    testClient
        .get('/api/categories')
        .expect('Content-type', /json/)
        .expect(200)
        .end(function(err, res) {
            if (err) {
                // Server did not respond to API call

                // Create a clean temporary directory tree
                deleteFolderRecursive('./tmp');
                fs.mkdirSync('./tmp');
                fs.mkdirSync('./tmp/files');
                fs.mkdirSync('./tmp/logs');
                fs.mkdirSync('./tmp/database');
                testCreatedDirectory = true;

                console.log('starting server under test');
                server.init(config, function(err) {
                    should.not.exist(err);
                    server.start(function(err) {
                        should.not.exist(err);
                        serverStartedByTest = true;
                        done();
                    });
                });

            }
            else {
                console.log('server already running, using that one');
                done();
            }
        });
});

after(function(done) {
    // If the server was started by this framework, stop it now
    if (serverStartedByTest) {
        console.log('stopping server under test');
        server.stop(function(err) {
            should.not.exist(err);
            console.log('removing temporary test directories');
            // Delete the temporary test directories
            deleteFolderRecursive('./tmp');
            done();
        });
    }
    else {
        done();
    }
});
