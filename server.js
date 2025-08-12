const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};

io.on('connection', (socket) => {
    console.log('Ny användare anslöt');

    socket.on('joinRoom', ({ roomCode, name }) => {
        socket.join(roomCode);
        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [], leader: socket.id };
        }
        rooms[roomCode].players.push({ id: socket.id, name });
        io.to(roomCode).emit('playerList', rooms[roomCode].players);
    });

    socket.on('startGame', (roomCode) => {
        const roles = ['förrädare', 'trogen', 'avrättare', 'bomb', 'dödskalle', 'sheriff'];
        let players = rooms[roomCode].players;
        let assignedRoles = players.map(p => {
            return { name: p.name, role: roles[Math.floor(Math.random() * roles.length)] };
        });
        io.to(roomCode).emit('gameStarted', assignedRoles);
    });

    socket.on('disconnect', () => {
        for (let code in rooms) {
            rooms[code].players = rooms[code].players.filter(p => p.id !== socket.id);
            io.to(code).emit('playerList', rooms[code].players);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servern kör på port ${PORT}`));
