const socket = io();

const nameInput = document.getElementById('nameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const playerListDiv = document.getElementById('playerList');
const startBtn = document.getElementById('startBtn');

const traitorSliderContainer = document.getElementById('traitorSliderContainer');
const traitorSlider = document.getElementById('traitorSlider');
const traitorCountSpan = document.getElementById('traitorCount');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');

const traitorBox = document.getElementById('traitorBox');
const traitorList = document.getElementById('traitorList');

let executionerBox = document.getElementById('executionerBox');
if (!executionerBox) {
    executionerBox = document.createElement('div');
    executionerBox.id = 'executionerBox';
    executionerBox.style.position = 'fixed';
    executionerBox.style.top = '50%';
    executionerBox.style.left = '50%';
    executionerBox.style.transform = 'translate(-50%, -50%)';
    executionerBox.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    executionerBox.style.color = 'white';
    executionerBox.style.padding = '20px';
    executionerBox.style.borderRadius = '10px';
    executionerBox.style.fontSize = '1.8rem';
    executionerBox.style.textAlign = 'center';
    executionerBox.style.zIndex = '9999';
    executionerBox.style.display = 'none';
    executionerBox.style.pointerEvents = 'none';
    document.body.appendChild(executionerBox);
}

let currentRoom = '';

// join-knapp
joinBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    let roomCode = roomInput.value.trim();
    if (!name) return alert('Skriv in namn');
    if (!roomCode) {
        // om användaren inte skrev kod, skapa en enkel slumpkod (6 tecken)
        roomCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    }

    currentRoom = roomCode;
    socket.emit('joinRoom', { roomCode, name });

    // Dölj join UI
    nameInput.style.display = 'none';
    roomInput.style.display = 'none';
    joinBtn.style.display = 'none';

    playerListDiv.style.display = 'block';
    startBtn.style.display = 'none';
    traitorSliderContainer.style.display = 'none';
    roomCodeDisplay.style.display = 'none';
});

// Server bekräftelse när du joinat ett rum
socket.on('roomJoined', (data) => {
    // data: { roomCode, leaderId, traitorCount }
    currentRoom = data.roomCode;
    // uppdatera slider value om ledaren
    if (data.traitorCount) {
        traitorSlider.value = data.traitorCount;
        traitorCountSpan.textContent = data.traitorCount;
    }
    // Om du är ledare: visa rumskod direkt
    if (socket.id === data.leaderId) {
        roomCodeDisplay.textContent = `Rumskod: ${currentRoom} (värd)`;
        roomCodeDisplay.style.display = 'inline-block';
        traitorSliderContainer.style.display = 'block';
        startBtn.style.display = 'inline-block';
    } else {
        roomCodeDisplay.style.display = 'none';
        traitorSliderContainer.style.display = 'none';
    }
});

socket.on('alreadyJoined', () => {
    alert('Du är redan med i spelet, kan inte gå med flera gånger.');
});

// När spelare- listan uppdateras
socket.on('playerList', (players) => {
    playerListDiv.innerHTML = '<h3>Spelare:</h3><ul>' +
        players.map(p => `<li>${p.name}</li>`).join('') + '</ul>';
    // Visa startknapp + rumskod endast för ledaren (första i listan)
    if (players.length > 0 && socket.id === players[0].id) {
        startBtn.style.display = 'inline-block';
        traitorSliderContainer.style.display = 'block';
        roomCodeDisplay.textContent = `Rumskod: ${currentRoom} (värd)`;
        roomCodeDisplay.style.display = 'inline-block';
    } else {
        startBtn.style.display = 'none';
        traitorSliderContainer.style.display = 'none';
        roomCodeDisplay.style.display = 'none';
    }
});

// När ledare byts
socket.on('roomLeaderChanged', ({ leaderId }) => {
    if (socket.id === leaderId) {
        roomCodeDisplay.textContent = `Rumskod: ${currentRoom} (värd)`;
        roomCodeDisplay.style.display = 'inline-block';
        traitorSliderContainer.style.display = 'block';
        startBtn.style.display = 'inline-block';
    } else {
        roomCodeDisplay.style.display = 'none';
        traitorSliderContainer.style.display = 'none';
        startBtn.style.display = 'none';
    }
});

traitorSlider.addEventListener('input', () => {
    traitorCountSpan.textContent = traitorSlider.value;
    socket.emit('updateTraitorCount', { roomCode: currentRoom, count: Number(traitorSlider.value) });
});

startBtn.addEventListener('click', () => {
    socket.emit('startGame', currentRoom);
});

socket.on('gameStarted', (assignedRoles) => {
    const me = assignedRoles.find(p => p.id === socket.id);
    alert(`Din roll är: ${me.role}`);

    traitorBox.style.display = 'none';
    traitorBox.style.pointerEvents = 'none';
    executionerBox.style.display = 'none';
    executionerBox.style.pointerEvents = 'none';

    const traitorRoles = ['förrädare', 'bomb', 'dödskalle'];
    if (traitorRoles.includes(me.role)) {
        const mates = assignedRoles
            .filter(p => traitorRoles.includes(p.role) && p.id !== me.id)
            .map(p => p.name);
        traitorList.innerHTML = mates.map(m => `<li>${m}</li>`).join('');
        traitorBox.style.display = 'block';
        traitorBox.style.pointerEvents = 'auto';
    }
});

socket.on('traitorInfo', (mates) => {
    // extra, kan användas om behövs
});

socket.on('executionerTarget', (targetName) => {
    executionerBox.textContent = `Mål: ${targetName}`;
    executionerBox.style.display = 'block';
    executionerBox.style.pointerEvents = 'auto';
});
