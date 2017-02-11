var request = require('supertest');
var expect = require('expect.js');
   
var createApp = require('../app.js');
var app = createApp();

var db = require('../db.js');

var agent = request.agent(app);

describe('Registration page', function(){		 
      after(function(done) {
          db.User.destroy({
            where: {
              username: 'test'
            }
          }).then(function() {
            done();
          }, done);
      });

      it('/register: should deliver registration html page and redirect to /reg', function (done) {
        request(app)
            .get('/register')
            .expect('Content-Type', /html/)
            .expect(302)
            .expect('Location', '/reg')
            .end(function (err, res) {
                done();
          });
      });

      it('/reg: should validate user, save cookies, and redirect to io page', function (done) {
          agent
            .post('/reg')
            .type('form')
            .send({"username": "test", "password": "test"})
            .expect(302)
            .expect('Location', '/')
            .expect('set-cookie', /connect.sid/)
            .end(function(err, res) {
                if (err) return done(err);
                agent.jar.setCookie(res.headers['set-cookie'][0]);
                return done();
            });
      });

      it('/: should deliver html io page', function (done) {
          agent
            .get('/')
            .expect('test')
            .set('Accept','application/json')
            .expect('Content-Type', /html/)
            .expect(200)
            .end(function (err, res) {
                done();
            });
      });

      it('/logout: should destroy session and send logout message', function (done) {
          agent
            .get('/logout')
            .set('Accept','application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.equal('you have been logged out');
                done();
            });
      });
});

describe('Login page', function(){

      before(function (done) {		 
          db.User.create({
            username: 'test',
            password: 'test'
          }).then(function() {
            done();
          }, done);
      });

      after(function(done) {
          db.User.destroy({
            where: {
              username: 'test'
            }
          }).then(function() {
            done();
          }, done);
      });

      it('/login: should deliver login html page and redirect to /auth', function (done) {
        request(app)
            .get('/login')
            .expect('Content-Type', /html/)
            .expect(302)
            .expect('Location', '/auth')
            .end(function (err, res) {
                done();
          });
      });

      it('/auth: should validate user and redirect to io page', function (done) {
          agent
            .post('/auth')
            .type('form')
            .send({"username": "test", "password": "test"})
            .expect(302)
            .expect('Location', '/')
            .expect('set-cookie', /connect.sid/)
            .end(function(err, res) {
                if (err) return done(err);
                agent.jar.setCookie(res.headers['set-cookie'][0]);
                return done();
            });
        });

      it('/: should deliver html io page', function (done) {
          agent
            .get('/')
            .set('Accept','application/json')
            .expect('Content-Type', /html/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                done();
            });
      });

      it('/logout: should destroy session and send logout message', function (done) {
          agent
            .get('/logout')
            .set('Accept','application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.equal('you have been logged out');
                done();
            });
      });
});

