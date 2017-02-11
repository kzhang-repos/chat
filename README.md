# Summary

This API uses an authenticated socket.io connection to support one to one chat between online users.

1. Endpoints

Once the server is run, it will create an instance of socket.io.
When the user creates a user account via /register, the server will verify whether the username and password is valid per the DB model specification.
When the user logs in via /login, the server will verify if the username and password exist in the DB. If so, it will create a valid session for the user, and the session is saved to Redis.
The user will then be redirected to the io page.  

2. Socket connections

When the user is redirected to the socket io page, the server will creates an instance of the chatter (which belongs to the class Engine).

Everytime a new socket is connected or disconnected, the Engine class will create a new updated list of all socket's usernames and send it to all sockets and emit the event 'updateUsers'.

3. Chat history 

Once the user clicks an online user button, the client will trigger an event 'chatHistory'.
Upon receiving 'chatHistory', the server will search the database to verify if there is a channel already established between the user and the chosen user.
If there is a channel already, the server will retrieve the most recent 10 messages in chronological order and send it back to the client.
If there is not one, the server will create a channel for these users.

If the user scrolls to the top of the chat message window, the client will trigger an event "chatHistory" and send the offset for pagination purpose to the server, which will retrieve 10 older messages and emit it back to the client with the event 'chatHistory'.

very message being sent to the client, either through 'chatHistory' or 'chatMessage', will increase the counter for offset for pagination purposes. 

4. Chat message

If the 'conversation' form is submitted, the client will emit a 'chatMessage' event to the server and sends the message entered along. If the message entered is not null, the server will emit 'chatMessage' event and send the message to all sockets in the channel. 
Upon receiveing 'chatMessage' event, the client will present the message on the UI. 

5. Typing notification

Upon 'keyup' of the input box in the 'conversion' form, the client will emit an event 'typing' to the server, which will in turn emit the event 'typing' along with the socket's username to the other socket in the channel.
If the user has not typed for more than 2 seconds, the client will emit an event 'doneTyping' to the server, which will in turn emit the event 'doneTyping' along with to the other socket in the channel.

6. Potential extensions

Though the API only allows one to one chat between online users, it can be easily extended to support group chat and offline messaging.
Additionally, this API only works on a single server. However, it can run multiple socket.io instances in different processes or servers by using the socket.io-redis adapter.

# Technologies

node.js
Redis
MySQL
socket.io

Testing frameworks:
Mocha
Expect
Supertest

# Demo

