// MongoDB initialization script
db = db.getSiblingDB('tictactoe');

// Create collections
db.createCollection('users');
db.createCollection('games');
db.createCollection('moves');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.games.createIndex({ created_at: -1 });
db.games.createIndex({ player1_id: 1 });
db.games.createIndex({ player2_id: 1 });
db.moves.createIndex({ game_id: 1 });
db.moves.createIndex({ timestamp: -1 });

print('Database initialized successfully');
