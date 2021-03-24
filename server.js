const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/msgs');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set static folder
const staticDirectory = path.join(__dirname, 'public');

//Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //Welcomes user
        socket.emit('message', formatMessage('ChatCordBot', 'Welcome to ChatCord!'));

        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage('ChatCordBot', `${user.username} has joined the chat`));
        //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });



    //listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage('ChatCordBot', `${user.username} has left the chat`));
        }

        //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });


});

app.use(express.static(staticDirectory));
const port = 3000 || process.env.PORT;

server.listen(port, () => {
    console.log('Server running on ' + port)
})