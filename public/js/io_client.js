function App(deps) {
    this.username = null;
    this.messagesCount = 0;

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

    //choose an active user to chat with. can only pick once.

    $(document).one('click', '.buttons', function(){
        $('#messages').show();//unhide message box
       
        $(this).css('font-weight', 'bold');

        var chosenId = $(this).attr('id');
        //get chat history with the chosen user
        self.socket.emit('chatHistory', {offset: 0, id: parseInt(chosenId), pagination: false});
        return false;
    });

    //pagination

    $("#messages").scroll(function() {
        var div = $(this);
        if (div.scrollTop() == 0) {
            self.socket.emit('chatHistory', {offset: self.messagesCount, pagination: true});
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
    self.socket.on('typing', self.onTyping.bind(self));
    self.socket.on('doneTyping', self.onDoneTyping.bind(self));
};

//save user username

App.prototype.onStoreUsername = function onStoreUsername(username) {
    var self = this;

    self.username = username;
    $('#welcome').empty();
    $('#welcome').append('<b>Welcome ' + self.username + '</b>');
};

//update active users everytime a new connection is established

App.prototype.onUpdateUsers = function onUpdateUsers(data) {
    var self = this;

     $('#users').empty();
     $.each(data.usernames, function(key, value) {		      
          if (value !== self.username) {
               $('#users').append('<button class = "buttons" id = ' + data.usernameToId[value]+ '>' + value + '</button><br>');
          } else {
               $('#users').append('<button class = "buttons" disabled = true>' + value + '</button><br>');
          };
     });
};

//show chat history with the chosen user or after scrolling to top

App.prototype.onChatHistory = function onChatHistory(messages) {
    var self = this;
    
    $.each(messages, function(key, value) {

        var username = value.User['username'];

        var convertedTime = moment.tz(value.createdAt.toString(), moment.tz.guess()).format(); 
        var time = convertedTime.substring(11, 16) + ' ' + convertedTime.substring(5, 10);

        $('.inner').prepend($('<li>').text(username + ': ' + value.msg + ' (' + time + ')'));
            
        self.messagesCount++;//increase pagination offset;
        $("#messages").scrollTop($("#messages")[0].scrollHeight);//keep scrollbar at bottom 
    });
};

//receive chat

App.prototype.onChatMessage = function onChatMessage(data) {
    var self = this; 

    var date = new Date();
    var hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
    var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    var time = hours + ':' + minutes;

    $('.inner').append($('<li>').text(data.username + ': ' + data.msg + ' (' + time + ')'));

    self.messagesCount++;//pagination offset;

    $("#messages").scrollTop($("#messages")[0].scrollHeight);//keep scrollbar at bottom;
};

//show whether someone in the channel is typing

App.prototype.onTyping = function onTyping(data) {
    $('#typingStatus').empty();
    $('#typingStatus').append(data);
};

App.prototype.onDoneTyping = function onDoneTyping() {
    $('#typingStatus').empty();
};

var app = new App({
    socket: io()
});

app.setup();