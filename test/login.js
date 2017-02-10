var async = require('async'),
    request = require('supertest'),
    should = require('should'),
    app = require('../index.js');
 
var Cookies;
 
describe('Functional Test <Sessions>:', function () {
  it('should create user session for valid user', function (done) {
    request(app)
      .post('/login')
      .set('Accept','application/json')
      .send({"username": "kate", "password": "1234"})
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        res.body.id.should.equal('1');
        res.body.email.should.equal('kate');
        // Save the cookie to use it later to retrieve the session
        Cookies = res.headers['set-cookie'].pop().split(';')[0];
        done();
      });
  });

  it('should get user session for current user', function (done) {
    var req = request(app).get('/login');
    // Set cookie to get saved user session
    req.cookies = Cookies;
    req.set('Accept','application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        res.body.id.should.equal('1');
        res.body.email.should.equal('kate');
        done();
      });
  });
});