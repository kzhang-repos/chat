function Router (deps) {
    this.db = deps.db;
};

Router.prototpye.register = function register(req, res) {
    res.sendFile(__dirname + '/public/register.html');
};

Router.prototype.reg = function reg(req, res) {
    self.db.User.create({
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
};

//log in

Router.prototype.login = function reg(req, res) {
    res.sendFile(__dirname + '/public/login.html');
};

Router.prototype.auth = function auth(req, res) {
    self.db.User.findOne({
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
};

//log out

Router.prototype.login = function login(req, res) {
    req.session.destroy();
    res.json('you have been logged out');
};

//get io connection page

Router.prototype.io = function io(req, res) {
    res.sendFile(__dirname + '/public/index.html');
};

Router.prototype.ioClient = function ioClient(req, res) {
    res.sendFile(__dirname + '/public/ioClient.js');
};
