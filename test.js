socket.on('updateusers', function(data) {
    usernames = data;
    $('#users').empty();
    $.each(Object.keys(data), function(key, value) {
        $('#users').append('<button class = "buttons" onclick = "choose_friend()" value = value>' + value + '</button><br>');
    });
});

//show people you recently chatted with

socket.on('recent chatters', function(res) {
    $.each(res, function(key, value) {
        $('#chatters').append('<button class = "buttons" onclick = "choose_friend()" value = value.username>' + value.username + ' (last active: ' + value.last_active + ') </button><br>');
    });
});

//choose who to chat with

function choose_friend(){
    $(this).css('font-weight', 'bold');
    people_to_chat = $(this).val();
    people_to_chat_id = usernames[people_to_chat];
    socket.emit('friend name', people_to_chat);
};