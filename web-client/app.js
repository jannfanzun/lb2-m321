const USER_SERVICE_URL = 'http://localhost:3000';
const GAME_SERVICE_URL = 'http://localhost:3000';

let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');
let username = localStorage.getItem('username');
let currentGameId = null;
let playerSymbol = null;
let socket = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const lobbySection = document.getElementById('lobby-section');
const gameSection = document.getElementById('game-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const registerContainer = document.getElementById('register-container');
const usernameDisplay = document.getElementById('username');
const createGameBtn = document.getElementById('create-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const logoutBtn = document.getElementById('logout-btn');
const backToLobbyBtn = document.getElementById('back-to-lobby-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const leaveGameBtn = document.getElementById('leave-game-btn');
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const gameIdDisplay = document.getElementById('game-id');
const gameStatusDisplay = document.getElementById('game-status');
const gameIdSection = document.getElementById('game-id-section');
const playerSymbolDisplay = document.getElementById('player-symbol');
const currentTurnDisplay = document.getElementById('current-turn');
const winnerModal = document.getElementById('winner-modal');
const winnerMessage = document.getElementById('winner-message');

// Initialize
if (token && userId) {
    showLobby();
} else {
    showAuth();
}

// Auth Functions
showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    registerContainer.style.display = 'block';
    document.querySelector('.auth-container:first-child').style.display = 'none';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerContainer.style.display = 'none';
    document.querySelector('.auth-container:first-child').style.display = 'block';
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${USER_SERVICE_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            token = data.token;
            userId = data.user.id;
            username = data.user.username;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            localStorage.setItem('username', username);
            showLobby();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${USER_SERVICE_URL}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Please login.');
            registerContainer.style.display = 'none';
            document.querySelector('.auth-container:first-child').style.display = 'block';
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
});

// Lobby Functions
function showAuth() {
    authSection.style.display = 'block';
    lobbySection.style.display = 'none';
    gameSection.style.display = 'none';
}

function showLobby() {
    authSection.style.display = 'none';
    lobbySection.style.display = 'block';
    gameSection.style.display = 'none';
    usernameDisplay.textContent = username;
    gameIdSection.style.display = 'none';
}

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    token = null;
    userId = null;
    username = null;
    if (socket) socket.disconnect();
    showAuth();
});

createGameBtn.addEventListener('click', async () => {
    try {
        const response = await fetch(`${GAME_SERVICE_URL}/api/games/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player1_id: userId })
        });

        const data = await response.json();

        if (response.ok) {
            currentGameId = data.game._id;
            playerSymbol = 'X';
            gameIdDisplay.textContent = currentGameId;
            gameIdSection.style.display = 'block';
            connectSocket();
        } else {
            alert(data.error || 'Failed to create game');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
});

joinGameBtn.addEventListener('click', async () => {
    const gameId = document.getElementById('join-game-id').value.trim();
    if (!gameId) {
        alert('Please enter a game ID');
        return;
    }

    try {
        const response = await fetch(`${GAME_SERVICE_URL}/api/games/${gameId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player2_id: userId })
        });

        const data = await response.json();

        if (response.ok) {
            currentGameId = gameId;
            playerSymbol = 'O';
            connectSocket();
            showGame();
        } else {
            alert(data.error || 'Failed to join game');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
});

// Game Functions
function connectSocket() {
    socket = io(GAME_SERVICE_URL);

    socket.on('connect', () => {
        socket.emit('game:join', { gameId: currentGameId, playerId: userId });
    });

    socket.on('game:update', (game) => {
        updateBoard(game);
        if (game.status === 'active' && lobbySection.style.display === 'block') {
            showGame();
        }
    });

    socket.on('game:end', (data) => {
        showWinner(data.winner);
    });

    socket.on('game:player-left', (data) => {
        alert(data.message);
        if (socket) socket.disconnect();
        currentGameId = null;
        playerSymbol = null;
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        showLobby();
    });

    socket.on('game:player-disconnected', (data) => {
        alert(data.message);
        if (socket) socket.disconnect();
        currentGameId = null;
        playerSymbol = null;
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        showLobby();
    });

    socket.on('error', (error) => {
        alert(error.message);
    });
}

function showGame() {
    authSection.style.display = 'none';
    lobbySection.style.display = 'none';
    gameSection.style.display = 'block';
    playerSymbolDisplay.textContent = playerSymbol;
}

function updateBoard(game) {
    cells.forEach((cell, index) => {
        const value = game.board[index];
        cell.textContent = value;
        cell.className = 'cell';
        if (value) {
            cell.classList.add(value.toLowerCase());
            cell.classList.add('disabled');
        }
    });

    currentTurnDisplay.textContent = game.current_player;

    const isMyTurn = game.current_player === playerSymbol;
    cells.forEach((cell, index) => {
        if (!game.board[index] && isMyTurn && game.status === 'active') {
            cell.classList.remove('disabled');
        } else {
            cell.classList.add('disabled');
        }
    });
}

cells.forEach((cell) => {
    cell.addEventListener('click', () => {
        if (cell.classList.contains('disabled')) return;

        const position = parseInt(cell.getAttribute('data-index'));
        socket.emit('game:move', {
            gameId: currentGameId,
            playerId: userId,
            position
        });
    });
});

function showWinner(winner) {
    if (winner === 'draw') {
        winnerMessage.textContent = "It's a Draw!";
    } else if (winner === playerSymbol) {
        winnerMessage.textContent = 'You Win!';
    } else {
        winnerMessage.textContent = 'You Lose!';
    }
    winnerModal.style.display = 'flex';
}

backToLobbyBtn.addEventListener('click', () => {
    // Notify server that player is leaving
    if (socket && currentGameId) {
        socket.emit('game:leave', { gameId: currentGameId, playerId: userId });
        socket.disconnect();
    }
    currentGameId = null;
    playerSymbol = null;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
    showLobby();
});

playAgainBtn.addEventListener('click', async () => {
    winnerModal.style.display = 'none';

    // Store old game ID
    const oldGameId = currentGameId;

    // Reset board and game state first
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });

    // Disconnect from old game AFTER storing the ID
    if (socket) {
        if (oldGameId) {
            socket.emit('game:leave', { gameId: oldGameId, playerId: userId });
        }
        socket.disconnect();
        socket = null;
    }

    // Reset state
    currentGameId = null;
    playerSymbol = null;

    // Create new game automatically
    try {
        const response = await fetch(`${GAME_SERVICE_URL}/api/games/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player1_id: userId })
        });

        const data = await response.json();

        if (response.ok) {
            currentGameId = data.game._id;
            playerSymbol = 'X';
            gameIdDisplay.textContent = currentGameId;
            gameIdSection.style.display = 'block';
            gameSection.style.display = 'none';

            // Connect socket for new game
            connectSocket();

            // Show lobby with new game waiting
            showLobby();
        } else {
            alert(data.error || 'Failed to create game');
            showLobby();
        }
    } catch (error) {
        alert('Error connecting to server');
        showLobby();
    }
});

leaveGameBtn.addEventListener('click', () => {
    winnerModal.style.display = 'none';

    // Disconnect from game
    if (socket) {
        if (currentGameId) {
            socket.emit('game:leave', { gameId: currentGameId, playerId: userId });
        }
        socket.disconnect();
    }

    // Reset everything
    currentGameId = null;
    playerSymbol = null;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
    showLobby();
});
