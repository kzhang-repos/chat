function App(deps) {
    this.username = null;
    this.messagesCount = 0;
    this.usernames = [];

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

    //choose an active user to chat with

    $(document).one('click', '.activeUsers', function(){
        $('#messages').show();//unhide message box

        //user cannot chat with himself
        if (chosenUsername !== self.username) {
            $(this).css('font-weight', 'bold');

            //get chat history with the chosen user
            self.socket.emit('getChatHistory', {offset: self.messagesCount, id: chosenId, pagination: false});
            return false;
        };
    });

    //pagination

    $("#messages").scroll(function() {
        var div = $(this);
        if (div.scrollTop() == 0) {
            self.socket.emit('getChatHistory', {offset: self.messagesCount, pagination: true});
        }
    });

    //send chat

    $('#conversation').submit(function(){
        self.socket.emit('chatMessage', $('#msg').val());
        $('#msg').val('');
        return false;
    });

    //show the receiver whether the user is typing 
    
    time = 2000;
    $('#conversation input').keyup(function(){
        var receiver;
        if (receiver) clearTimeout(receiver); 
        else self.socket.emit("typing");
        
        receiver = setTimeout(function() {
            self.socket.emit("doneTyping");
            delete receiver;
        }, time);
    });
};

App.prototype.attachSocket = function attachSocket() {
    var self = this;
    
    self.socket.on('storeUsername', self.onStoreUsername.bind(self));  
    self.socket.on('updateUsers', self.onUpdateUsers.bind(self));
    self.socket.on('chatHistory', self.onChatHistory.bind(self));
    self.socket.on('chatMessage', self.onChatMessage.bind(self));
    self.socket.on('showTyping', self.onShowTyping.bind(self));
    self.socket.on('showDoneTyping', self.onShowDoneTyping.bind(self));
};

//save user username

App.prototype.onStoreUsername = function onStoreUsername(username) {
    var self = this;

    self.username = username;
    $('#welcome').empty();
    $('#welcome').append('<b>Welcome ' + self.username + '</b>');
};

//update active users everytime a new connection is established

App.prototype.onUpdateUsers = function onUpdateUsers(usernames) {
    var self = this;

    self.usernames = usernames;
};

//show chat history with the chosen user or after scrolling to top

App.prototype.onChatHistory = function onChatHistory(messages) {
    var self = this;
    
    $.each(messages, function(key, value) {

        var username = value.User['username'];
        var time = value.createdAt.toString().substring(11, 16) + ' ' + value.createdAt.toString().substring(5, 10);
        $('.inner').prepend($('<li>').text(username + ': ' + value.msg + ' (' + time + ')'));
            
        self.messagesCount++;//increase pagination offset;
        $("#messages").scrollTop($("#messages")[0].scrollHeight);//keep scrollbar at bottom 
    });
};

//receive chat

App.prototype.onChatMessage = function onChatMessage(data) {
    var self = this; 

    $('.inner').append($('<li>').text(data.username + ': ' + data.msg + ' (' + data.time + ')'));

    self.messagesCount++;//pagination offset;

    $("#messages").scrollTop($("#messages")[0].scrollHeight);//keep scrollbar at bottom;
};

//show whether someone in the channel is typing

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