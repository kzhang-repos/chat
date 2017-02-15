var Chatter = require('./chatter.js');

function Engine(deps) {
    var self = this;

    self.db = deps.db;
    self.io = deps.io;

    // maintain a list of the number of sockets each user has open
    self.usernames = {};
    //maintain a list of sockets in a channel
    self.channelToSockets = {};
    
    self.io.sockets.on('connection', self.addChatter.bind(self));
};

Engine.prototype.addChatter = function addChatter(socket) {
    var self = this;
    var chatter = new Chatter({ socket: socket, db: self.db, engine: self });

    chatter.init();
};

Engine.prototype.addChannel = function addChannel(data) {
    var self = this;

    if (!self.channelToSockets[data.channel]) {
        self.channelToSockets[data.channel] = [];
    };
    self.channelToSockets[data.channel].push(data.socket);
};

Engine.prototype.removeSocket = function removeSocket(data) {
    var self = this;

    if (!data.channel || !self.channelToSockets || self.channelToSockets[data.channel] === undefined) {
        return;
    };

    var index = self.channelToSockets[data.channel].indexOf(data.socket);
    self.channelToSockets[data.channel].splice(index, 1);
    if (self.channelToSockets[data.channel].length === 0) {
        delete self.channelToSockets[data.channel];
    };
};

Engine.prototype.addUser = function addUser(data) {
    var self = this;
    
    self.usernames[data.username] = self.usernames[data.username] || 0;
    self.usernames[data.username]++;

    self.io.sockets.emit('updateUsers', Object.keys(self.usernames));
};

Engine.prototype.removeUser = function removeUser(username) {
    var self = this;
    self.usernames[username]--;
    if (self.usernames[username] === 0) {
        delete self.usernames[username];
    };
    
    self.io.sockets.emit('updateUsers', Object.keys(self.usernames));
};

module.exports = Engine;





