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
        if (!roomCode || !name) return;

        socket.join(roomCode);
        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [], leader: socket.id };
        }
        rooms[roomCode].players.push({ id: socket.id, name });

        io.to(roomCode).emit('playerList', rooms[roomCode].players);
    });

    socket.on('startGame', (roomCode) => {
        if (!roomCode || !rooms[roomCode]) return;

        let players = rooms[roomCode].players;
        const maxTraitors = 3;
        const traitorRoles = ['förrädare', 'bomb', 'dödskalle'];
        const uniqueRoles = ['avrättare', 'sheriff'];

        // 1. Välj antal förrädare (2 eller 3), max antal spelare
        const numTraitors = Math.min(maxTraitors, players.length, Math.floor(Math.random() * 2) + 2); // 2 eller 3

        // 2. Välj slumpmässigt vilka förrädarroller som ska ingå
        let chosenTraitorRoles = [];
        while (chosenTraitorRoles.length < numTraitors) {
            const r = traitorRoles[Math.floor(Math.random() * traitorRoles.length)];
            if (!chosenTraitorRoles.includes(r)) chosenTraitorRoles.push(r);
        }

        // 3. Unika roller (avrättare, sheriff), max 1 vardera
        let uniqueAssigned = [];
        if (players.length > chosenTraitorRoles.length) {
            if (players.length - chosenTraitorRoles.length >= 1) uniqueAssigned.push('avrättare');
            if (players.length - chosenTraitorRoles.length - uniqueAssigned.length >= 1) uniqueAssigned.push('sheriff');
        }

        // 4. Tilldela roller: börja med alla trogen
        let rolesToAssign = new Array(players.length).fill('trogen');

        // Placera ut förrädarroller först
        for (let i = 0; i < chosenTraitorRoles.length; i++) {
            rolesToAssign[i] = chosenTraitorRoles[i];
        }

        // Placera ut unika roller efter förrädare
        for (let i = 0; i < uniqueAssigned.length; i++) {
            rolesToAssign[chosenTraitorRoles.length + i] = uniqueAssigned[i];
        }

        // Shuffle rollerna så de sprids
        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        rolesToAssign = shuffle(rolesToAssign);

        // Tilldela roller till spelare
        const assignedRoles = players.map((p, i) => ({
            id: p.id,
            name: p.name,
            role: rolesToAssign[i],
        }));

        io.to(roomCode).emit('gameStarted', assignedRoles);

        // Skicka info till förrädare
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
        for (const code in rooms) {
            const room = rooms[code];
            room.players = room.players.filter(p => p.id !== socket.id);
            io.to(code).emit('playerList', room.players);

            if (room.players.length === 0) {
                delete rooms[code];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servern kör på port ${PORT}`));
