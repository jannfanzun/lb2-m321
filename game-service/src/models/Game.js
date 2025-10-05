const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  player1_id: {
    type: String,
    required: true
  },
  player2_id: {
    type: String,
    default: null
  },
  board: {
    type: [String],
    default: ['', '', '', '', '', '', '', '', '']
  },
  current_player: {
    type: String,
    enum: ['X', 'O'],
    default: 'X'
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  winner: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', gameSchema);
