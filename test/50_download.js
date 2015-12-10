/**
 * File server unit tests for the misc URLs. Uses mocha, chai and supertest.
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */
var md5 = require('md5');
var async = require('async');

 // Mocha assertions implemented by chai with array support and 'should' interface
 var chai = require('chai').use(require('chai-things')).should();

 // Connection to file server under test
 var file_server = require('supertest').agent("http://localhost:3100");
 // Connection to REST API server under test
 var admin_server = require('supertest').agent("http://localhost:3200");

 // Test file
 var test_file = 'test_file.txt';
 var test_file_contents = 'This is a small test file';
 var test_file_md5 = 0;
 // Test file record
 var test_file_record = {};

 // test category
 var test_category = {   _id: 'test_id',
                         name: 'test_category',
                         description: 'test category',
                         stats: {
                             num_downloads: 0
                         }
                     };

// test URL
var test_url = {   _id: 'test_id',
                    name: test_category.name+'/'+test_file,
                    category: test_category.name,
                    file: test_file,
                    description: 'unit test URL',
                    config: {
                        enabled: true,
                        count_remaining: null
                    },
                    stats: {
                        num_downloads: 0
                    }
                };


describe('downloading files', function() {

    // runs before all tests in this block
    before(function(done) {
        // Calculate the md5 sum of the test file contents
        test_file_md5 = md5(test_file_contents);

         async.waterfall([
             // Upoad the test file
             function(callback) {
                 admin_server
                     .post('/api/file/upload/'+test_file)
                     .set('Content-Type', 'application/octet-stream')
                     .send(test_file_contents)
                     .expect('Content-type', /json/)
                     .expect(200)
                     .end(function(err, res) {
                         callback(err);
                     });
             },

             // Create the test category
             function(callback) {
                 admin_server
                     .post('/api/category/'+test_category.name)
                     .send({ category: JSON.stringify(test_category) })
                     .expect('Content-type', /json/)
                     .expect(200)
                     .end(function(err, res) {
                         callback(err);
                     });
             },

             // Create the URL
             function(callback) {
                 admin_server
                     .post('/api/url/'+test_url.name)
                     .send({ url: JSON.stringify(test_url) })
                     .expect('Content-type', /json/)
                     .expect(200)
                     .end(function(err, res) {
                         callback(err);
                     });
             }

         ], function (err, result) {
             done(err);
         });
     });

    // runs after all tests in this block
    after(function(done) {
        async.waterfall([

            // Delete the test file
            function(callback) {
                admin_server
                    .delete('/api/file/'+test_file)
                    .expect(200)
                    .expect('Content-type', /json/)
                    .end(function(err, res) {
                        callback(err);
                    });
            },

            // Delete the test Category
            function(callback) {
                admin_server
                    .delete('/api/category/'+test_category.name)
                    .expect(200)
                    .expect('Content-type', /json/)
                    .end(function(err, res) {
                        callback(err);
                    });
            },

            // Delete the test url
            function(callback) {
                admin_server
                    .delete('/api/url/'+test_url.name)
                    .expect(200)
                    .expect('Content-type', /json/)
                    .end(function(err, res) {
                        callback(err);
                    });
            }

        ], function (err, result) {
            done(err);
        });

    });

     // Test cases

    describe('download test file', function() {
        it('should return 200 and the test file', function(done) {
            file_server
                .get('/'+test_category.name+'/'+test_file)
                .expect(200)
                .expect('Content-type', /text\/plain/)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.text.should.equal(test_file_contents);
                    done();
                });
        });
    });

    describe('query test file MD5 sum', function() {
        it('should return 200 and the test file MD5 sum', function(done) {
            file_server
                .get('/'+test_category.name+'/'+test_file+'?hash=md5')
                .expect(200)
                .expect('Content-type', /text\/plain/)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.text.should.equal(test_file_md5);
                    done();
                });
        });
    });

    describe('disable download of test file', function() {
        it('should return 404', function(done) {
            async.waterfall([

                function(callback) {
                    test_url.config.enabled = false;
                    admin_server
                        .post('/api/url/'+test_url.name)
                        .send({ url: JSON.stringify(test_url) })
                        .expect(200)
                        .expect('Content-type', /json/)
                        .end(function(err, res) {
                            callback(err);
                        });
                },

                function(callback) {
                    file_server
                        .get('/'+test_category.name+'/'+test_file)
                        .expect(404)
                        .expect('Content-type', /json/)
                        .end(function(err, res) {
                            callback(err);
                        });
                }

            ], function (err, result) {
                done(err);
            });
        });
    });

    describe('enable one download of test file', function() {
        it('should return 200 for first download, 404 for the second', function(done) {
            async.waterfall([

                function(callback) {
                    test_url.config.enabled = true;
                    test_url.config.count_remaining = 1;
                    admin_server
                        .post('/api/url/'+test_url.name)
                        .send({ url: JSON.stringify(test_url) })
                        .expect('Content-type', /json/)
                        .expect(200)
                        .end(function(err, res) {
                            callback(err);
                        });
                },

                function(callback) {
                    file_server
                        .get('/'+test_category.name+'/'+test_file)
                        .expect(200)
                        .expect('Content-type', /text\/plain/)
                        .end(function(err, res) {
                            if (err) return done(err);
                            res.text.should.equal(test_file_contents);
                            done();
                        });
                },

                function(callback) {
                    file_server
                        .get('/'+test_category.name+'/'+test_file)
                        .expect(404)
                        .expect('Content-type', /json/)
                        .end(function(err, res) {
                            callback(err);
                        });
                }

            ], function (err, result) {
                done(err);
            });
        });
    });

});
