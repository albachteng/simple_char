/**
 * Character controller handling character CRUD operations
 * Provides REST API endpoints for character management with database storage
 */

const { getDatabase } = require('../database/connection.cjs');
const { logger } = require('../test-logger.cjs');
const crypto = require('crypto');

/**
 * Character controller for managing database-stored characters
 * Converts between SavedCharacter interface and database schema
 */
class CharacterController {
  constructor() {
    this.knex = getDatabase();
  }

  /**
   * Convert SavedCharacter to database format
   * @param {Object} character - SavedCharacter interface object
   * @param {number} userId - User ID from JWT token
   * @returns {Object} Database character record
   */
  toDatabase(character, userId) {
    const { name, hash, data, timestamp } = character;
    
    // Calculate current stats from base stats + racial bonuses
    const baseStats = {
      str: data.high === 'str' ? 16 : (data.mid === 'str' ? 10 : 6),
      dex: data.high === 'dex' ? 16 : (data.mid === 'dex' ? 10 : 6),
      int: data.high === 'int' ? 16 : (data.mid === 'int' ? 10 : 6)
    };

    // Apply stat overrides if enabled
    const currentStats = data.useStatOverrides && data.statModifiers ? {
      str: data.statModifiers.str,
      dex: data.statModifiers.dex,
      int: data.statModifiers.int
    } : baseStats;

    return {
      user_id: userId,
      name: name,
      high_stat: data.high,
      mid_stat: data.mid,
      race: data.race,
      racial_bonuses: data.racialBonuses || [],
      current_str: currentStats.str,
      current_dex: currentStats.dex,
      current_int: currentStats.int,
      level: data.level || 1,
      current_hp: this.calculateCurrentHP(data.hp_rolls || []),
      pending_level_up_points: data.pending_level_up_points || 0,
      use_stat_overrides: data.useStatOverrides || false,
      str_override: data.statModifiers?.str || null,
      dex_override: data.statModifiers?.dex || null,
      int_override: data.statModifiers?.int || null,
      sorcery_threshold_level: data.sorceryThresholdLevel || null,
      double_sorcery_threshold_level: data.doubleSorceryThresholdLevel || null,
      finesse_threshold_level: data.finesseThresholdLevel || null,
      data_hash: hash,
      created_at: new Date(timestamp),
      updated_at: new Date(),
      last_accessed: new Date()
    };
  }

  /**
   * Convert database record to SavedCharacter format
   * @param {Object} dbCharacter - Database character record
   * @param {Array} progressionData - Character progression records
   * @param {Array} inventoryData - Character inventory records
   * @returns {Object} SavedCharacter interface object
   */
  fromDatabase(dbCharacter, progressionData = [], inventoryData = []) {
    // Reconstruct HP rolls from progression data
    const hp_rolls = progressionData
      .sort((a, b) => a.level - b.level)
      .map(p => p.hp_roll || 0);

    // Reconstruct level up choices from progression data
    const level_up_choices = progressionData
      .sort((a, b) => a.level - b.level)
      .map(p => p.stat_choice || '');

    // Reconstruct inventory from inventory data
    const inventory = inventoryData.reduce((acc, item) => {
      acc[item.slot] = {
        template_id: item.template_id,
        customization: item.customization ? JSON.parse(item.customization) : null,
        equipped: item.equipped
      };
      return acc;
    }, {});

    return {
      name: dbCharacter.name,
      hash: dbCharacter.data_hash,
      data: {
        high: dbCharacter.high_stat,
        mid: dbCharacter.mid_stat,
        race: dbCharacter.race,
        racialBonuses: Array.isArray(dbCharacter.racial_bonuses) ? dbCharacter.racial_bonuses : [],
        level: dbCharacter.level,
        hp_rolls: hp_rolls,
        level_up_choices: level_up_choices,
        pending_level_up_points: dbCharacter.pending_level_up_points,
        armor: inventory.armor?.template_id || '',
        weapon: inventory.weapon?.template_id || '',
        shield: inventory.shield?.equipped || false,
        inventory: inventory,
        useStatOverrides: dbCharacter.use_stat_overrides,
        statModifiers: dbCharacter.use_stat_overrides ? {
          str: dbCharacter.str_override,
          dex: dbCharacter.dex_override,
          int: dbCharacter.int_override
        } : undefined,
        sorceryThresholdLevel: dbCharacter.sorcery_threshold_level,
        doubleSorceryThresholdLevel: dbCharacter.double_sorcery_threshold_level,
        finesseThresholdLevel: dbCharacter.finesse_threshold_level
      },
      timestamp: new Date(dbCharacter.created_at).getTime()
    };
  }

  /**
   * Calculate current HP from HP rolls
   * @param {Array} hp_rolls - Array of HP rolls for each level
   * @returns {number} Current HP
   */
  calculateCurrentHP(hp_rolls) {
    if (!hp_rolls || hp_rolls.length === 0) return 10; // Default starting HP
    return hp_rolls.reduce((total, roll) => total + roll, 10); // Base 10 + rolls
  }

