const socket = io();

let roomCode = "test"; // Förenklad, alla går i samma lobby just nu
let playerName = "";

document.getElementById('joinGameBtn').onclick = () => {
    playerName = document.getElementById('nameInput').value;
    if (playerName.trim() === "") return;
    socket.emit('joinRoom', { roomCode, name: playerName });
    document.getElementById('nameEntry').style.display = "none";
    document.getElementById('lobby').style.display = "block";
};

socket.on('playerList', (players) => {
    const list = document.getElementById('players');
    list.innerHTML = "";
    players.forEach(p => {
        let li = document.createElement('li');
        li.textContent = p.name;
        list.appendChild(li);
    });
});

document.getElementById('startGameBtn').onclick = () => {
    socket.emit('startGame', roomCode);
};

socket.on('gameStarted', (assignedRoles) => {
    document.getElementById('lobby').style.display = "none";
    document.getElementById('game').style.display = "block";
    const myRole = assignedRoles.find(p => p.name === playerName).role;
    document.getElementById('role').textContent = myRole;
});
