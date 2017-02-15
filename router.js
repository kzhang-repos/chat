function Router(deps) {
    this.db = deps.db;
    this.app = deps.app;

    this.routing();
};

Router.prototype.routing = function routing() {
    var self = this;

    self.app.post('/reg', self.reg.bind(self));
    self.app.post('/auth', self.auth.bind(self));
    self.app.get('/logout', self.requireLogin.bind(self), self.logout.bind(self));
    self.app.get('/', self.requireLogin.bind(self));
};

//session middleware

Router.prototype.requireLogin = function requireLogin(req, res, next) {
    var self = this;

    if (req.session && req.session.username) {
        self.db.User.findOne({
            where: {username: req.session.username}
        }).then(function(user) {
            return next();
        }, function(err) {
            res.redirect('/login');
        });
    } else {
        res.redirect('/login');
    }
};

//register

Router.prototype.reg = function reg(req, res) {
    var self = this;
    
    self.db.User.create({
        username: req.body.username,
        password: req.body.password
    }).then(function(user) {
        if(user) {
            req.session.username = user.username;
        }
        else res.redirect('/register');
    }).then(function() {
        res.redirect('/'); 
    })
    .catch(function(err) {
        console.log(err);
        res.redirect('/register'); 
    });
};

//login

Router.prototype.auth = function auth(req, res) {
    var self = this;

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

Router.prototype.logout = function logout(req, res) {
    req.session.destroy();
    res.json('you have been logged out');
};

module.exports = Router;