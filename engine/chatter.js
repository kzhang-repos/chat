function Chatter(deps) {
    var self = this;

    self.id = null;
    self.username = null;
    self.channel = null;

    self.db = deps.db;
    self.socket = deps.socket;
    self.engine = deps.engine;
};

Chatter.prototype.init = function init() {
    var self = this;

    self.username = self.socket.request.session.username;

    return self.db.User.find({
        where: {username: self.username}
    }).then(function(user) {
        self.id = user.id;
        self.socket.emit('storeUsername', self.username);
    }).then(function() {
        self.engine.addUser({username: self.username, id: self.id});

        self.socket.on('chatHistory', self.onChatHistory.bind(self));
        self.socket.on('chatMessage', self.onChatMessage.bind(self));
        self.socket.on('typing', self.onTyping.bind(self));
        self.socket.on('doneTyping', self.onDoneTyping.bind(self));
        self.socket.on('disconnect', self.onDisconnect.bind(self));
    }).catch(function(err) {
        console.log(err);
    });
};

//get chat history for person chosen
Chatter.prototype.onChatHistory = function onChatHistory(data) {
    var self = this;

    if (!data.pagination) {
        //find if there is a channel for users
        self.db.sequelize.query(' \
            SELECT uc1.ChannelId FROM   \
                UserChannel uc1, UserChannel uc2      \
                WHERE   uc1.UserId = :id1 AND           \
                        uc2.UserId = :id2 AND           \
                        uc1.ChannelId = uc2.ChannelId;  \
        ', { replacements: { id1: self.id, id2: data.id }, model: self.db.Channel })
        .then(function(channel) {
            if (channel.length === 0) {
                //create a channel if there is not one already createad
                //make create channel and add users to channel a transaction

                var channelId; 

                self.db.sequelize.transaction(function(t) {
                    return self.db.Channel.create({
                    }, {transaction: t}).then(function(channel) {
                        channelId = channel.id;
                        return Promise.all([
                            self.db.User.findById(self.id,
                                {transaction: null}).then(function(user){
                                    user.addChannel(channel);
                                }, {transaction: t}),
                            self.db.User.findById(data.id, 
                                {transaction: null}).then(function(user){
                                    user.addChannel(channel);
                                }, {transaction: t}),

                        ]);
                    });
                }).then(function() {
                    self.channel = channelId;
                    console.log(self.channel);
                    self.engine.addChannel({socket: self.socket.id, channel: self.channel});
                }).catch(function(err) {
                    console.log(err);
                });
            } else {
                var channelId = channel[0].dataValues.ChannelId;
                //get chat history for this channel if there is a channel already
                //do not send password hash to client 
                self.db.Message.findAll({
                    where: {ChannelId: channelId},
                    include: [{
                        model: self.db.User,
                        attributes: {
                            exclude: ['password']
                        }
                    }],
                    order: [['createdAt', 'DESC']],
                    limit: 10,
                    offset: data.offset
                }).then(function(messages) {
                    self.channel = channelId;
                    console.log(self.channel);
                    self.engine.addChannel({socket: self.socket.id, channel: channelId});
                    self.socket.emit('chatHistory', messages);
                }).catch(function(err) {
                    console.log(err);
                });
            };
        }).catch(function(err) {
            console.log(err);
        });
    } else {
        //pagination 
        //do not send user password to frontend
        self.db.Message.findAll({
            where: {ChannelId: self.channel},
            include: [{
                        model: self.db.User, 
                        attributes: {
                            exclude: ['password']
                        }
                    }],
            order: [['createdAt', 'DESC']],
            limit: 10,
            offset: data.offset
        }).then(function(messages) {
            self.socket.emit('chatHistory', messages);
        }).catch(function(err) {
            console.log(err);
        });
    };
};

//save chat received

Chatter.prototype.onChatMessage = function onChatMessage(data) {
    var self = this;

    if (!data) return;

    if (!self.channel || !self.engine.channelToSockets || self.engine.channelToSockets[self.channel] === undefined) {
        return;
    };

    //make save message, and add message to user and channel a transaction
    var message;

    self.db.sequelize.transaction(function(t) {
        return self.db.Message.create({
            msg: data
            }, {transaction: t}).then(function(res) {
                message = res;
                return Promise.all([
                    self.db.Channel.find({where: {id: self.channel}
                    }, {transaction: null}).then(function(channel) {
                        channel.addMessage(res);
                    }, {transaction: t}),
                    self.db.User.find({where: {id: self.id}
                    }, {transaction: null}).then(function(user) {
                        user.addMessage(res);
                    }, {transaction: t})
                ])
            })
    }).then(function() {
        self.engine.channelToSockets[self.channel].forEach(function(socket) {
            self.socket.broadcast.to(socket).emit('chatMessage', {username: self.username, msg: message.msg});
        });
        self.socket.emit('chatMessage', {username: self.username, msg: message.msg});
    }).catch(function(err) {
        console.log(err);
    });
};

//notify online users in the same channel when user is typing
Chatter.prototype.onTyping = function onTyping() {
    var self = this;

    if (!self.channel || !self.engine.channelToSockets || self.engine.channelToSockets[self.channel] === undefined) {
        return;
    };

    self.engine.channelToSockets[self.channel].forEach(function(socket) {
        self.socket.broadcast.to(socket).emit('typing', self.username + ' is typing ...');
    });
};

Chatter.prototype.onDoneTyping = function oneDonTyping() {
    var self = this;

    if (!self.channel || !self.engine.channelToSockets || self.engine.channelToSockets[self.channel] === undefined) {
        return;
    };
    
    self.engine.channelToSockets[self.channel].forEach(function(socket) {
        self.socket.broadcast.to(socket).emit('doneTyping');
    });
};

//disconnect

Chatter.prototype.onDisconnect = function() {
    var self = this;

    self.engine.removeUser(self.username);
    self.engine.removeSocket({channel: self.channel, socket: self.socket.id});
};

module.exports = Chatter;