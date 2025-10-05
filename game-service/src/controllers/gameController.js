const Game = require('../models/Game');

exports.createGame = async (req, res) => {
  try {
    const { player1_id } = req.body;

    if (!player1_id) {
      return res.status(400).json({ error: 'Player ID required' });
    }

    const game = new Game({ player1_id });
    await game.save();

    res.status(201).json({
      message: 'Game created successfully',
      game
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.joinGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { player2_id } = req.body;

    if (!player2_id) {
      return res.status(400).json({ error: 'Player ID required' });
    }

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started or finished' });
    }

    game.player2_id = player2_id;
    game.status = 'active';
    await game.save();

    res.json({
      message: 'Joined game successfully',
      game
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGame = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
