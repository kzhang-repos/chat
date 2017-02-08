function Chatter(deps) {
    var self = this;

    self.id = null;
    self.username = null;

    self.db = deps.db;
    self.socket = deps.socket;
    self.engine = deps.engine;
    self.io = deps.io;
};

Chatter.prototype.init = function init() {
    var self = this;

    self.username = self.socket.request.session.username;

    return self.db.User.find({
        where: {username: self.username}
    }).then(function(user) {
        self.id = user.id;

        self.engine.addUser(self.username, self.socket.id, self.id);

        self.socket.emit('storeUsername', {username: self.username, id: self.id});
        
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

    //if there is a known channel for pagination or because you chatted with friend before
    if (data.channel) {
        self.db.Message.find({
                    where: {ChannelId: channel.id},
                    order: ['createdAt', 'DESC'],
                    limit: 10,
                    offset: data.offset
                }).then(function(messages) {
                    socket.emit('chatHistory', {messages: messages, pagination: data.pagination});
                }).catch(function(err) {
                    console.log(err);
                });
    } else {
        //find if there is a channel for you and friend
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
                        console.log(err);fn
                    });

                    self.socket.emit('saveChannel', channel.id);
                }).catch(function(err) {
                    console.log(err);
                });
            } else {
                var channelId = channel[0].dataValues.ChannelId;
                //get chat history for this channel if there is a channel already
                self.db.Message.find({
                    where: {ChannelId: channelId},
                    order: [['createdAt', 'DESC']],
                    limit: 10,
                    offset: data.offset
                }).then(function(messages) {
                    self.socket.emit('chatHistory', {messages: messages, channel: channelId, pagination: data.pagination});
                }).catch(function(err) {
                    console.log(err);
                });
            };
        }).catch(function(err) {
            console.log(err);
        });
    };
};

//save chat received

Chatter.prototype.onChatMessage = function onChatMessage(data) {
    var self = this;

    //save message to DB
    var readStatus = '';

    if (self.engine.getSocketIdByUsername(data.username)) {
        readStatus = 'read';
    } else {
        readStatus = 'sent';
    };

    self.db.Message.create({
        msg: data.msg,
        read: readStatus
    }).then(function(message) {
        self.io.to(self.engine.getSocketIdByUsername(data.username)).to(self.socket.id).emit('chatMessage', {username: self.username, msg: message.msg, read: message.read, time: message.createdAt.substring(11, 16)});

        self.db.Channel.find({where: {id: data.channel}
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

    //update channel's last activity time
    self.db.Channel.update(
        {updatedAt: self.db.sequelize.fn('NOW')},
        {where: {id: data.channel}}
    ).catch(function(err) {
        console.log(err);
    });
};

//save whether the message is read by receiver

Chatter.prototype.onSaveReadStatus = function onSaveReadStatus(data){
    var self = this;

    self.db.Message.update(
        {read: data.read},
        {where: {id: data.id}}
    ).catch(function(err) {
        console.log(err);
    });
};

// Let specific users know when chatter is typing
Chatter.prototype.onTyping = function onTyping(friendUsername) {
    var self = this;

    var socketId = self.engine.getSocketIdByUsername(friendUsername);

    // if socketId is missing, friend probably disconnected while we were typing to them,
    // don't need to send them notification
    if (!socketId) {
        return;
    }

    self.io.to(socketId).emit('showTyping', self.username);
};

Chatter.prototype.onDoneTyping = function oneDonTyping(friendUsername) {
    var self = this;

    var socketId = self.engine.getSocketIdByUsername(friendUsername);

    // if socketId is missing, friend probably disconnected while we were typing to them,
    // don't need to send them notification
    if (!socketId) {
        return;
    }    

    self.io.to(socketId).emit('showDoneTyping');
};

//disconnect

Chatter.prototype.onDisconnect = function() {
    var self = this;

    self.engine.removeUser(self.username);

    var date = new Date();
    var str = date.toString().substring(0, 21);

    self.db.User.update(
        {last_active: str},
        {where: {id: self.id}}
    ).catch(function(err) {
        console.log(err);
    });
};

module.exports = Chatter;