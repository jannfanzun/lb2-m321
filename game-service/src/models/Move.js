const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema({
  game_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  player_id: {
    type: String,
    required: true
  },
  position: {
    type: Number,
    required: true,
    min: 0,
    max: 8
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Move', moveSchema);
