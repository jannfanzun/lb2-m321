require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

let db = null;
let isShuttingDown = false;

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
connectDB().then(connection => {
  db = connection;
}).catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Routes
app.use('/api/users', userRoutes);

// Health check endpoint with detailed status
app.get('/health', async (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({
      status: 'SHUTTING_DOWN',
      service: 'user-service',
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
        service: 'user-service',
        database: 'DISCONNECTED',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      status: 'UP',
      service: 'user-service',
      database: 'CONNECTED',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      service: 'user-service',
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

// Start server
const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] User Service running on port ${PORT}`);
});

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\n[${new Date().toISOString()}] Received ${signal}. Starting graceful shutdown...`);
  isShuttingDown = true;

  // Stop accepting new connections
  server.close(async () => {
    console.log('[' + new Date().toISOString() + '] HTTP server closed');

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
