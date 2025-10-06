require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Route to User Service
app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('User Service Error:', err);
    res.status(503).json({ error: 'User service unavailable' });
  }
}));

// Route to Game Service (REST API)
app.use('/api/games', createProxyMiddleware({
  target: process.env.GAME_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Game Service Error:', err);
    res.status(503).json({ error: 'Game service unavailable' });
  }
}));

// Route to Game Service (WebSocket)
app.use('/socket.io', createProxyMiddleware({
  target: process.env.GAME_SERVICE_URL,
  changeOrigin: true,
  ws: true,
  onError: (err, req, res) => {
    console.error('WebSocket Error:', err);
    if (res) {
      res.status(503).json({ error: 'WebSocket service unavailable' });
    }
  }
}));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(500).json({ error: 'Internal gateway error' });
});

const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Routing to:`);
  console.log(`  - User Service: ${process.env.USER_SERVICE_URL}`);
  console.log(`  - Game Service: ${process.env.GAME_SERVICE_URL}`);
});

// Handle WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  console.log('WebSocket upgrade request');
});
