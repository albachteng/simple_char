/**
 * Character routes for character management
 * Provides REST API endpoints for character CRUD operations
 */

const { Router } = require('express');
const { CharacterController } = require('../controllers/CharacterController.cjs');

// Conditionally load authentication middleware based on AUTH_MODE
const AUTH_MODE = process.env.AUTH_MODE || 'real';
const { authMiddleware } = AUTH_MODE === 'mock' 
  ? require('../middleware/mock-auth.cjs')
  : require('../middleware/auth.cjs');

const router = Router();
const characterController = new CharacterController();

/**
 * Get all characters for the authenticated user
 * @route GET /api/characters
 * @desc List all characters for the authenticated user
 * @access Private
 * @returns { success: boolean, data: SavedCharacter[], timestamp: string }
 */
router.get('/', authMiddleware.authenticate, characterController.listCharacters.bind(characterController));

/**
 * Get a specific character by name
 * @route GET /api/characters/:name
 * @desc Load a specific character by name
 * @access Private
 * @param {string} name - Character name
 * @returns { success: boolean, data: SavedCharacter, timestamp: string }
 */
router.get('/:name', authMiddleware.authenticate, characterController.loadCharacter.bind(characterController));

/**
 * Create or update a character
 * @route POST /api/characters
 * @desc Save a character to the database
 * @access Private
 * @body { name: string, data: CharacterData, hash?: string }
 * @returns { success: boolean, data: { name: string, hash: string }, message: string, timestamp: string }
 */
router.post('/', authMiddleware.authenticate, characterController.saveCharacter.bind(characterController));

/**
 * Delete a character
 * @route DELETE /api/characters/:name
 * @desc Delete a character by name
 * @access Private
 * @param {string} name - Character name
 * @returns { success: boolean, message: string, timestamp: string }
 */
router.delete('/:name', authMiddleware.authenticate, characterController.deleteCharacter.bind(characterController));

module.exports = router;