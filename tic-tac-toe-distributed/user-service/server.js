require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/database');
const userRoutes = require('./src/routes/userRoutes');
const logger = require('../shared/utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

app.use((error, req, res, next) => {
  logger.error('User Service Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`User Service running on port ${PORT}`);
  console.log(`🚀 User Service started on http://localhost:${PORT}`);
});