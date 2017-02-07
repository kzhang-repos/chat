var Chatter = require('./chatter.js');

function Engine(deps) {
    var self = this;

    self.db = deps.db;
    self.io = deps.io;

    // maintain list of online users in here
    // Chatter will return new usernames to add to list
    self.usernameToSocketId = {};
    
    self.io.sockets.on('connection', self.addChatter.bind(self));
};

Engine.prototype.addChatter = function addChatter(socket) {
    var self = this;
    var chatter = new Chatter({ socket: socket, db: self.db, engine: self });

    chatter.init();
};

Engine.prototype.addUser = function addUser(username, socketId) {
    var self = this;
    self.usernameToSocketId[username] = socketId;
    self.io.sockets.emit('updateUsers', Object.keys(self.usernameToSocketId));
};

Engine.prototype.removeUser = function removeUser(username) {
    var self = this;
    delete self.usernameToSocketId[username];
    self.io.sockets.broadcast.emit('updateUsers', Object.keys(self.usernameToSocketId));
};

Engine.prototype.getSocketIdByUsername = function getSocketIdByUsername(username) {
    var self = this;
    return self.usernameToSocketId[username];
}

module.exports = Engine;





