// Error Handler Utility with Retry Logic

/**
 * Retry decorator for database operations
 * @param {Function} operation - The async operation to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 */
async function retryOperation(operation, maxRetries = 3, delayMs = 100) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`[Retry] Attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Normalize error response
 */
function normalizeError(error) {
  return {
    message: error.message || 'Unknown error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };
}

/**
 * Handle async route errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Log error with context
 */
function logError(error, context = {}) {
  console.error('[Error]', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    context,
    timestamp: new Date().toISOString()
  });
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error) {
  // Transient errors that should be retried
  const retryableErrorCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'MongoNetworkError',
    'MongoWriteConcernError'
  ];

  return (
    retryableErrorCodes.includes(error.code) ||
    retryableErrorCodes.some(code => error.message?.includes(code))
  );
}

module.exports = {
  retryOperation,
  normalizeError,
  asyncHandler,
  logError,
  isRetryableError
};
