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
        self.engine.addUser(self.username);

        self.socket.on('getChatHistory', self.onGetChatHistory.bind(self));
        self.socket.on('chatMessage', self.onChatMessage.bind(self));
        self.socket.on('saveReadStatus', self.onSaveReadStatus.bind(self));
        self.socket.on('typing', self.onTyping.bind(self));
        self.socket.on('doneTyping', self.onDoneTyping.bind(self));
        self.socket.on('disconnect', self.onDisconnect.bind(self));
    }).catch(function(err) {
        console.log(err);
    });
};

//get chat history for person chosen
Chatter.prototype.onGetChatHistory = function onGetChatHistory(data) {
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
                self.db.Channel.create({
                }).then(function(channel) {
                    self.db.User.findById(self.id
                    ).then(function(user){
                        user.addChannel(channel);
                    }).catch(function(err) {
                        console.log(err);
                    });

                    self.db.User.findById(data.id
                    ).then(function(user){
                        user.addChannel(channel);
                    }).catch(function(err) {
                        console.log(err);
                    });
                    
                    self.channel = channel.id;
                    self.engine.addChannel({socket: self.socket.id, channel: self.channel});
                }).catch(function(err) {
                    console.log(err);
                });
            } else {
                var channelId = channel[0].dataValues.ChannelId;
                //get chat history for this channel if there is a channel already
                self.db.Message.findAll({
                    where: {ChannelId: channelId},
                    include: [{model: self.db.User, required: true}],
                    order: [['createdAt', 'DESC']],
                    limit: 10,
                    offset: data.offset
                }).then(function(messages) {
                    self.channel = channelId;
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
        self.db.Message.findAll({
            where: {ChannelId: self.channel},
            include: [{model: self.db.User, required: true}],
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

    self.db.Message.create({
        msg: data.msg,
    }).then(function(message) {
        var time = message.createdAt.toString().substring(16, 21) + ' ' + message.createdAt.toString().substring(4, 10);

        self.channelToSockets[self.channel].forEach(function(socket) {
            self.socket.broadcast.to(socket).emit('chatMessage', {username: self.username, msg: message.msg, time: time});
        });

        self.db.Channel.find({where: {id: self.channel}
        }).then(function(channel) {
            channel.addMessage(message);
        }).catch(function(err) {
            console.log(err);
        });

        self.db.User.find({where: {id: self.id}
        }).then(function(user) {
            user.addMessage(message);
        }).catch(function(err) {
            console.log(err);
        });
    }).catch(function(err) {
        console.log(err);
    });
};

//notify online users in the same channel when user is typing
Chatter.prototype.onTyping = function onTyping(channel) {
    var self = this;

    self.channelToSockets[channel].forEach(function(socket) {
        if (socket !== self.socket.id) self.socket.broadcast.to(socket).emit('showTyping', self.username);
    });
};

Chatter.prototype.onDoneTyping = function oneDonTyping(channel) {
    var self = this;

    self.channelToSockets[channel].forEach(function(socket) {
        if (socket !== self.socket.id) self.socket.broadcast.to(socket).emit('showDoneTyping');
    });
};

//disconnect

Chatter.prototype.onDisconnect = function() {
    var self = this;

    self.engine.removeUser(self.username);
    self.engine.removeSocket({channel: self.channel, socket: self.socket.id});
};

module.exports = Chatter;