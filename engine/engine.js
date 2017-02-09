var Chatter = require('./chatter.js');

function Engine(deps) {
    var self = this;

    self.db = deps.db;
    self.io = deps.io;

    // maintain list of online users 
    self.usernames = [];
    //maintain list of sockets in a channel
    self.channelToSockets = {};
    
    self.io.sockets.on('connection', self.addChatter.bind(self));
};

Engine.prototype.addChatter = function addChatter(socket) {
    var self = this;
    var chatter = new Chatter({ socket: socket, db: self.db, engine: self });

    chatter.init();
};

Engine.prototype.addChannel = function addChannel(data) {
    self.channelToSockets[data.channel] = [] || self.channelToSockets[data.channel];
    self.channelToSockets[data.channel].push(data.socket);
};

Engine.prototype.removeSocket = function removeSocket(data) {
    var self = this;

    var index = self.channelToSockes[data.channel].indexOf(data.socket);
    self.channelToSockes[data.channel].splice(index, 1);
    if (self.channelToSockes[data.channel].length === 0) {
        delete self.channelToSockes[data.channel];
    };
};

Engine.prototype.addUser = function addUser(username) {
    var self = this;
    self.usernames.push(username);

    self.io.sockets.emit('updateUsers', self.usernames);
};

Engine.prototype.removeUser = function removeUser(username) {
    var self = this;
    index = self.usernames.indexOf(username);
    self.usernames.splice(index, 1);

    self.io.sockets.emit('updateUsers', self.usernames);
};

module.exports = Engine;





