/**
 * Equipment Routes
 * Routes for equipment template management
 */

const express = require('express');
const { EquipmentController } = require('../controllers/EquipmentController.cjs');

/**
 * Create equipment routes
 * @param {Object} knex - Knex database instance
 * @param {Object} logger - Logger instance
 * @returns {express.Router} Router instance
 */
function createEquipmentRoutes(knex, logger) {
  const router = express.Router();
  const equipmentController = new EquipmentController(knex, logger);

  // GET /api/equipment/templates - Get all equipment templates (with optional type filter)
  router.get('/templates', (req, res) => {
    equipmentController.getEquipmentTemplates(req, res);
  });

  // GET /api/equipment/templates/:id - Get specific equipment template
  router.get('/templates/:id', (req, res) => {
    equipmentController.getEquipmentTemplate(req, res);
  });

  // GET /api/equipment/templates/type/:type - Get equipment templates by type
  router.get('/templates/type/:type', (req, res) => {
    equipmentController.getEquipmentTemplatesByType(req, res);
  });

  return router;
}

module.exports = { createEquipmentRoutes };