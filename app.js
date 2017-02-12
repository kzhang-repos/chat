module.exports = function createApp() {
    var Config = require('./config');
    var config = new Config();
    
    var express = require('express');
    var app = express();

    var http = require('http').Server(app);
    var io = require('socket.io')(http);
    var db = require('./db.js');
    var session = require('express-session');
    var bodyParser = require('body-parser')();
    var cookieParser = require('cookie-parser')();
    var RedisStore = require('connect-redis')(session);
    var sessionMiddleware = session({
        secret: config.get('session.secret'),
        store: new RedisStore({
            url: config.get('redis.url')
        })
    });


    app.set('port', config.get('port'));

    app.use(bodyParser);
    app.use(cookieParser);
    app.use(sessionMiddleware);

    var errorhandler = require('errorhandler')();

    if (app.get('env') === 'development') {
        app.use(errorhandler);
    };
    
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

    app.use(express.static('./public', {extensions: ['html']}));

    db.sequelize.sync(
    ).then(function() {
        console.log('db connected')
        http.listen(app.get('port'), function(){
            console.log('listening on *:3000');
        });
    }).catch(function(err){
        console.log(err);
    });

    return app;
};
