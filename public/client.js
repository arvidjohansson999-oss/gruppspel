const socket = io();

const nameInput = document.getElementById('nameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const playerListDiv = document.getElementById('playerList');
const startBtn = document.getElementById('startBtn');

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
    executionerBox.style.fontSize = '2rem';
    executionerBox.style.textAlign = 'center';
    executionerBox.style.zIndex = '9999';
    executionerBox.style.display = 'none';
    executionerBox.style.pointerEvents = 'none'; // block clicks when hidden
    document.body.appendChild(executionerBox);
}

let currentRoom = '';

// Säkerställ att joinBtn är enabled och synlig från start
joinBtn.disabled = false;
joinBtn.style.display = 'inline-block';

joinBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const roomCode = roomInput.value.trim();
    if (!name || !roomCode) return alert('Skriv in namn och rumskod');

    currentRoom = roomCode;
    socket.emit('joinRoom', { roomCode, name });

    // Disable knappen och dölj inputs och knapp när man joinar
    joinBtn.disabled = true;
    nameInput.style.display = 'none';
    roomInput.style.display = 'none';
    joinBtn.style.display = 'none';

    // Visa playerlist, startBtn syns bara för ledare senare
    playerListDiv.style.display = 'block';
    startBtn.style.display = 'none';
});

socket.on('alreadyJoined', () => {
    alert('Du är redan med i spelet, kan inte gå med flera gånger.');
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
        traitorBox.style.pointerEvents = 'auto'; // tillåt klick
    }
});

socket.on('executionerTarget', (targetName) => {
    executionerBox.textContent = `Mål: ${targetName}`;
    executionerBox.style.display = 'block';
    executionerBox.style.pointerEvents = 'auto'; // tillåt klick
});
