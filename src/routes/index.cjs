/**
 * Main API router combining all route modules
 * Sets up the primary API routes and provides health check endpoint
 */

const { Router } = require('express');
const authRoutes = require('./auth.cjs');
const adminRoutes = require('./admin.cjs');

const router = Router();

/**
 * API health check endpoint
 * @route GET /api/health
 * @desc Check API health and status
 * @access Public
 * @returns { success: boolean, message: string, timestamp: string, version: string }
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Mount API route modules
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

/**
 * 404 handler for unknown API routes
 * @route ALL /api/*
 * @desc Handle requests to non-existent API endpoints
 * @access Public
 * @returns { success: boolean, error: string, code: string, path: string }
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

module.exports = router;