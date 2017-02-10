var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var db = require('./db.js');
var session = require('express-session');
var bodyParser = require('body-parser')();
var cookieParser = require('cookie-parser')();
var RedisStore = require('connect-redis')(session);
var sessionMiddleware = session({secret: process.env['SESSION_SECRET'], store: new RedisStore({})});

app.use(bodyParser);
app.use(cookieParser);
app.use(sessionMiddleware);

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

var deps = {};
deps.db = db;
deps.io = io;
deps.app = app;

var Router = require('./router.js');
var router = new Router(deps);

var Engine = require('./engine/engine.js');
var engine = new Engine(deps);

app.use(express.static('./public'));

db.sequelize.sync(
).then(function() {
    console.log('db connected')
    http.listen(3000, function(){
        console.log('listening on *:3000');
    });
}).catch(function(err){
    console.log(err);
});


