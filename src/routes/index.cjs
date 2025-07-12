/**
 * Main API Routes
 * Central route registration and organization
 */

const { Router } = require('express');
const authRoutes = require('./simple-auth.cjs');
// const adminRoutes = require('./admin.cjs');
const { createEquipmentRoutes } = require('../api/routes/equipmentRoutes.cjs');

/**
 * Create main API router
 * @param {Object} knex - Knex database instance
 * @param {Object} logger - Logger instance
 * @returns {Router} Express router
 */
function createMainRouter(knex, logger) {
  const router = Router();

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API routes
  router.use('/auth', authRoutes);
  // router.use('/admin', adminRoutes);
  router.use('/equipment', createEquipmentRoutes(knex, logger));

  // 404 handler for unknown API routes
  router.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      code: 'NOT_FOUND',
      path: req.originalUrl
    });
  });

  return router;
}

module.exports = createMainRouter;