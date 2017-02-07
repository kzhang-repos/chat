function Chatter(deps) {
    var self = this;

    self.id = null;
    self.username = null;

    self.db = deps.db;
    self.socket = deps.socket;
    self.engine = deps.engine;
};

Chatter.prototype.init = function init() {
    var self = this;

    self.username = self.socket.request.session.username;
    self.engine.addUser(self.username, self.socket.id);

    return self.db.User.find({
        where: {username: self.username}
    }).then(function(user) {
        self.id = user.id;

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
            SELECT uc1.id FROM   \
                User_Channel uc1, User_Channel uc2      \
                WHERE   uc1.UserId = :id1 AND           \
                        uc2.UserId = :id2 AND           \
                        uc1.ChannelId = uc2.ChannelId;  \
        ', { replacements: { id1: self.id, id2: data.id }, model: self.db.Channel })
        .then(function(channel) {
            if (!channel) {
                //create a channel if there is not one already createad
                self.db.Channel.create({
                }).then(function(channel){
                    channel.addUsers([self.id, data.id])
                    self.socket.emit('saveChannel', channel.id);
                }).catch(function(err) {
                    console.log(err);
                });
            } else {
                //get chat history for this channel if there is a channel already
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
            };
        }).catch(function(err) {
            console.log(err);
        });
    };
};

//save chat received

Chatter.prototype.onChatMessage = function onChatMessage(data) {
    var self = this;

    var date = new Date();
    var hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
    var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    var time = hours + ':' + minutes;

    //save message to DB
    self.db.Message.create({
        msg: data.msg
    }).then(function(message) {
        self.io.to(self.usernames[data.username]).to(self.socket.id).emit('chatMessage', {username: self.username, id: message.id, msg: data.msg, time: time});

        self.db.Channel.findById(data.channel)
        .then(function(channel) {
            channel.addMessage(message);
        }).catch(function(err) {
            console.log(err);
        });

        self.db.User.findById(self.id)
        .then(function(user) {
            user.addMessage(message);
        }).catch(function(err) {
            console.log(err);
        });
    }).catch(function(err) {
        console.log(err);
    });

    //update channel's last activity time
    self.db.Channel.update({
        where: {id: data.channel},
        updatedAt: self.db.fn('NOW')
    }).catch(function(err) {
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