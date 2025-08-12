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

        // Skapa rum om det inte finns
        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [], leader: socket.id, traitorCount: 2 };
        }

        // Checka så samma socket inte joinar igen
        const alreadyInRoom = rooms[roomCode].players.find(p => p.id === socket.id);
        if (alreadyInRoom) {
            socket.emit('alreadyJoined');
            return;
        }

        socket.join(roomCode);
        rooms[roomCode].players.push({ id: socket.id, name });

        // Skicka spelare-lista till alla i rummet
        io.to(roomCode).emit('playerList', rooms[roomCode].players);

        // Skicka bekräftelse till den som nyss joinade med ruminfo
        socket.emit('roomJoined', {
            roomCode: roomCode,
            leaderId: rooms[roomCode].leader,
            traitorCount: rooms[roomCode].traitorCount
        });
    });

    socket.on('updateTraitorCount', ({ roomCode, count }) => {
        if (rooms[roomCode] && socket.id === rooms[roomCode].leader) {
            rooms[roomCode].traitorCount = count;
            io.to(roomCode).emit('traitorCountUpdated', count);
        }
    });

    socket.on('startGame', (roomCode) => {
        if (!roomCode || !rooms[roomCode]) return;

        let players = rooms[roomCode].players;
        const maxTraitors = Math.min(3, players.length);
        const requestedTraitors = rooms[roomCode].traitorCount || 2;
        const numTraitors = Math.min(requestedTraitors, maxTraitors);

        const traitorRoles = ['förrädare', 'bomb', 'dödskalle'];
        const uniqueRoles = ['avrättare', 'sheriff'];

        // Välj unika förrädar-roller (ingen duplicering här)
        let chosenTraitorRoles = [];
        while (chosenTraitorRoles.length < numTraitors) {
            const r = traitorRoles[Math.floor(Math.random() * traitorRoles.length)];
            if (!chosenTraitorRoles.includes(r)) chosenTraitorRoles.push(r);
        }

        // Välj unika roller (avrättare & sheriff) om plats finns
        let uniqueAssigned = [];
        if (players.length > chosenTraitorRoles.length) {
            if (players.length - chosenTraitorRoles.length >= 1) uniqueAssigned.push('avrättare');
            if (players.length - chosenTraitorRoles.length - uniqueAssigned.length >= 1) uniqueAssigned.push('sheriff');
        }

        // Fyll resten med 'trogen'
        let rolesToAssign = new Array(players.length).fill('trogen');

        for (let i = 0; i < chosenTraitorRoles.length; i++) {
            rolesToAssign[i] = chosenTraitorRoles[i];
        }
        for (let i = 0; i < uniqueAssigned.length; i++) {
            rolesToAssign[chosenTraitorRoles.length + i] = uniqueAssigned[i];
        }

        // Shuffle så placeringen blir random
        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        rolesToAssign = shuffle(rolesToAssign);

        const assignedRoles = players.map((p, i) => ({
            id: p.id,
            name: p.name,
            role: rolesToAssign[i],
        }));

        // Broadcasta roller till alla i rummet
        io.to(roomCode).emit('gameStarted', assignedRoles);

        // Skicka förrädarinfo till varje förrädare
        const traitorRoleSet = new Set(traitorRoles);
        assignedRoles.forEach(player => {
            if (traitorRoleSet.has(player.role)) {
                const traitorMates = assignedRoles
                    .filter(p => traitorRoleSet.has(p.role) && p.id !== player.id)
                    .map(p => p.name);
                io.to(player.id).emit('traitorInfo', traitorMates);
            }
        });

        // Skicka mål till avrättaren
        const executioner = assignedRoles.find(p => p.role === 'avrättare');
        if (executioner) {
            const possibleTargets = assignedRoles.filter(p => p.id !== executioner.id);
            const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
            io.to(executioner.id).emit('executionerTarget', target.name);
        }
    });

    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const before = room.players.length;
            room.players = room.players.filter(p => p.id !== socket.id);

            if (room.players.length !== before) {
                io.to(roomCode).emit('playerList', room.players);
            }

            // Om ledaren försvann -> sätt ny ledare och meddela
            if (room.leader === socket.id && room.players.length > 0) {
                room.leader = room.players[0].id;
                io.to(roomCode).emit('roomLeaderChanged', { leaderId: room.leader });
            }

            if (room.players.length === 0) {
                delete rooms[roomCode];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servern kör på port ${PORT}`));
