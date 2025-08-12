const socket = io();

const nameInput = document.getElementById('nameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const playerListDiv = document.getElementById('playerList');
const startBtn = document.getElementById('startBtn');

const traitorBox = document.getElementById('traitorBox');
const traitorList = document.getElementById('traitorList');

// Skapa avrättar-rutan om den inte finns
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
    document.body.appendChild(executionerBox);
}

let currentRoom = '';

joinBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const roomCode = roomInput.value.trim();
    if (!name || !roomCode) return alert('Skriv in namn och rumskod');
    currentRoom = roomCode;
    socket.emit('joinRoom', { roomCode, name });

    // Här fixar vi så knappen och inputs låses
    joinBtn.disabled = true;
    nameInput.disabled = true;
    roomInput.disabled = true;
    joinBtn.textContent = 'Gått med!';
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

    // Dölj alla rutor först
    traitorBox.style.display = 'none';
    executionerBox.style.display = 'none';

    const traitorRoles = ['förrädare', 'bomb', 'dödskalle'];
    if (traitorRoles.includes(me.role)) {
        // Visa förrädarrutan och fyll med namn på medspelare
        const mates = assignedRoles
            .filter(p => traitorRoles.includes(p.role) && p.id !== me.id)
            .map(p => p.name);
        traitorList.innerHTML = mates.map(m => `<li>${m}</li>`).join('');
        traitorBox.style.display = 'block';
    }
});

socket.on('traitorInfo', (mates) => {
    // Kan ignoreras om allt körs i gameStarted
});

socket.on('executionerTarget', (targetName) => {
    executionerBox.textContent = `Mål: ${targetName}`;
    executionerBox.style.display = 'block';
});
