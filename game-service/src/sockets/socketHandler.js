const Game = require('../models/Game');
const Move = require('../models/Move');
const gameLogic = require('../utils/gameLogic');

// Store player connections
const playerConnections = new Map(); // playerId -> { socketId, gameId }

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('game:join', async (data) => {
      try {
        const { gameId, playerId } = data;
        socket.join(gameId);

        // Track player connection
        playerConnections.set(playerId, { socketId: socket.id, gameId });
        socket.playerId = playerId;
        socket.gameId = gameId;

        const game = await Game.findById(gameId);
        io.to(gameId).emit('game:update', game);

        console.log(`Player ${playerId} joined game ${gameId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('game:move', async (data) => {
      try {
        const { gameId, playerId, position } = data;

        const game = await Game.findById(gameId);

        // Validate move
        if (game.status !== 'active') {
          return socket.emit('error', { message: 'Game is not active' });
        }

        if (game.board[position] !== '') {
          return socket.emit('error', { message: 'Position already taken' });
        }

        const playerSymbol = game.player1_id === playerId ? 'X' : 'O';
        if (game.current_player !== playerSymbol) {
          return socket.emit('error', { message: 'Not your turn' });
        }

        // Make move
        game.board[position] = playerSymbol;

        // Save move to database
        const move = new Move({ game_id: gameId, player_id: playerId, position });
        await move.save();

        // Check for winner or draw
        const winner = gameLogic.checkWinner(game.board);
        const isDraw = gameLogic.checkDraw(game.board);

        if (winner) {
          game.status = 'finished';
          game.winner = winner;
        } else if (isDraw) {
          game.status = 'finished';
          game.winner = 'draw';
        } else {
          game.current_player = game.current_player === 'X' ? 'O' : 'X';
        }

        await game.save();

        // Emit update to all players
        io.to(gameId).emit('game:update', game);

        if (game.status === 'finished') {
          io.to(gameId).emit('game:end', {
            winner: game.winner,
            board: game.board
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('game:leave', async (data) => {
      try {
        const { gameId, playerId } = data;

        if (gameId) {
          // Notify other player that opponent left
          socket.to(gameId).emit('game:player-left', {
            message: 'Your opponent has left the game',
            playerId
          });

          // Update game status to abandoned if still active
          const game = await Game.findById(gameId);
          if (game && game.status === 'active') {
            game.status = 'abandoned';
            await game.save();
          }
        }

        // Clean up player connection
        if (playerId) {
          playerConnections.delete(playerId);
        }
        socket.leave(gameId);
        console.log(`Player ${playerId} left game ${gameId}`);
      } catch (error) {
        console.error('Error handling game leave:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);

      // Handle unexpected disconnect
      const playerId = socket.playerId;
      const gameId = socket.gameId;

      if (playerId && gameId) {
        try {
          // Notify other player
          socket.to(gameId).emit('game:player-disconnected', {
            message: 'Your opponent disconnected',
            playerId
          });

          // Update game status
          const game = await Game.findById(gameId);
          if (game && game.status === 'active') {
            game.status = 'abandoned';
            await game.save();
          }

          // Clean up
          playerConnections.delete(playerId);
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });
};
