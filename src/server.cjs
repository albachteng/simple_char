/**
 * Express server entry point with graceful shutdown handling
 * Starts the HTTP server and handles process signals for clean shutdown
 */

const app = require('./app.cjs');
const { logger } = require('./logger.cjs');

/** @type {number} Server port from environment or default */
const PORT = process.env.PORT || 3001;

/** @type {string} Server host from environment or default */
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Graceful shutdown handler for process signals
 * @param {string} signal - The signal name (SIGTERM, SIGINT, etc.)
 */
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forceful shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(PORT, HOST, () => {
  logger.info('Server started', {
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * Handle server startup errors
 * @param {Error} error - Server error object
 */
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  } else {
    logger.error('Server error', { error: error.message, stack: error.stack });
  }
  process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Handle uncaught exceptions
 * @param {Error} error - Uncaught exception
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 * @param {*} reason - Rejection reason
 * @param {Promise} promise - The rejected promise
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

module.exports = server;