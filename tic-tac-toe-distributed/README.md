# Tic-Tac-Toe Distributed System

Ein verteiltes Tic-Tac-Toe-System entwickelt im Rahmen des Moduls M321.

## Team
- **Jann Fanzun**: User-Service, Database, API-Gateway
- **Noah Benz**: Game-Service, Web-Client

## Services
- `user-service` (Port 3001): Benutzerauthentifizierung
- `game-service` (Port 3002): Spiellogik und WebSockets
- `api-gateway` (Port 3000): Routing und Load Balancing
- `web-client` (Port 8080): Frontend

## Entwicklung starten
```bash
# Alle Services starten
docker-compose up -d

# Oder einzeln:
cd user-service && npm start
cd game-service && npm start
cd api-gateway && npm start