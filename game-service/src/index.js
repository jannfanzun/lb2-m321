require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const cors = require('cors');
const connectDB = require('./config/database');
const gameRoutes = require('./routes/gameRoutes');
const socketHandler = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3002;
let isShuttingDown = false;

// Redis setup for Socket.IO adapter
let redisClient = null;

async function setupRedisAdapter() {
  try {
    const pubClient = createClient({
      host: process.env.REDIS_HOST || 'redis',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined
    });

    pubClient.on('error', err => console.log('Redis error:', err));
    pubClient.on('connect', () => console.log('[' + new Date().toISOString() + '] Redis connected'));

    await pubClient.connect();

    const subClient = pubClient.duplicate();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    redisClient = pubClient;

    console.log('[' + new Date().toISOString() + '] Socket.IO Redis adapter configured');
  } catch (error) {
    console.error('[' + new Date().toISOString() + '] Failed to setup Redis adapter:', error);
    console.log('[' + new Date().toISOString() + '] Falling back to default adapter (single instance mode)');
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Database connection
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Setup Redis adapter
setupRedisAdapter();

// Routes
app.use('/api/games', gameRoutes);

// Health check endpoint with detailed status
app.get('/health', async (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({
      status: 'SHUTTING_DOWN',
      service: 'game-service',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Check database connectivity
    const mongo = require('mongoose');
    const dbConnected = mongo.connection.readyState === 1;

    if (!dbConnected) {
      return res.status(503).json({
        status: 'DOWN',
        service: 'game-service',
        database: 'DISCONNECTED',
        timestamp: new Date().toISOString()
      });
    }

    // Get connected clients count
    const clientsCount = io.engine.clientsCount || 0;

    res.status(200).json({
      status: 'UP',
      service: 'game-service',
      database: 'CONNECTED',
      connectedClients: clientsCount,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      service: 'game-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ready check endpoint
app.get('/ready', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ ready: false, message: 'Service is shutting down' });
  }
  res.status(200).json({ ready: true });
});

// Socket.IO
socketHandler(io, redisClient);

// Start server
server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Game Service running on port ${PORT}`);
});

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\n[${new Date().toISOString()}] Received ${signal}. Starting graceful shutdown...`);
  isShuttingDown = true;

  // Notify all connected clients
  io.emit('server:shutdown', {
    message: 'Server is shutting down gracefully'
  });

  // Disconnect all clients
  io.disconnectSockets();

  // Stop accepting new connections
  server.close(async () => {
    console.log('[' + new Date().toISOString() + '] HTTP server closed');

    // Close Redis connection
    if (redisClient) {
      try {
        await redisClient.quit();
        console.log('[' + new Date().toISOString() + '] Redis disconnected');
      } catch (error) {
        console.error('Error disconnecting from Redis:', error);
      }
    }

    // Close database connection
    try {
      const mongo = require('mongoose');
      await mongo.disconnect();
      console.log('[' + new Date().toISOString() + '] MongoDB disconnected');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }

    console.log('[' + new Date().toISOString() + '] Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('[' + new Date().toISOString() + '] Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[' + new Date().toISOString() + '] Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[' + new Date().toISOString() + '] Unhandled Rejection at:', promise, 'reason:', reason);
});
