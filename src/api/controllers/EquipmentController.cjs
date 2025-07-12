/**
 * Equipment Template Controller
 * Handles API endpoints for equipment templates
 */

const { ResponseUtil } = require('../../utils/ResponseUtil.cjs');

/**
 * @typedef {Object} EquipmentTemplate
 * @property {number} id - Equipment template ID
 * @property {string} name - Equipment name
 * @property {string} type - Equipment type (weapon, armor, shield)
 * @property {string} subtype - Equipment subtype (two-hand, one-hand, finesse, etc.)
 * @property {string} description - Equipment description
 * @property {number} base_ac_bonus - AC bonus provided
 * @property {number} base_attack_bonus - Attack bonus provided
 * @property {string|null} base_damage_dice - Damage dice (e.g., "1d8")
 * @property {number} str_requirement - STR requirement
 * @property {number} dex_requirement - DEX requirement
 * @property {number} int_requirement - INT requirement
 * @property {string} valid_slots - JSON array of valid equipment slots
 * @property {string} conflicts_with - JSON array of conflicting slots
 * @property {boolean} is_active - Whether template is active
 */

class EquipmentController {
  /**
   * @param {Object} knex - Knex database instance
   * @param {Object} logger - Logger instance
   */
  constructor(knex, logger) {
    this.knex = knex;
    this.logger = logger;
  }

  /**
   * Get all equipment templates
   * GET /api/equipment/templates
   */
  async getEquipmentTemplates(req, res) {
    try {
      const { type } = req.query;

      let query = this.knex('equipment_templates')
        .where('is_active', true)
        .orderBy('type')
        .orderBy('name');

      if (type) {
        query = query.where('type', type);
      }

      const templates = await query;

      // Parse JSON fields
      const parsedTemplates = templates.map(template => ({
        ...template,
        valid_slots: JSON.parse(template.valid_slots),
        conflicts_with: JSON.parse(template.conflicts_with)
      }));

      this.logger.info(`Retrieved ${templates.length} equipment templates`, {
        type: type || 'all',
        count: templates.length
      });

      return ResponseUtil.success(res, {
        templates: parsedTemplates,
        count: templates.length
      });

    } catch (error) {
      this.logger.error('Failed to get equipment templates:', error);
      return ResponseUtil.error(res, 'Failed to retrieve equipment templates', 500);
    }
  }

  /**
   * Get equipment template by ID
   * GET /api/equipment/templates/:id
   */
  async getEquipmentTemplate(req, res) {
    try {
      const { id } = req.params;

      const template = await this.knex('equipment_templates')
        .where('id', id)
        .where('is_active', true)
        .first();

      if (!template) {
        return ResponseUtil.error(res, 'Equipment template not found', 404);
      }

      // Parse JSON fields
      const parsedTemplate = {
        ...template,
        valid_slots: JSON.parse(template.valid_slots),
        conflicts_with: JSON.parse(template.conflicts_with)
      };

      this.logger.info(`Retrieved equipment template: ${template.name}`, {
        id,
        name: template.name,
        type: template.type
      });

      return ResponseUtil.success(res, { template: parsedTemplate });

    } catch (error) {
      this.logger.error('Failed to get equipment template:', error);
      return ResponseUtil.error(res, 'Failed to retrieve equipment template', 500);
    }
  }

  /**
   * Get equipment templates by type
   * GET /api/equipment/templates/type/:type
   */
  async getEquipmentTemplatesByType(req, res) {
    try {
      const { type } = req.params;

      const templates = await this.knex('equipment_templates')
        .where('type', type)
        .where('is_active', true)
        .orderBy('name');

      // Parse JSON fields
      const parsedTemplates = templates.map(template => ({
        ...template,
        valid_slots: JSON.parse(template.valid_slots),
        conflicts_with: JSON.parse(template.conflicts_with)
      }));

      this.logger.info(`Retrieved ${templates.length} ${type} templates`, {
        type,
        count: templates.length
      });

      return ResponseUtil.success(res, {
        templates: parsedTemplates,
        type,
        count: templates.length
      });

    } catch (error) {
      this.logger.error('Failed to get equipment templates by type:', error);
      return ResponseUtil.error(res, 'Failed to retrieve equipment templates', 500);
    }
  }
}

module.exports = { EquipmentController };