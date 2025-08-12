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
    console.log(`Ny användare anslöt: ${socket.id}`);

    socket.on('joinRoom', ({ roomCode, name }) => {
        if (!roomCode || !name) {
            console.log('Fel: roomCode eller name saknas vid joinRoom');
            return;
        }
        socket.join(roomCode);
        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [], leader: socket.id };
        }
        rooms[roomCode].players.push({ id: socket.id, name });
        console.log(`Spelare ${name} gick med i rum ${roomCode}`);
        io.to(roomCode).emit('playerList', rooms[roomCode].players);
    });

    socket.on('startGame', (roomCode) => {
        console.log(`StartGame mottaget från rum: ${roomCode}`);

        if (!roomCode || !rooms[roomCode]) {
            console.log('Fel: ogiltigt roomCode vid startGame');
            return;
        }

        const roles = ['förrädare', 'trogen', 'avrättare', 'bomb', 'dödskalle', 'sheriff'];
        let players = rooms[roomCode].players;

        // Om fler spelare än roller, fyll på med "civil"
        const extendedRoles = [...roles];
        while (extendedRoles.length < players.length) {
            extendedRoles.push('civil');
        }

        // Fisher-Yates shuffle
        function shuffle(array) {
            for (let i = array.length -1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i +1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        const shuffledRoles = shuffle(extendedRoles);

        let assignedRoles = players.map((p, index) => ({
            id: p.id,
            name: p.name,
            role: shuffledRoles[index],
        }));

        // Skicka ut roller till alla
        io.to(roomCode).emit('gameStarted', assignedRoles);

        // Definiera förrädarroller
        const traitorRoles = ['förrädare', 'bomb', 'dödskalle'];

        // Skicka individuell info till varje förrädare
        assignedRoles.forEach(player => {
            if (traitorRoles.includes(player.role)) {
                const traitorMates = assignedRoles
                    .filter(p => traitorRoles.includes(p.role) && p.id !== player.id)
                    .map(p => p.name);

                io.to(player.id).emit('traitorInfo', traitorMates);
            }
        });
    });

    socket.on('disconnect', () => {
        console.log(`Användare kopplade från: ${socket.id}`);
        for (const code in rooms) {
            const room = rooms[code];
            const beforeCount = room.players.length;
            room.players = room.players.filter(p => p.id !== socket.id);

            if (room.players.length !== beforeCount) {
                io.to(code).emit('playerList', room.players);
                console.log(`Uppdaterade spelare i rum ${code}`);
            }
            // Optional: Rensa tomma rum
            if (room.players.length === 0) {
                delete rooms[code];
                console.log(`Raderade tomt rum: ${code}`);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servern kör på port ${PORT}`));
