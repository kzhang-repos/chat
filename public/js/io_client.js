function App(deps) {
    this.username = null;
    this.friendUsername = null;
    this.channel = null;
    this.messagesCount = 0;
    this.usernames = [];
    this.usernameToUserId = {};

    this.socket = deps.socket;
};

App.prototype.setup = function() {
    this.setupUI();
    this.attachSocket();
}

App.prototype.setupUI = function() {
    var self = this;

    // hide messagebox
    $('#messages').hide();

    //keep scrollbar at bottom

    var out = $("#messages");
    var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;
    if(isScrolledToBottom)
        out.scrollTop = out.scrollHeight - out.clientHeight;

    //choose who to chat with

    $(document).one('click', '.buttons', function(){
        $('#messages').show();//unhide message box

        var chosenUsername = $(this).html();
        var chosenId = self.usernameToUserId[chosenUsername];

        //you cannot chat with yourself

        if (chosenId !== self.usernameToUserId[self.username]) {
            //bold the name of the friend chosen
            $(this).css('font-weight', 'bold');

            self.friendUsername = chosenUsername;

            //get chat history with the chosen friend
            self.socket.emit('getChatHistory', {offset: self.messagesCount, username: chosenUsername, id: chosenId, pagination: false});
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
        self.socket.emit('chatMessage', {msg: $('#msg').val(), channel: self.channel, username: self.friendUsername});
        $('#msg').val('');
        return false;
    });

    //show friend whether you are typing (if friend is still online)
    
    var timeouts = {};
    time = 2000;
    $('#conversation input').keyup(function(){
        var receiver = self.friendUsername;
        if (receiver in timeouts) clearTimeout(timeouts[receiver]); 
        else self.socket.emit("typing", receiver);
        
        timeouts[receiver] = setTimeout(function() {
            self.socket.emit("doneTyping", receiver);
            delete timeouts[receiver];
        }, time);
    });
};

App.prototype.attachSocket = function attachSocket() {
    var self = this;

    self.socket.on('storeUsername', self.onStoreUsername.bind(self));
    self.socket.on('saveChannel', self.onSaveChannel.bind(self));
    self.socket.on('updateUsers', self.onUpdateUsers.bind(self));
    self.socket.on('chatHistory', self.onChatHistory.bind(self));
    self.socket.on('chatMessage', self.onChatMessage.bind(self));
    self.socket.on('showTyping', self.onShowTyping.bind(self));
    self.socket.on('showDoneTyping', self.onShowDoneTyping.bind(self));
};

//save my username

App.prototype.onStoreUsername = function onStoreUsername(data) {
    var self = this;

    self.username = data.username;
    $('#welcome').empty();
    $('#welcome').append('<b>Welcome ' + self.username + '</b>');
};

//update active users everytime a new connection is established

App.prototype.onUpdateUsers = function onUpdateUsers(data) {
    var self = this;

    self.usernames = data.usernames;
    self.usernameToUserId = data.usernameToUserId;

    //check if the person you message is online and change message read/sent status accordingly
    $('#users').empty();
    $.each(self.usernames, function(key, value) {
        if (value !== self.username) {
            $('#users').append('<button class = "buttons" value = ' + value + '>' + value + '</button><br>');
            if (value == self.friendUsername) {
                $('#readStatus').empty();
                $('#readStatus').append('read');
            } 
        } else {
            $('#users').append('<button class = "buttons" disabled = true>' + value + '</button><br>');
        };
    });
};

//save channel id

App.prototype.onSaveChannel = function onSaveChannel(data) {
    this.channel = data;
};

//show chat history with the chosen user or after scrolling to top

App.prototype.onChatHistory = function onChatHistory(data) {
    var self = this;

    if (data.channel) {
        self.channel = data.channel;
    };
    
    var messages = data.messages;

    $.each(messages, function(key, value) {
        var username = value.User['username'];
        var time = value.createdAt.toString().substring(14, 19) + ' ' + value.createdAt.toString().substring(5, 10);
        $('.inner').prepend($('<li>').text(username + ': ' + value.msg + ' (' + time + ')'));

        self.messagesCount++;//increase pagination offset;

        $("#messages").scrollTop($("#messages")[0].scrollHeight);//keep scrollbar at bottom 
    });

    //if you sent the last message show whether it is read or update the other person's chat to 'read'
    if (data.pagination === false) {
        var lastMessage = messages[messages.length - 1];
        if (lastMessage.User['id'] === self.usernameToUserId[self.username]) {
            $('#readStatus').empty();
            $('#readStatus').append(lastMessage.read);
            $('#readStatus').val(lastMessage.read);
        } else {
            self.socket.emit('saveReadStatus', {id: lastMessage.id, read: 'read'})
        }
    }
};

//receive chat

App.prototype.onChatMessage = function onChatMessage(data) {
    var self = this; 

    $('.inner').append($('<li>').text(data.username + ': ' + data.msg + ' (' + data.time + ')'));

    self.messagesCount++;//pagination offset;

    $("#messages").scrollTop($("#messages")[0].scrollHeight);//keep scrollbar at bottom;

    //show whether your message has been read if you send the last message

    $('#readStatus').empty();
    
    if (data.username === self.username) {
        $('#readStatus').empty();
        $('#readStatus').append(data.read);
    } else {
        $('#readStatus').empty();
    };
};

//show whether friend is typing

App.prototype.onShowTyping = function onShowTyping(username) {
    $('#typingStatus').append(username + ' is typing ...');
};

App.prototype.onShowDoneTyping = function onShowDoneTyping() {
    $('#typingStatus').empty();
};

var app = new App({
    socket: io()
});

app.setup();