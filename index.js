var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var db = require('./db.js');
var session = require('express-session');
var bodyParser = require('body-parser')();
var cookieParser = require('cookie-parser')();
var RedisStore = require('connect-redis')(session);
var sessionMiddleware = session({secret: 'secret', store: new RedisStore({})});

app.use(bodyParser);
app.use(cookieParser);
app.use(sessionMiddleware);

var deps = {};
deps.db = db;
deps.io = io;

//session middleware

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
})

var requireLogin = function(req, res, next) {
    if (req.session && req.session.username) {
        db.User.findOne({
            where: {username: req.session.username}
        }).then(function(user) {
            return next();
        }, function(err) {
            return res.json('unauthorized access');
        });
    } else {
        return res.json('unauthorized access');
    }
};

var Router = require('./router.js');
var router = new Router();

app.get('/register', router.register.bind(router));
app.post('/reg', router.reg.bind(router));
app.get('/login', router.login.bind(router));
app.post('/auth', router.auth.bind(router));
app.get('/logout', requireLogin, router.logout.bind(router));
app.get('/', requireLogin, router.io.bind(router));
app.get('/ioclient', requireLogin, router.ioClient.bind(router));

//io connection

var Engine = require('/engine/engine.js');
var engine = new Engine(deps);

var usernames = {};

io.sockets.on('connection', function(socket){});

//sync databases and establish connection
db.sequelize.sync().then(function() {
    console.log('db connected')
    http.listen(3000, function(){
        console.log('listening on *:3000');
    });
});


