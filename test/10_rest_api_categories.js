/**
 * File server unit tests for the category REST APIs. Uses mocha, chai and supertest.
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

 // Mocha assertions implemented by chai with array support and 'should' interface
 var chai = require('chai').use(require('chai-things')).should();

 // Connection to REST API server under test
 var server = require('supertest').agent("http://localhost:3200");

// Test data
var test_category = {   _id: 'test_id',
                        name: 'test_category',
                        description: 'test category',
                        stats: {
                            num_downloads: 0
                        }
                    };

describe('REST API: categories', function() {

    // runs before all tests in this block
    before(function(done) {
        // Ensure API server is running - should get a HTTP 200 response
        server
            .get('/api/categories')
            .expect('Content-type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });

    after(function() {
     // runs after all tests in this block
    });

    // test cases
    describe('create category', function() {
        it('should return 200', function(done) {
            server
                .post('/api/category/'+test_category.name)
                .send({ category: JSON.stringify(test_category) })
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read category', function() {
        it('should return 200 and the created test category', function(done) {
            server
                .get('/api/category/'+test_category.name)
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    // deep equal compares the objects contents, not the actual object
                    res.body.should.deep.equal(test_category);
                    done();
                });
        });
    });

    describe('read categories', function() {
        it('should return 200 and an array including test category', function(done) {
            server
                .get('/api/categories')
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.contain.a.thing.that.deep.equals(test_category);
                    done();
                });
        });
    });

    describe('update category', function() {
        // Modify the test category (keeping _id & name)
        test_category.description = 'modified';
        test_category.stats.num_downloads = 3;

        it('should return 200', function(done) {
            server
                .post('/api/category/'+test_category.name)
                .send({ category: JSON.stringify(test_category) })
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read modified category', function() {
        it('should return 200 and the modified test category', function(done) {
            server
                .get('/api/category/'+test_category.name)
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    // deep equal compares the objects contents, not the actual object
                    res.body.should.deep.equal(test_category);
                    done();
                });
        });
    });

    describe('delete category', function() {
        it('should return 200', function(done) {
            server
                .delete('/api/category/'+test_category.name)
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read category', function() {
        it('should return 404 because the test category no longer exists', function(done) {
            server
                .get('/api/category/'+test_category.name)
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

    describe('read categories', function() {
        it('should return 200 and an array no longer including test category', function(done) {
            server
                .get('/api/categories/')
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.not.contain.a.thing.that.deep.equals(test_category);
                    done();
                });
        });
    });

    describe('create category with bad payload', function() {
        it('should return 422 Unprocessable Entity error', function(done) {
            server
                .post('/api/category/'+test_category.name)
                .send({ banana: 'bad data' })
                .expect('Content-type', /json/)
                .expect(422)
                .end(function(err, res) {
                    if (err) return done(err);
                    done();
                });
        });
    });

});
