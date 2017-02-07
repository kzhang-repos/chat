function Engine(deps) {
    this.db = deps.db;
    this.io = deps.io;

    this.usernames = {};//username and socket id pair for all online users
    this.myId = null;//my userId
    this.myUsername = null;
};

Engine.prototype.attachSocket = function attachSocket() {
    self.socket.on('addUser', self.onAddUser.bind(self));
    self.socket.on('saveUsernames', self.onSaveUsernames.bind(self));
    self.socket.on('getChatHistory', self.onGetChatHistory.bind(self));
    self.socket.on('chatMessage', self.onChatMessage.bind(self));
    self.socket.on('saveReadStatus', self.onSaveReadStatus.bind(self));
    self.socket.on('typing', self.onTyping.bind(self));
    self.socket.on('doneTyping', self.onDoneTyping.bind(self));
    self.socket.on('disconnect', self.onDisconnect.bind(self));
};

//new user connection

Engine.prototype.onAddUser = function onAddUser(socket) {
    self.socket = self.socket.id;
    self.myUsername = socket.request.session.username;
    self.usernames[self.myUsername] = self.socket;

    self.db.User.find({
        where: {username: username}
    }).then(function(user) {
        self.myId = user.id;
    }).catch(function(err) {
        console.log(err);
    });

    socket.emit('storeUsername', {username: self.myUsername, id: self.myId});
    self.socket.broadcast.emit('updateUsers', self.usernames);
};

Engine.prototype.onSaveUsernames = function onSaveUsernames(data) {
    self.usernames = data;
};

//get chat history for person chosen

Engine.prototype.onGetChatHistory = function onGetChatHistory(data) {
    var self = this;

    self.friendId = data.id;
    self.friendUsername = data.username;
    self.friendSocket = data.socket;

    //if there is a known channel for pagination or because you chatted with friend before
    if (data.channel) {

    } else {
        //find if there is a channel for you and friend
        self.db.sequelize.query(' \
            SELECT uc1.id FROM   \
                User_Channel uc1, User_Channel uc2      \
                WHERE   uc1.UserId = :id1 AND           \
                        uc2.UserId = :id2 AND           \
                        uc1.ChannelId = uc2.ChannelId;  \
        ', { replacements: { id1: 1, id2: 6 }, model: self.db.Channel })
        .then(function(channel) {
            if (!channel) {
                //create a channel if there is not one already createad
                self.db.Channel.create({
                }).then(function(channel){
                    channel.addUsers([self.my])
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

//save chat received

Engine.prototype.onChatMessage = function onChatMessage(data) {
    var self = this;

    var date = new Date();
    var hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
    var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    var time = hours + ':' + minutes;

    self.io.to(self.usernames[data.username]).to(self.socket.id).emit('chatMessage', {username: self.myUsername, msg: data.msg, time: time});

    //save message to DB
    self.db.Message.create({
        msg: data.msg,
        time: time
    }).then(function(message) {
        self.db.Channel.findById(data.channel)
        .then(function(channel) {
            channel.addMessage(message);
        }).catch(function(err) {
            console.log(err);
        });

        self.db.User.findById(self.myId)
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

Engine.prototype.onSaveReadStatus = function onSaveReadStatus(data){
    var self = this;

    self.db.Message.update(
        {read: data.read},
        {where: {id: data.id}}
    ).catch(function(err) {
        console.log(err);
    })
};

//show whether I am typing 

Engine.prototype.onTyping = function onTyping() {
    var self = this;

    self.io.to(self.friendSocket).emit('showTyping', self.myUsername);
};

Engine.prototype.onDoneTyping = function oneDonTyping() {
    var self = this;

    self.io.to(self.friendSocket).emit('showeDonTyping', {});
};

//disconnect

Engine.prototype.onDisconnect = function() {
    var self = this;

    delete self.usernames[self.myUsername];

    self.socket.broadcast.emit('updateUsers', self.usernames);

    var date = new Date();
    var str = date.toString().substring(0, 21);

    self.db.User.update(
        {last_active: str},
        {where: {id: self.myId}}
    ).catch(function(err) {
        console.log(err);
    });
};