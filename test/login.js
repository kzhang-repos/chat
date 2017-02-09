var async = require('async'),
    request = require('supertest'),
    should = require('should'),
    app = require('../index.js'),
    db = require('../db.js');
 
describe('Req 1: Landing page functionality', function(){
  before(function (done) {
    this.timeout(5000);
    async.series([
      function (cb) {
        db.query('insert into Test '+
          'value("test","test");',function(err){
            done();
          });
      },
      function (cb) {
        db.query('select * from Test where username="test"'+
          ' and password="test";',function(err,results){
            results.length.should.not.equal(0);
            done();
          });
      }
    ], done);
  });
  it('1.1 Text of landing page', function(done){
    request(app)
      .get('/')
      .expect(200)
      .end(function (err, res) {
        res.text.should.include('test');
        done();
      });
  });
  it('1.2 Link to the login page', function(done){
    request(app)
      .get('/')
      .expect(200)
      .end(function (err, res) {
        res.text.should.include('/login');
        done();
      });
  });
});