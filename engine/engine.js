var Chatter = require('./chatter.js');

function Engine(deps) {
    var self = this;

    self.db = deps.db;
    self.io = deps.io;

    // maintain list of online users in here
    // Chatter will return new usernames to add to list
    self.usernameToSocketId = {};
    self.usernameToUserId = {};
    
    self.io.sockets.on('connection', self.addChatter.bind(self));
};

Engine.prototype.addChatter = function addChatter(socket) {
    var self = this;
    var chatter = new Chatter({ socket: socket, io: self.io, db: self.db, engine: self });

    chatter.init();
};

Engine.prototype.addUser = function addUser(username, socketId, userId) {
    var self = this;
    self.usernameToSocketId[username] = socketId;
    self.usernameToUserId[username] = userId;

    self.io.sockets.emit('updateUsers', {usernames: Object.keys(self.usernameToSocketId), usernameToUserId: self.usernameToUserId});
};

Engine.prototype.removeUser = function removeUser(username) {
    var self = this;
    delete self.usernameToSocketId[username];
    delete self.usernameToUserId[username];

    self.io.sockets.emit('updateUsers', {usernames: Object.keys(self.usernameToSocketId), usernameToUserId: self.usernameToUserId});
};

Engine.prototype.getSocketIdByUsername = function getSocketIdByUsername(username) {
    var self = this;
    return self.usernameToSocketId[username];
}

module.exports = Engine;





