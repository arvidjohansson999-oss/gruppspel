// ---------- EXISTERANDE KOD FINNS OCH ÄR INTE ÄNDRADE ----------

// --- Återställ-knapp och vinnare-funktion ---
const resetBtn = document.getElementById('resetBtn');
const winnerSelection = document.getElementById('winnerSelection');
const winnerList = document.getElementById('winnerList');
const confirmWinnerBtn = document.getElementById('confirmWinnerBtn');
const scoreBoard = document.getElementById('scoreBoard');

let scores = JSON.parse(localStorage.getItem('scores') || '{}');

function updateScoreBoard() {
    scoreBoard.innerHTML = '<h3>Vinster:</h3><ul>' +
        Object.keys(scores).map(name => `<li>${name}: ${scores[name]}</li>`).join('') +
        '</ul>';
}
updateScoreBoard();

// Visa reset-knapp för värden
function checkLeaderUI(leaderId) {
    if (socket.id === leaderId) resetBtn.style.display = 'inline-block';
    else resetBtn.style.display = 'none';
}

// Koppla reset-knapp
resetBtn.addEventListener('click', () => {
    if (!confirm('Är du säker på att du vill återställa spelet?')) return;
    socket.emit('resetGame', currentRoom);
});

// När servern bekräftar reset
socket.on('gameReset', (players) => {
    // Visa vinnare-ruta till värden
    if (players.find(p => p.id === socket.id)) { // värden
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
    }
});

// Klicka Ok på vinnare
confirmWinnerBtn.addEventListener('click', () => {
    const selected = Array.from(winnerList.querySelectorAll('li.selected')).map(li => li.textContent);
    selected.forEach(name => {
        scores[name] = (scores[name] || 0) + 1;
    });
    localStorage.setItem('scores', JSON.stringify(scores));
    updateScoreBoard();
    winnerSelection.style.display = 'none';
});
