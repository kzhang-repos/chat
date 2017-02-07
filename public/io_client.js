function App(deps) {
    this.myUsername = null;
    this.myId = null;
    this.friendId = null;
    this.friendUsername = null;
    this.friendSocket = null;
    this.channel = null;
    this.messagesCount = null;

    this.socket = deps.socket;
};

App.prototype.setup = function() {
    this.setupUI();
    this.attachSocket();
}

App.prototype.setupUi = function() {
    var self = this;

    //keep scrollbar at bottom

    var out = $("#messages");
    var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;
    if(isScrolledToBottom)
        out.scrollTop = out.scrollHeight - out.clientHeight;

    //choose who to chat with

    $(document).on('click', '.buttons', function(){

        var chosenId = $(this).attr('id');
        var chosenUsername = $(this).html();

        //you cannot chat with yourself

        if (chosenId !== self.myId) {
            $('#chatBox').append('<ul id="messages" style="width: 200px; height: 150px; overflow: auto;"><div class = inner></div></ul>');
            
            //bold the name of the friend chosen
            $(this).css('font-weight', 'bold');

            self.friendId = chosenId;
            self.friendUsername = chosenUsername;
            self.friendSocket = self.usernames[self.friendUsername].socket;

            //get chat history with the chosen friend
            self.socket.emit('getChatHistory', {offset: self.messagesCount, id: self.friendId, pagination: false});
            return false;
        };
    });

    //pagination

    $("#messages").scroll(function() {
        var div = $(this);
        if (div.scrollTop() == 0) {
            self.socket.emit('getChatHistory', {offset: self.messagesCount, channel: self.channel, pagination: true});
        }
    });

    //send chat

    $('#conversation').submit(function(){
        self.socket.emit('chatMessage', {msg: $('#msg').val(), channel: self.channel, socket: self.friendSocket});
        $('#msg').val('');
        return false;
    });

    //show friend whether you are typing (if friend is still online)

    if (self.usernames[self.friendId]) {
        var timeouts = {};
        time = 2000;
        $('#conversation input').keyup(function(){
            var receiver = self.friendSocket;
            if (receiver in timeouts) clearTimeout(timeouts[receiver]); 
            else self.socket.emit("typing", {socket: receiver, username: self.friendUsername});
            
            timeouts[receiver] = setTimeout(function() {
                self.socket.emit("doneTyping", receiver);
                delete timeouts[receiver];
            }, time);
        });
    };
};

App.prototype.attachSocket = function attachSocket() {
    var self = this;

    self.socket.on('connect', self.onConnect.bind(self));
    self.socket.on('storeUsername', self.onStoreUsername.bind(self));
    self.socket.on('updateUsers', self.onUpdateUsers.bind(self));
    self.socket.on('chatHistory', self.onChatHistory.bind(self));
    self.socket.on('showReadStatus', self.onShowReadStatus.bind(self));
    self.socket.on('chatMessage', self.onChatMessage.bind(self));
    self.socket.on('showTyping', self.onShowTyping.bind(self));
    self.socket.on('showDoneTyping', self.onShowDoneTyping.bind(self));
    self.socket.on('disconnect', self.onDisconnect.bind(self));
};

//new user connection notification

App.prototype.onConnect = function onConnect(socket) {
    self.socket.emit('adduser', {});
}

//save my username

App.prototype.onStoreUsernameId = function onStoreUsername(data) {
    var self = this;

    self.myUsername = data.username;
    self.myId = data.id;
    $('#welcome').append('<b>Welcome ' + username + '</b>');
};

//update active users everytime a new connection is established

App.prototype.onUpdateUsers = function onUpdateUsers(data) {
    var self = this;

    self.usernames = data;

    //check if the person you message is online and change message read/sent status accordingly
    $('#users').empty();
    $.each(Object.keys(data), function(key, value) {
        $('#users').append('<button class = "buttons" value = ' + value.username + ' id = ' + value.id + '>' + value.username + '</button><br>');
        if (value.id == self.friendId) {
            $('#readStatus').empty();
            $('#readStatus').append('read');
        }
    });
};

//show chat history with the chosen user or after scrolling to top

App.prototype.onChatHistory = function onChatHistory(data, socket) {
    var self = this;

    $.each(entries, function(key, value) {
        $('.inner').prepend($('<li>').text(value.username + ': ' + value.msg + ' (' + value.time + ')'));

        self.messagesCount++;//increase pagination offset;

        $("#messages").scrollTop($("#messages")[0].scrollHeight);//keep scrollbar at bottom 
    });

    //if you sent the last message show whether it is read or update the other person's chat to 'read'
    if (data.pagination === false) {
        var lastChatter = data[data.length - 1].id;
        if (lastChatter === self.myId) {
            self.socket.emit('getReadStatus', {id: data.id});
        } else {
            self.socket.emit('saveReadStatus', {id: data.id, read: 'read'})
        }
    }
};

//show read status after log back in

App.prototype.onShowReadStatus = function onShowReadStatus(data) {
    $('#readStatus').empty();
    $('#readStatus').append(data.read);
    $('#readStatus').val(data.read);
};

//receive chat

App.prototype.onChatMessage = function onChatMessage(data, socket) {
    var self = this; 

    $('.inner').append($('<li>').text(data.username + ': ' + data.msg + ' (' + data.time + ')'));

    messages_count++;//pagination offset;

    $("#messages").scrollTop($("#messages")[0].scrollHeight);//keep scrollbar at bottom;

    //show whether your message has been read if you send the last message

    $('#readStatus').empty();
    var lastChatter = data.username;
    if (lastChatter === self.myUsername) {
        if (!self.usernames[self.friendUsername]) {
            if (!$('#readStatus').val()) {
                $('#readStatus').empty();
            }
                $('#readStatus').append('sent');
                $('#readStatus').val('sent');
        } else {
            if (!$('#readStatus').val()) {
                $('#readStatus').empty();
            }
                $('#readStatus').append('read');
                $('#readStatus').val('read');
        }
        self.socket.emit('saveReadStatus', {id: data.id, read: $('#read_status').val()});
    } else {
        $('#readStatus').empty();
    };
};

//show whether friend is typing

App.prototype.onShowTyping = function onShowTyping(username) {
    $('#typingStatus').append(username + ' is typing ...');
};

App.prototype.onShowDoneTyping = function onShowDoneTyping () {
    $('#typingStatus').empty();
};

//disconnect

App.prototype.onDisconnect = function onDisconnect () {
    $('#messages').append($('<li>').text(msg));
};

module.exports = App;

var app = new App({
    socket: io()
});

app.setup();