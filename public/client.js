const socket = io();

const nameInput = document.getElementById('nameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const playerListDiv = document.getElementById('playerList');
const startBtn = document.getElementById('startBtn');
const traitorBox = document.getElementById('traitorBox');
const traitorList = document.getElementById('traitorList');

let currentRoom = '';

joinBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const roomCode = roomInput.value.trim();
    if (!name || !roomCode) return alert('Skriv in namn och rumskod');
    currentRoom = roomCode;
    socket.emit('joinRoom', { roomCode, name });
});

socket.on('playerList', (players) => {
    playerListDiv.innerHTML = '<h3>Spelare:</h3><ul>' +
        players.map(p => `<li>${p.name}</li>`).join('') + '</ul>';
    if (players.length > 0 && socket.id === players[0].id) {
        startBtn.style.display = 'inline-block';
    } else {
        startBtn.style.display = 'none';
    }
});

startBtn.addEventListener('click', () => {
    socket.emit('startGame', currentRoom);
});

socket.on('gameStarted', (assignedRoles) => {
    const myRole = assignedRoles.find(p => p.id === socket.id).role;
    alert(`Din roll är: ${myRole}`);
});

socket.on('traitorInfo', (mates) => {
    traitorList.innerHTML = mates.map(m => `<li>${m}</li>`).join('');
    traitorBox.style.display = 'block';
});