  /**
   * Generate character hash for data integrity
   * @param {Object} character - Character data
   * @returns {string} SHA-256 hash
   */
  generateHash(character) {
    const hashString = JSON.stringify(character.data);
    return crypto.createHash('sha256').update(hashString).digest('hex').substring(0, 16);
  }

  /**
   * List all characters for the authenticated user
   * @route GET /api/characters
   */
  async listCharacters(req, res) {
    try {
      const userId = req.user.userId;
      
      if (!userId) {
        logger.error('No userId found in request.user:', req.user);
        return res.status(400).json({
          success: false,
          error: 'User ID not found in authentication data',
          timestamp: new Date().toISOString()
        });
      }
      
      const characters = await this.knex('characters')
        .where('user_id', userId)
        .orderBy('updated_at', 'desc');

      // Convert to SavedCharacter format
      const savedCharacters = characters.map(char => ({
        name: char.name,
        hash: char.data_hash,
        data: {
          high: char.high_stat,
          mid: char.mid_stat,
          race: char.race,
          racialBonuses: Array.isArray(char.racial_bonuses) 
            ? char.racial_bonuses 
            : [],
          level: char.level
        },
        timestamp: new Date(char.created_at).getTime()
      }));

      res.json({
        success: true,
        data: savedCharacters,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error listing characters:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        userObject: req.user
      });
      res.status(500).json({
        success: false,
        error: 'Failed to list characters',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Load a specific character by name
   * @route GET /api/characters/:name
   */
  async loadCharacter(req, res) {
    try {
      const userId = req.user.userId;
      const characterName = req.params.name;

      const character = await this.knex('characters')
        .where('user_id', userId)
        .andWhere('name', characterName)
        .first();

      if (!character) {
        return res.status(404).json({
          success: false,
          error: 'Character not found',
          timestamp: new Date().toISOString()
        });
      }

      // Load related data
      const progressionData = await this.knex('character_progression')
        .where('character_id', character.id)
        .orderBy('level', 'asc');

      const inventoryData = await this.knex('character_inventory')
        .where('character_id', character.id);

      // Update last accessed
      await this.knex('characters')
        .where('id', character.id)
        .update('last_accessed', new Date());

      const savedCharacter = this.fromDatabase(character, progressionData, inventoryData);

      res.json({
        success: true,
        data: savedCharacter,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error loading character:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load character',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Save a character to the database
   * @route POST /api/characters
   */
  async saveCharacter(req, res) {
    try {
      const userId = req.user.userId;
      const characterData = req.body;

      // Validate required fields
      if (!characterData.name || !characterData.data) {
        return res.status(400).json({
          success: false,
          error: 'Missing required character data',
          timestamp: new Date().toISOString()
        });
      }

      // Generate hash if not provided
      if (!characterData.hash) {
        characterData.hash = this.generateHash(characterData);
      }

      const dbCharacter = this.toDatabase(characterData, userId);

      // Check if character exists
      const existing = await this.knex('characters')
        .where('user_id', userId)
        .andWhere('name', characterData.name)
        .first();

      let characterId;
      if (existing) {
        // Update existing character
        await this.knex('characters')
          .where('id', existing.id)
          .update(dbCharacter);
        characterId = existing.id;
      } else {
        // Create new character
        const [newCharacter] = await this.knex('characters')
          .insert(dbCharacter)
          .returning('id');
        characterId = newCharacter.id;
      }

      // Save progression data if provided
      if (characterData.data.level_up_choices && characterData.data.level_up_choices.length > 0) {
        await this.knex('character_progression')
          .where('character_id', characterId)
          .del();

        const progressionRecords = characterData.data.level_up_choices.map((choice, index) => ({
          character_id: characterId,
          level: index + 2, // Level 2 is first level up
          stat_choice: choice,
          hp_roll: characterData.data.hp_rolls?.[index] || 0
        }));

        await this.knex('character_progression').insert(progressionRecords);
      }

      // Save inventory data if provided
      if (characterData.data.inventory) {
        await this.knex('character_inventory')
          .where('character_id', characterId)
          .del();

        const inventoryRecords = Object.entries(characterData.data.inventory).map(([slot, item]) => ({
          character_id: characterId,
          slot: slot,
          template_id: item.template_id,
          customization: item.customization ? JSON.stringify(item.customization) : null,
          equipped: item.equipped || false
        }));

        if (inventoryRecords.length > 0) {
          await this.knex('character_inventory').insert(inventoryRecords);
        }
      }

      res.json({
        success: true,
        data: { 
          name: characterData.name,
          hash: characterData.hash 
        },
        message: existing ? 'Character updated successfully' : 'Character created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error saving character:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save character',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Delete a character
   * @route DELETE /api/characters/:name
   */
  async deleteCharacter(req, res) {
    try {
      const userId = req.user.userId;
      const characterName = req.params.name;

      const deleted = await this.knex('characters')
        .where('user_id', userId)
        .andWhere('name', characterName)
        .del();

      if (deleted === 0) {
        return res.status(404).json({
          success: false,
          error: 'Character not found',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Character deleted successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error deleting character:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete character',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = { CharacterController };