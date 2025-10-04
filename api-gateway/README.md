# API Gateway

## Overview
This API Gateway serves as the single entry point for all client requests, routing them to the appropriate microservices.

## Features
- **Routing**: Routes requests to User Service and Game Service
- **CORS**: Configured for cross-origin requests
- **Load Balancing**: Ready for multiple service instances
- **WebSocket Support**: Proxies WebSocket connections for real-time gaming
- **Health Checks**: Monitors service availability

## Routes

### User Service Routes
- `POST /api/users/register` → User Service
- `POST /api/users/login` → User Service
- `GET /api/users/profile` → User Service
- `PUT /api/users/profile` → User Service

### Game Service Routes
- `POST /api/games/create` → Game Service
- `POST /api/games/:id/join` → Game Service
- `GET /api/games/:id` → Game Service

### WebSocket
- `/socket.io/*` → Game Service (WebSocket)

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3000
USER_SERVICE_URL=http://localhost:3001
GAME_SERVICE_URL=http://localhost:3002
```

## Running

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production mode
npm start
```

## Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "UP",
  "service": "api-gateway",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```
