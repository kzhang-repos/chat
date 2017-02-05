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

//registration

app.get('/register', function(req, res, next) {
    res.sendFile(__dirname + '/public/register.html');
})

app.post('/reg', function(req, res) { 
    db.User.create({
        username: req.body.username,
        password: req.body.password
    }).then(function(user) {
        if(user) {
            req.session.username = user.username;
        }
        else res.json('user info cannot be saved to DB');
    }).then(function() {
        res.redirect('/'); 
    })
    .catch(function(err) {
        console.log(err);
        res.json('registration failed');
    });
});

//log in

app.get('/login', function(req, res) {
    res.sendFile(__dirname + '/public/login.html');
});

app.post('/auth', function(req, res) {
    db.User.findOne({
        where: {username: req.body.username}
    }).then(function(user){
        if (!user) {
            res.json('user does not exist');
        } else {
            user.authenticate(req.body.password, function(err, isValid) {
                if (err) res.json('wrong password');
                else {
                    req.session.username = user.username;
                    res.redirect('/');
                }
            })
        }
    }).catch(function(err) {
        res.json('incorrect log in info');
    });
});

//log out

app.get('/logout', requireLogin, function(req, res) {
    req.session.destroy();
    res.json('you have been logged out');
});

//get io connection page

app.get('/', requireLogin, function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/io_client', requireLogin, function(req, res){
  res.sendFile(__dirname + '/io_client.js');
});

//io connection

var usernames = {};

io.sockets.on('connection', function(socket){

    //new user connection
    
   socket.on('adduser', function() {
       socket.username = socket.request.session.username;
       var username = socket.username;
       usernames[username] = socket.id;
       
       //find people you recently chatted with
       db.Conversation.findAll({
            limit: 5,
            where: {$or: [{sender: socket.username}, {receiver: socket.username}]},
            order: [['createdAt', 'DESC']]
        }).then(function(entries) {
            if (entries === Array[0]) {
                socket.emit('recent chatters', []);
            } else {
                var list = [];
                entries.forEach((entry) => {
                    if (entry.sender === socket.username) {
                        if (list.indexOf(entry.receiver) === -1) {
                            list.push({username: entry.receiver});
                        }
                    } else if (entry.receiver === socket.username) {
                        if (list.indexOf(entry.sender) === -1) {
                            list.push({username: entry.sender});
                        }
                    };
                });
                db.User.findAll({
                    where: {$or: list}
                }).then(function(users) {
                    socket.emit('recent chatters', users);
                }).catch(function(err) {
                    console.log(err);
                });
            }
        }).catch(function(err) {
            console.log(err);
        });

       socket.emit('store_username', username);
       io.sockets.emit('updateusers', usernames);
   });

   //get chat history for person chosen

   socket.on('friend name', function(friend_name) {
       
       //get chat history for this channel
       db.Conversation.findAll({
            limit: 10,
            where: {$or: [{
                sender: socket.username,
                receiver: friend_name
            }, {receiver: socket.username,
            sender: friend_name}]},
            order: [['createdAt', 'DESC']]
        }).then(function(entries) {
            return entries.reverse();
        }).then(function(entries) {
            socket.emit('chat history', entries);
        }, function(err) {
            console.log(err);
        });

        db.Conversation.findAll({
            limit: 10,
            where: {$or: [{
                sender: socket.username,
                receiver: friend_name
            }, {receiver: socket.username,
            sender: friend_name}]},
            order: [['createdAt', 'DESC']]
        }).then(function(entries) {
            return entries.reverse();
        }).then(function(entries) {
            socket.emit('chat history', entries);
        }, function(err) {
            console.log(err);
        });
   });

   //get read status after log back in

   socket.on('get read status', function(data) {
       db.Read.find({
           where: {
               sender: data.sender,
               receiver: data.receiver
           }
       }).then(function(res) {
           socket.emit('show read status', res);
       });
   })

   //save chat received

   socket.on('chat message', function(data) {
       io.to(data.socket).to(socket.id).emit('chat message', {username: socket.username, msg: data.msg});

       db.Conversation.create({
           msg: data.msg,
           sender: socket.username,
           receiver: data.name
       }).then(function() {}, function(err) {
           console.log(err);
       });
   });

   //show typing status 

   socket.on('typing', function(data) {
       io.to(data.socket).emit('show typing', socket.username);
   });

   socket.on('done_typing', function(socket) {
       io.to(socket).emit('show done typing', {});
   });

   //save last chat read status when disconnect or when log back in and the sender(not self) is not online 
   socket.on('save read status', function(data) {
       db.Read.find({
           where: {
               sender: data.sender,
               receiver: data.receiver
           }
       }).then(function(res) {
           if (!res) {
               db.Read.create({
                   sender: data.sender,
                   receiver: data.receiver,
                   read: data.read
               }).catch(function(err) {
                   console.log(err);
               })
           } else {
               db.Read.update(
                   {read: data.read},
                   {where: {
                       sender: data.sender,
                       receiver: data.receiver
                   }}
               ).catch(function(err) {
                   console.log(err);
               })
           }
       }).catch(function(err) {
           console.log(err);
       })
   })

   //disconnect

   socket.on('disconnect', function() {
       delete usernames[socket.username];

       io.sockets.emit('updateusers', usernames);

       var date = new Date();
       var str = date.toString().substring(0, 21);

       db.User.update(
           {last_active: str},
           {where: {username: socket.username}}
       ).catch(function(err) {
           console.log(err);
       });
   })
});

//sync databases and establish connection
db.sequelize.sync().then(function() {
    console.log('db connected')
    http.listen(3000, function(){
        console.log('listening on *:3000');
    });
});


