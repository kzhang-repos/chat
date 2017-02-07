function Engine(deps) {
    this.db = deps.db;
    this.io = deps.io;

    this.usernames = {};
    this.myId = null;
    this.username = null;
    this.channel = null;
};

App.prototype.attachSocket = function attachSocket(socket) {
    socket.on('addUser', self.onAddUser.bind(self));
    socket.on('getChatHistory', self.onGetChatHistory.bind(self));
};

//new user connection

App.prototype.onAddUser = function onAddUser(socket) {
    socket.username = socket.request.session.username;
    self.username = socket.username;
    self.usernames[username] = socket.id;

    self.db.User.find({where: {username: username}
    }).then(function(user) {
        self.myId = user.id;
    }).catch(function(err) {
        console.log(err);
    });

    socket.emit('storeUsername', {username: self.username, id: self.myId});
    self.io.sockets.emit('updateUsers', self.usernames);
};

//get chat history for person chosen

App.prototype.onGetChatHistory = function onGetChatHistory(data) {
       var pagination = data.pagination;

       //get chat history for this channel
       db.Conversation.findAll({
            limit: 10,
            offset: data.offset,
            where: {$or: [{
                sender: socket.username,
                receiver: data.name
            }, {receiver: socket.username,
            sender: data.name}]},
            order: [['createdAt', 'DESC']]
        }).then(function(entries) {
            socket.emit('chat history', {entries: entries, pagination: pagination});
        }, function(err) {
            console.log(err);
        });
   });

   //get read status after log back in

   socket.on('get read status', function(data) {
       db.Read.find({
           where: {
               sender: data.sender,
               receiver: data.receiver
           }
       }).then(function(res) {
           socket.emit('show read status', res);
       });
   })

   //save chat received

   socket.on('chat message', function(data) {
        var date = new Date();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var time = hours + ':' + minutes;

       io.to(data.socket).to(socket.id).emit('chat message', {username: socket.username, msg: data.msg, time: time});

       db.Conversation.create({
           msg: data.msg,
           sender: socket.username,
           receiver: data.name,
           time: time
       }).then(function(message) {}, function(err) {
           console.log(err);
       });
   });

   //show typing status 

   socket.on('typing', function(data) {
       io.to(data.socket).emit('show typing', socket.username);
   });

   socket.on('done_typing', function(socket) {
       io.to(socket).emit('show done typing', {});
   });

   //save last chat read status when disconnect or when log back in and the sender(not self) is not online 
   socket.on('save read status', function(data) {
       db.Read.find({
           where: {
               sender: data.sender,
               receiver: data.receiver
           }
       }).then(function(res) {
           if (!res) {
               db.Read.create({
                   sender: data.sender,
                   receiver: data.receiver,
                   read: data.read
               }).catch(function(err) {
                   console.log(err);
               })
           } else {
               db.Read.update(
                   {read: data.read},
                   {where: {
                       sender: data.sender,
                       receiver: data.receiver
                   }}
               ).catch(function(err) {
                   console.log(err);
               })
           }
       }).catch(function(err) {
           console.log(err);
       })
   })

   //disconnect

   socket.on('disconnect', function() {
       delete usernames[socket.username];

       io.sockets.emit('updateusers', usernames);

       var date = new Date();
       var str = date.toString().substring(0, 21);

       db.User.update(
           {last_active: str},
           {where: {username: socket.username}}
       ).catch(function(err) {
           console.log(err);
       });
   })