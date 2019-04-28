/**
 * File server unit tests for the URL REST APIs.
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */
 var async = require('async');

 // Mocha assertions implemented by chai with array support and 'should' interface
 var chai = require('chai').use(require('chai-things')).should();

 // Connection to REST API server under test
 var server = require('supertest').agent("http://localhost:3200");

 // Test file
 var test_file = 'test_file.txt';
 var test_file_contents = 'This is a small test file';

 // test category
 var test_category = {   name: 'test_category',
                         description: 'test category',
                         stats: {
                             num_downloads: 0
                         }
                     };

// Test data
var test_url = {   _id: 'test_id',
                    name: 'test_category/test_url',
                    category: 'test_category',
                    file: 'test_file',
                    description: 'unit test URL',
                    config: {
                        enabled: true,
                        count_remaining: null
                    },
                    stats: {
                        num_downloads: 0
                    }
                };

describe('REST API: urls', function() {

    // runs before all tests in this block
    before(function(done) {
        // Need test file and category to be present before testing URLs
        async.waterfall([
            // Upoad the test file
            function(callback) {
                server
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
                server
                    .post('/api/category/'+test_category.name)
                    .send({ category: JSON.stringify(test_category) })
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

    after(function(done) {
        async.waterfall([

            // Delete the test file
            function(callback) {
                server
                    .delete('/api/file/'+test_file)
                    .expect(200)
                    .expect('Content-type', /json/)
                    .end(function(err, res) {
                        callback(err);
                    });
            },

            // Delete the test Category
            function(callback) {
                server
                    .delete('/api/category/'+test_category.name)
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

    // test cases

    describe('read URL prefix', function() {
        it('should return 200 and URL prefix string', function(done) {
            server
                .get('/api/url_prefix')
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('prefix');
                    done();
                });
        });
    });

    describe('create URL', function() {
        it('should return 200', function(done) {
            server
                .post('/api/url/'+test_url.name)
                .send({ url: JSON.stringify(test_url) })
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read URL', function() {
        it('should return 200 and the created test URL', function(done) {
            server
                .get('/api/url/'+test_url.name)
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    // deep equal compares the objects contents, not the actual object
                    res.body.should.deep.equal(test_url);
                    done();
                });
        });
    });

    describe('read URLs', function() {
        it('should return 200 and an array including test URL', function(done) {
            server
                .get('/api/urls')
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.contain.a.thing.that.deep.equals(test_url);
                    done();
                });
        });
    });

    describe('update URL', function() {
        // Modify the test category (keeping _id & name)
        test_url.description = 'modified';
        test_url.config.enabled = false;
        test_url.config.count_remaining = 3;

        it('should return 200', function(done) {
            server
                .post('/api/url/'+test_url.name)
                .send({ url: JSON.stringify(test_url) })
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read modified URL', function() {
        it('should return 200 and the modified test URL', function(done) {
            server
                .get('/api/url/'+test_url.name)
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    // deep equal compares the objects contents, not the actual object
                    res.body.should.deep.equal(test_url);
                    done();
                });
        });
    });

    describe('delete URL', function() {
        it('should return 200', function(done) {
            server
                .delete('/api/url/'+test_url.name)
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read URL', function() {
        it('should return 404 because the test URL no longer exists', function(done) {
            server
                .get('/api/url/'+test_url.name)
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read URLs', function() {
        it('should return 200 and an array no longer including test URL', function(done) {
            server
                .get('/api/urls')
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.not.contain.a.thing.that.deep.equals(test_url);
                    done();
                });
        });
    });

    describe('create URL with bad payload', function() {
        it('should return 422 Unprocessable Entity error', function(done) {
            server
                .post('/api/url/'+test_url.name)
                .send({ banana: JSON.stringify('bad data') })
                .expect('Content-type', /json/)
                .expect(422)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

});
