/**
 * File server unit tests for the file REST APIs.
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */
var md5 = require('md5');

// Mocha assertions implemented by chai with array support and 'should' interface
var chai = require('chai').use(require('chai-things')).should();

// Connection to REST API server under test
var server = require('supertest').agent("http://localhost:3200");

// Test file
var test_file = 'test_file.txt';
var test_file_contents = 'This is a small test file';
var test_file_md5 = 0;
// Test file record
var test_file_record = {};

describe('REST API: files', function() {

    // runs before all tests in this block
    before(function(done) {
        // Calculate the md5 sum of the test file contents
        test_file_md5 = md5(test_file_contents);
        done();
    });

    after(function() {
     // runs after all tests in this block
    });

    // Test cases
    describe('upload test file', function() {
        it('should return 200', function(done) {
            server
                .post('/api/file/upload/'+test_file)
                .set('Content-Type', 'application/octet-stream')
                .send(test_file_contents)
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read file record', function() {
        it('should return 200 and the test file record', function(done) {
            server
                .get('/api/file/'+test_file)
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('name', test_file);
                    res.body.should.have.property('md5',  test_file_md5);
                    // Save the test file record (complete with _id) for /api/files testing
                    test_file_record = res.body;
                    done();
                });
        });
    });

    describe('read files', function() {
        it('should return 200 and an array including test file', function(done) {
            server
                .get('/api/files')
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.contain.a.thing.that.deep.equals(test_file_record);
                    done();
                });
        });
    });

    describe('delete file', function() {
        it('should return 200', function(done) {
            server
                .delete('/api/file/'+test_file)
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read file', function() {
        it('should return 404 because the test file no longer exists', function(done) {
            server
                .get('/api/file/'+test_file)
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read files', function() {
        it('should return 200 and an array no longer including test file', function(done) {
            server
                .get('/api/files')
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.not.contain.a.thing.that.deep.equals(test_file_record);
                    done();
                });
        });
    });

    describe('attempt to upload file with missing filename in path', function() {
        it('should return 400 Bad Request', function(done) {
            server
                // Missing file name
                .post('/api/file/upload/')
                .set('Content-Type', 'application/octet-stream')
                .send(test_file_contents)
                .expect('Content-type', /json/)
                .expect(400)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('attempt to upload file with bad path', function() {
        it('should return 404 Not Found for the bad URL path', function(done) {
            server
                // Missing file name
                .post('/api/file/upload/../bad.txt')
                .set('Content-Type', 'application/octet-stream')
                .send(test_file_contents)
                .expect('Content-type', /json/)
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

});
