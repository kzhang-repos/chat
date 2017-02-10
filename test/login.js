var async = require('async');
var request = require('supertest');
var should = require('should');
   
var createApp = require('../app.js');
var app = createApp();

var db = require('../db.js');
 
// var Cookies;
 
// describe('Functional Test <Sessions>:', function () {
//   it('should create user session for valid user', function (done) {
//     request(app)
//       .post('/login')
//       .set('Accept','application/json')
//       .send({"username": "kate", "password": "1234"})
//       .expect('Content-Type', /json/)
//       .expect(200)
//       .end(function (err, res) {
//         res.body.id.should.equal('1');
//         res.body.email.should.equal('kate');
//         // Save the cookie to use it later to retrieve the session
//         Cookies = res.headers['set-cookie'].pop().split(';')[0];
//         done();
//       });
//   });

//   it('should get user session for current user', function (done) {
//     var req = request(app).get('/login');
//     // Set cookie to get saved user session
//     req.cookies = Cookies;
//     req.set('Accept','application/json')
//       .expect('Content-Type', /json/)
//       .expect(200)
//       .end(function (err, res) {
//         res.body.id.should.equal('1');
//         res.body.email.should.equal('kate');
//         done();
//       });
//   });
// });

describe('Req 1: Landing page functionality', function(){		 
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

  //  it('1.1 Text of landing page', function(done){		
  //     request(app)		      
  //      .get('/')
  //       .expect(200)
  //       .end(function (err, res) {
  //         console.log('err:', err, res.text.should);
  //        res.text.should.include('test');		
  //         done();		          
  //       });		        
  //   });	

  //  it('1.2 Link to the login page', function(done){		 
  //    request(app)		 
  //     .get('/')		 
  //     .expect(200)		        
  //     .end(function (err, res) {		                	
  //         res.text.should.include('/login');
  //         done();		          
  //       });		       
  //   });
});