# Database Setup

## MongoDB Schema

### Collections

#### Users
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  created_at: Date
}
```

#### Games
```javascript
{
  _id: ObjectId,
  player1_id: String,
  player2_id: String,
  board: [String] (9 elements),
  current_player: String ('X' or 'O'),
  status: String ('waiting', 'active', 'finished'),
  winner: String (null, 'X', 'O', or 'draw'),
  created_at: Date
}
```

#### Moves
```javascript
{
  _id: ObjectId,
  game_id: ObjectId (ref: Game),
  player_id: String,
  position: Number (0-8),
  timestamp: Date
}
```

## Setup Instructions

### Using Docker
The database will be automatically initialized when running `docker-compose up`.

### Manual Setup
1. Install MongoDB locally
2. Run: `mongod --dbpath /path/to/data`
3. In another terminal: `mongo < init-mongo.js`

## Backup Strategy

### Daily Backups
```bash
mongodump --db tictactoe --out /backup/$(date +%Y%m%d)
```

### Restore
```bash
mongorestore --db tictactoe /backup/YYYYMMDD/tictactoe
```
