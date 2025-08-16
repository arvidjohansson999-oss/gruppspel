const socket = io();

// --- UI element ---
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

const resetBtn = document.getElementById('resetBtn');
const winnerSelection = document.getElementById('winnerSelection');
const winnerList = document.getElementById('winnerList');
const confirmWinnerBtn = document.getElementById('confirmWinnerBtn');
const scoreBoard = document.getElementById('scoreBoard');

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
let scores = JSON.parse(localStorage.getItem('scores') || '{}');

// ====================
// --- Scoreboard ---
// ====================
function updateScoreBoard() {
    scoreBoard.innerHTML = '<h3>Vinster:</h3><ul>' +
        Object.keys(scores).map(name => `<li>${name}: ${scores[name]}</li>`).join('') +
        '</ul>';
}
updateScoreBoard();

// ====================
// --- Join-knapp ---
// ====================
joinBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    let roomCode = roomInput.value.trim();
    if (!name) return alert('Skriv in namn');
    if (!roomCode) {
        roomCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    }

    currentRoom = roomCode;
    socket.emit('joinRoom', { roomCode, name });

    // Dölj join UI
    nameInput.style.display = 'none';
    roomInput.style.display = 'none';
    joinBtn.style.display = 'none';

    playerListDiv.style.display = 'block';
});

// ====================
// --- Server events ---
// ====================
socket.on('roomJoined', (data) => {
    currentRoom = data.roomCode;

    if (data.traitorCount) {
        traitorSlider.value = data.traitorCount;
        traitorCountSpan.textContent = data.traitorCount;
    }

    if (socket.id === data.leaderId) {
        showLeaderUI();
    } else {
        hideLeaderUI();
    }
});

socket.on('alreadyJoined', () => {
    alert('Du är redan med i spelet.');
});

socket.on('playerList', (players) => {
    playerListDiv.innerHTML = '<h3>Spelare:</h3><ul>' +
        players.map(p => `<li>${p.name}</li>`).join('') + '</ul>';

    if (players.length > 0 && socket.id === players[0].id) {
        showLeaderUI();
    } else {
        hideLeaderUI();
    }
});

socket.on('roomLeaderChanged', ({ leaderId }) => {
    if (socket.id === leaderId) {
        showLeaderUI();
    } else {
        hideLeaderUI();
    }
});

socket.on('gameStarted', (assignedRoles) => {
    const me = assignedRoles.find(p => p.id === socket.id);
    alert(`Din roll är: ${me.role}`);

    // reset UI
    traitorBox.style.display = 'none';
    executionerBox.style.display = 'none';

    // visa förrädar-lag
    const traitorRoles = ['förrädare❌️', 'bomb💣', 'dödskalle☠️'];
    if (traitorRoles.includes(me.role)) {
        const mates = assignedRoles
            .filter(p => traitorRoles.includes(p.role) && p.id !== me.id)
            .map(p => p.name);
        traitorList.innerHTML = mates.map(m => `<li>${m}</li>`).join('');
        traitorBox.style.display = 'block';
    }
});

socket.on('executionerTarget', (targetName) => {
    executionerBox.textContent = `Mål: ${targetName}`;
    executionerBox.style.display = 'block';
});

// ====================
// --- Reset & Vinnare ---
// ====================
resetBtn.addEventListener('click', () => {
    if (!confirm('Är du säker på att du vill återställa spelet?')) return;
    socket.emit('resetGame', currentRoom);
});

socket.on('gameReset', (players) => {
    // Rensa menyer
    traitorBox.style.display = 'none';
    executionerBox.style.display = 'none';

    // Uppdatera spelarlistan igen
    playerListDiv.innerHTML = '<h3>Spelare:</h3><ul>' +
        players.map(p => `<li>${p.name}</li>`).join('') + '</ul>';

    // Visa vinnarmenyn endast för spelledaren
    if (players.length > 0 && socket.id === players[0].id) {
        winnerList.innerHTML = '';
        players.forEach(p => {
            const li = document.createElement('li');
            li.textContent = p.name;
            li.addEventListener('click', () => {
                li.classList.toggle('selected');
            });
            winnerList.appendChild(li);
        });
        winnerSelection.style.display = 'block';
    } else {
        winnerSelection.style.display = 'none';
    }
});

confirmWinnerBtn.addEventListener('click', () => {
    const selected = Array.from(winnerList.querySelectorAll('li.selected')).map(li => li.textContent);
    selected.forEach(name => {
        scores[name] = (scores[name] || 0) + 1;
    });
    localStorage.setItem('scores', JSON.stringify(scores));
    updateScoreBoard();
    winnerSelection.style.display = 'none';
});

// ====================
// --- Helpers ---
// ====================
function showLeaderUI() {
    roomCodeDisplay.textContent = `Rumskod: ${currentRoom} (värd)`;
    roomCodeDisplay.style.display = 'inline-block';
    traitorSliderContainer.style.display = 'block';
    startBtn.style.display = 'inline-block';
    resetBtn.style.display = 'inline-block';
}

function hideLeaderUI() {
    roomCodeDisplay.style.display = 'none';
    traitorSliderContainer.style.display = 'none';
    startBtn.style.display = 'none';
    resetBtn.style.display = 'none';
}

// ====================
// --- Interaktioner ---
// ====================
traitorSlider.addEventListener('input', () => {
    traitorCountSpan.textContent = traitorSlider.value;
    socket.emit('updateTraitorCount', { roomCode: currentRoom, count: Number(traitorSlider.value) });
});

startBtn.addEventListener('click', () => {
    socket.emit('startGame', currentRoom);
});
