/**
 * File server unit tests for the misc URLs. Uses mocha, chai and supertest.
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

 // Mocha assertions implemented by chai with array support and 'should' interface
 var chai = require('chai').use(require('chai-things')).should();

 // Connection to file server under test
 var file_server = require('supertest').agent("http://localhost:3100");

describe('misc URLs', function() {

    describe('get robots.txt', function() {
        it('should return 200 with correct file contents', function(done) {
            file_server
                .get('/robots.txt')
                .expect('Content-type', /text\/plain/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.text.should.equal('User-agent: *\nDisallow: /\n');
                    done();
                });
        });
    });

    describe('get favicon.ico', function() {
        it('should return 404', function(done) {
            file_server
                .get('/favicon.ico')
                .expect(404)
                .end(function(err, res) {
                    done(err);
                });
        });
    });
});
