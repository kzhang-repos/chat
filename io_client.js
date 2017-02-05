
var my_username = '';
var people_to_chat = '';
var people_to_chat_socket;
var usernames;
var last_chat_sender;
var messages_count = 0;


var out = $("#messages");
var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;
if(isScrolledToBottom)
    out.scrollTop = out.scrollHeight - out.clientHeight;

var socket = io();

//new user connection notification

socket.on('connect', function() {
    socket.emit('adduser', {});
});

//save my username

socket.on('store_username', function(username) {
    my_username = username;
    $('#welcome').append('<b>Welcome ' + my_username + '</b>');
});

//update active users everytime a new connection is established

socket.on('updateusers', function(data) {
    usernames = data;
    $('#users').empty();
    $.each(Object.keys(data), function(key, value) {
        $('#users').append('<button class = "buttons" value = ' + value + '>' + value + '</button><br>');
        if (value == people_to_chat) {
            $('#read_status').empty();
            $('#read_status').append('read');
        }
    });
});

//show people you recently chatted with

socket.on('recent chatters', function(res) {
    $.each(res, function(key, value) {
        $('#chatters').append('<button class = "buttons" value = ' + value.username + '>' + value.username + '</button> (last active: ' + value.last_active + ')<br>');
    });
});

//choose who to chat with

$(document).on('click', '.buttons', function(){
     $(this).css('font-weight', 'bold');
    people_to_chat = $(this).val();
    people_to_chat_id = usernames[people_to_chat];
    socket.emit('get chat history', {offset: messages_count, name: people_to_chat, pagination: false});
    return false;
});

//show chat history with the chosen user or after scrolling to top

socket.on('chat history', function(data) {
    entries = data.entries;
    $.each(entries, function(key, value) {
        $('.inner').prepend($('<li>').text(value.sender + ': ' + value.msg + ' (' + value.time + ')'));

        messages_count++;//pagination offset;

        $("#messages").scrollTop($("#messages")[0].scrollHeight);//keep scrollbar at bottom 
    });
    //get own read status or update the other person's read status
    if (data.pagination === false) {
        var last_chatter = entries[entries.length - 1].sender;
        if (last_chatter === my_username) {
            socket.emit('get read status', {sender: my_username, receiver: people_to_chat});
        } else {
            socket.emit('save read status', {sender: people_to_chat, receiver: my_username, read: 'read'})
        }
    }
});

//show read status after log back in

socket.on('show read status', function(data) {
    $('#read_status').empty();
    $('#read_status').append(data.read);
    $('#read_status').val(data.read);
});

//send and receive chat

$('#conversation').submit(function(){
    socket.emit('chat message', {msg: $('#msg').val(), name: people_to_chat, socket: people_to_chat_id});
    $('#msg').val('');
    return false;
});

socket.on('chat message', function(data){

    $('.inner').append($('<li>').text(data.username + ': ' + data.msg + ' (' + data.time + ')'));

    messages_count++;//pagination offset;

    $("#messages").scrollTop($("#messages")[0].scrollHeight);//keep scrollbar at bottom;

    //read notification

    $('#read_status').empty();
    last_chat_sender = data.username;
    if (last_chat_sender === my_username) {
        if (!usernames[people_to_chat]) {
            if (!$('#read_status').val()) {
                $('#read_status').empty();
            }
                $('#read_status').append('sent');
                $('#read_status').val('sent');
        } else {
            if (!$('#read_status').val()) {
                $('#read_status').empty();
            }
                $('#read_status').append('read');
                $('#read_status').val('read');
        }
         socket.emit('save read status', {sender: my_username, receiver: people_to_chat, read: $('#read_status').val()});
    } else {
        $('#read_status').empty();
    }
});

//pagination

$("#messages").scroll(function() {
    var div = $(this);
    if (div.scrollTop() == 0) {
        socket.emit('get chat history', {offset: messages_count, name: people_to_chat, pagination: true});
    }
});

//transmit and receive typing status

var timeouts = {},
time = 2000;
$('#conversation input').keyup(function(){
    var receiver = people_to_chat_id;
    if (receiver in timeouts) clearTimeout(timeouts[receiver]); 
    else socket.emit("typing", {socket: receiver, username: people_to_chat});
    
    timeouts[receiver] = setTimeout(function() {
        socket.emit("done_typing", receiver);
        delete timeouts[receiver];
    }, time);
});

socket.on('show typing', function(username) {
    $('#typing_status').append(username + ' is typing ...');
});

socket.on('show done typing', function() {
    $('#typing_status').empty();
});

//disconnect

socket.on('disconnect', function(msg){
    $('#messages').append($('<li>').text(msg));
});