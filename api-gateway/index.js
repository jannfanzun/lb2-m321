require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
let isShuttingDown = false;

// ============================================
// Circuit Breaker Implementation
// ============================================
class CircuitBreaker {
  constructor(name, failureThreshold = 5, resetTimeout = 60000) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  recordSuccess() {
    this.failureCount = 0;
    if (this.state !== 'CLOSED') {
      console.log(`[Circuit Breaker] ${this.name}: Recovered to CLOSED state`);
      this.state = 'CLOSED';
    }
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold && this.state === 'CLOSED') {
      console.error(`[Circuit Breaker] ${this.name}: OPENED after ${this.failureCount} failures`);
      this.state = 'OPEN';

      // Try to recover after resetTimeout
      setTimeout(() => {
        console.log(`[Circuit Breaker] ${this.name}: Attempting HALF_OPEN state`);
        this.state = 'HALF_OPEN';
      }, this.resetTimeout);
    }
  }

  isAvailable() {
    return this.state !== 'OPEN';
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failureCount,
      lastFailure: this.lastFailureTime
    };
  }
}

// Initialize circuit breakers
const userServiceBreaker = new CircuitBreaker('user-service', 5, 60000);
const gameServiceBreaker = new CircuitBreaker('game-service', 5, 60000);

// ============================================
// Middleware
// ============================================
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

// ============================================
// Health & Status Endpoints
// ============================================
app.get('/health', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({
      status: 'SHUTTING_DOWN',
      service: 'api-gateway',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    status: 'UP',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Circuit breaker status endpoint
app.get('/status/circuit-breakers', (req, res) => {
  res.status(200).json({
    circuitBreakers: [
      userServiceBreaker.getStatus(),
      gameServiceBreaker.getStatus()
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ ready: false, message: 'Gateway is shutting down' });
  }
  res.status(200).json({ ready: true });
});

// ============================================
// Routes with Circuit Breaker Protection
// ============================================

// Route to User Service
app.use('/api/users', (req, res, next) => {
  if (!userServiceBreaker.isAvailable()) {
    return res.status(503).json({
      error: 'User service temporarily unavailable (circuit breaker open)',
      service: 'user-service',
      state: userServiceBreaker.state
    });
  }

  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    onError: (err, req, res) => {
      userServiceBreaker.recordFailure();
      console.error('[User Service Error]', err.message);
      res.status(503).json({
        error: 'User service unavailable',
        details: err.message
      });
    },
    onProxyRes: (proxyRes, req, res) => {
      if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
        userServiceBreaker.recordSuccess();
      } else if (proxyRes.statusCode >= 500) {
        userServiceBreaker.recordFailure();
      }
    }
  })(req, res, next);
});

// Route to Game Service (REST API)
app.use('/api/games', (req, res, next) => {
  if (!gameServiceBreaker.isAvailable()) {
    return res.status(503).json({
      error: 'Game service temporarily unavailable (circuit breaker open)',
      service: 'game-service',
      state: gameServiceBreaker.state
    });
  }

  createProxyMiddleware({
    target: process.env.GAME_SERVICE_URL,
    changeOrigin: true,
    onError: (err, req, res) => {
      gameServiceBreaker.recordFailure();
      console.error('[Game Service Error]', err.message);
      res.status(503).json({
        error: 'Game service unavailable',
        details: err.message
      });
    },
    onProxyRes: (proxyRes, req, res) => {
      if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
        gameServiceBreaker.recordSuccess();
      } else if (proxyRes.statusCode >= 500) {
        gameServiceBreaker.recordFailure();
      }
    }
  })(req, res, next);
});

// Route to Game Service (WebSocket)
app.use('/socket.io', (req, res, next) => {
  if (!gameServiceBreaker.isAvailable()) {
    return res.status(503).json({
      error: 'WebSocket service temporarily unavailable (circuit breaker open)',
      service: 'game-service',
      state: gameServiceBreaker.state
    });
  }

  createProxyMiddleware({
    target: process.env.GAME_SERVICE_URL,
    changeOrigin: true,
    ws: true,
    onError: (err, req, res) => {
      gameServiceBreaker.recordFailure();
      console.error('[WebSocket Error]', err.message);
      if (res) {
        res.status(503).json({
          error: 'WebSocket service unavailable',
          details: err.message
        });
      }
    }
  })(req, res, next);
});

// ============================================
// Error Handling
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Gateway Error]', err);
  res.status(500).json({
    error: 'Internal gateway error',
    message: err.message
  });
});

// ============================================
// Server Startup & Shutdown
// ============================================
const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] API Gateway running on port ${PORT}`);
  console.log(`[${new Date().toISOString()}] Routing to:`);
  console.log(`  - User Service: ${process.env.USER_SERVICE_URL}`);
  console.log(`  - Game Service: ${process.env.GAME_SERVICE_URL}`);
});

// Handle WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  console.log(`[${new Date().toISOString()}] WebSocket upgrade request: ${req.url}`);
});

// ============================================
// Graceful Shutdown
// ============================================
async function gracefulShutdown(signal) {
  console.log(`\n[${new Date().toISOString()}] Received ${signal}. Starting graceful shutdown...`);
  isShuttingDown = true;

  server.close(async () => {
    console.log('[' + new Date().toISOString() + '] HTTP server closed');
    console.log('[' + new Date().toISOString() + '] Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('[' + new Date().toISOString() + '] Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('[' + new Date().toISOString() + '] Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[' + new Date().toISOString() + '] Unhandled Rejection:', reason);
});
