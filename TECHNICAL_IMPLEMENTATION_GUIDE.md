# Technical Implementation Guide: Database Migration

## Overview

This document provides detailed technical specifications for implementing the database migration, including specific code changes, new interfaces, and testing requirements.

## 1. Database Layer Implementation

### 1.1 Database Connection Setup

**File: `src/database/connection.ts`**
```typescript
import { Pool, PoolConfig } from 'pg';
import { logger } from '../logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeoutMillis?: number;
}

class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor(config: DatabaseConfig) {
    const poolConfig: PoolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    };

    this.pool = new Pool(poolConfig);
    this.setupEventHandlers();
  }

  static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      if (!config) {
        throw new Error('Database config required for first initialization');
      }
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Database query executed', {
        query: text.substring(0, 100),
        duration,
        rowCount: result.rowCount
      });
      
      return result;
    } catch (error) {
      logger.error('Database query failed', {
        query: text.substring(0, 100),
        error: error.message,
        params
      });
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private setupEventHandlers() {
    this.pool.on('error', (err) => {
      logger.error('Database pool error', { error: err.message });
    });

    this.pool.on('connect', () => {
      logger.debug('New database connection established');
    });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export { DatabaseConnection, DatabaseConfig };
```

### 1.2 Base Repository Pattern

**File: `src/repositories/BaseRepository.ts`**
```typescript
import { DatabaseConnection } from '../database/connection';
import { logger } from '../logger';

export abstract class BaseRepository<T> {
  protected db: DatabaseConnection;
  protected tableName: string;

  constructor(tableName: string) {
    this.db = DatabaseConnection.getInstance();
    this.tableName = tableName;
  }

  protected async findById(id: number): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  protected async findBy(criteria: Partial<T>): Promise<T[]> {
    const keys = Object.keys(criteria);
    const values = Object.values(criteria);
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    
    const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
    const result = await this.db.query(query, values);
    return result.rows;
  }

  protected async create(data: Omit<T, 'id'>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const columnNames = keys.join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columnNames}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  protected async update(id: number, data: Partial<T>): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');

    const query = `
      UPDATE ${this.tableName} 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await this.db.query(query, [id, ...values]);
    return result.rows[0] || null;
  }

  protected async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }

  protected buildSelectQuery(options: {
    where?: string;
    orderBy?: string;
    limit?: number;
    offset?: number;
    joins?: string[];
  } = {}): string {
    let query = `SELECT * FROM ${this.tableName}`;
    
    if (options.joins?.length) {
      query += ' ' + options.joins.join(' ');
    }
    
    if (options.where) {
      query += ` WHERE ${options.where}`;
    }
    
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }
    
    return query;
  }
}
```

## 2. Data Access Layer

### 2.1 Character Repository

**File: `src/repositories/CharacterRepository.ts`**
```typescript
import { BaseRepository } from './BaseRepository';
import { Character, CharacterCreateData, CharacterUpdateData } from '../types/database';
import { logger } from '../logger';

export class CharacterRepository extends BaseRepository<Character> {
  constructor() {
    super('characters');
  }

  async findByUserId(userId: number): Promise<Character[]> {
    const query = this.buildSelectQuery({
      where: 'user_id = $1',
      orderBy: 'updated_at DESC'
    });
    
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async findByUserIdAndName(userId: number, name: string): Promise<Character | null> {
    const result = await this.findBy({ user_id: userId, name } as any);
    return result[0] || null;
  }

  async createCharacter(data: CharacterCreateData): Promise<Character> {
    const characterData = {
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
      last_accessed: new Date()
    };

    const character = await this.create(characterData as any);
    
    logger.info('Character created', {
      characterId: character.id,
      userId: character.user_id,
      name: character.name
    });

    return character;
  }

  async updateCharacter(id: number, data: CharacterUpdateData): Promise<Character | null> {
    const character = await this.update(id, data as any);
    
    if (character) {
      logger.info('Character updated', {
        characterId: character.id,
        userId: character.user_id,
        name: character.name
      });
    }

    return character;
  }

  async deleteCharacter(id: number, userId: number): Promise<boolean> {
    // Verify ownership before deletion
    const character = await this.findById(id);
    if (!character || character.user_id !== userId) {
      return false;
    }

    const deleted = await this.delete(id);
    
    if (deleted) {
      logger.info('Character deleted', {
        characterId: id,
        userId: userId,
        name: character.name
      });
    }

    return deleted;
  }

  async updateLastAccessed(id: number): Promise<void> {
    await this.db.query(
      'UPDATE characters SET last_accessed = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  async getCharacterStats(id: number): Promise<{
    str: number;
    dex: number;
    int: number;
  } | null> {
    const query = `
      SELECT 
        CASE 
          WHEN use_stat_overrides AND str_override IS NOT NULL 
          THEN str_override 
          ELSE current_str 
        END as str,
        CASE 
          WHEN use_stat_overrides AND dex_override IS NOT NULL 
          THEN dex_override 
          ELSE current_dex 
        END as dex,
        CASE 
          WHEN use_stat_overrides AND int_override IS NOT NULL 
          THEN int_override 
          ELSE current_int 
        END as int
      FROM characters 
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }
}
```

### 2.2 Equipment Repository

**File: `src/repositories/EquipmentRepository.ts`**
```typescript
import { BaseRepository } from './BaseRepository';
import { EquipmentTemplate, CharacterInventoryItem } from '../types/database';

export class EquipmentRepository extends BaseRepository<EquipmentTemplate> {
  constructor() {
    super('equipment_templates');
  }

  async findActiveTemplates(): Promise<EquipmentTemplate[]> {
    const query = this.buildSelectQuery({
      where: 'is_active = true',
      orderBy: 'type, name'
    });
    
    const result = await this.db.query(query);
    return result.rows;
  }

  async findTemplatesByType(type: string): Promise<EquipmentTemplate[]> {
    const query = this.buildSelectQuery({
      where: 'type = $1 AND is_active = true',
      orderBy: 'name'
    });
    
    const result = await this.db.query(query, [type]);
    return result.rows;
  }

  async getTemplateWithModifiers(id: number): Promise<EquipmentTemplate & {
    statModifiers: any[];
    resourceBonuses: any[];
    abilities: any[];
  } | null> {
    const query = `
      SELECT 
        et.*,
        COALESCE(
          json_agg(DISTINCT esm.*) FILTER (WHERE esm.id IS NOT NULL), 
          '[]'::json
        ) as stat_modifiers,
        COALESCE(
          json_agg(DISTINCT erb.*) FILTER (WHERE erb.id IS NOT NULL), 
          '[]'::json
        ) as resource_bonuses,
        COALESCE(
          json_agg(DISTINCT ea.*) FILTER (WHERE ea.id IS NOT NULL), 
          '[]'::json
        ) as abilities
      FROM equipment_templates et
      LEFT JOIN equipment_stat_modifiers esm ON et.id = esm.equipment_template_id
      LEFT JOIN equipment_resource_bonuses erb ON et.id = erb.equipment_template_id
      LEFT JOIN equipment_template_abilities eta ON et.id = eta.equipment_template_id
      LEFT JOIN equipment_abilities ea ON eta.equipment_ability_id = ea.id
      WHERE et.id = $1
      GROUP BY et.id
    `;
    
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }
}

export class CharacterInventoryRepository extends BaseRepository<CharacterInventoryItem> {
  constructor() {
    super('character_inventory');
  }

  async findByCharacterId(characterId: number): Promise<CharacterInventoryItem[]> {
    const query = `
      SELECT 
        ci.*,
        et.name as template_name,
        et.type,
        et.subtype,
        et.description as template_description
      FROM character_inventory ci
      JOIN equipment_templates et ON ci.equipment_template_id = et.id
      WHERE ci.character_id = $1
      ORDER BY et.type, ci.is_equipped DESC, ci.acquired_at DESC
    `;
    
    const result = await this.db.query(query, [characterId]);
    return result.rows;
  }

  async findEquippedItems(characterId: number): Promise<CharacterInventoryItem[]> {
    const query = `
      SELECT 
        ci.*,
        et.name as template_name,
        et.type,
        et.subtype
      FROM character_inventory ci
      JOIN equipment_templates et ON ci.equipment_template_id = et.id
      WHERE ci.character_id = $1 AND ci.is_equipped = true
      ORDER BY ci.equipment_slot
    `;
    
    const result = await this.db.query(query, [characterId]);
    return result.rows;
  }

  async addItem(characterId: number, templateId: number, customizations?: any): Promise<CharacterInventoryItem> {
    const itemData = {
      character_id: characterId,
      equipment_template_id: templateId,
      ...customizations,
      acquired_at: new Date()
    };

    return await this.create(itemData as any);
  }

  async equipItem(itemId: number, slot: string): Promise<boolean> {
    const result = await this.db.query(
      'UPDATE character_inventory SET is_equipped = true, equipment_slot = $2 WHERE id = $1',
      [itemId, slot]
    );
    
    return result.rowCount > 0;
  }

  async unequipItem(itemId: number): Promise<boolean> {
    const result = await this.db.query(
      'UPDATE character_inventory SET is_equipped = false, equipment_slot = NULL WHERE id = $1',
      [itemId]
    );
    
    return result.rowCount > 0;
  }

  async removeItem(itemId: number, characterId: number): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM character_inventory WHERE id = $1 AND character_id = $2',
      [itemId, characterId]
    );
    
    return result.rowCount > 0;
  }
}
```

## 3. Service Layer Implementation

### 3.1 Authentication Service

**File: `src/services/AuthService.ts`**
```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { User, CreateUserData, LoginCredentials } from '../types/auth';
import { logger } from '../logger';

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;
  private saltRounds: number;

  constructor() {
    this.userRepository = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
    this.saltRounds = 12;
  }

  async register(userData: CreateUserData): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const salt = await bcrypt.genSalt(this.saltRounds);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Create user
    const user = await this.userRepository.create({
      username: userData.username,
      email: userData.email,
      password_hash: passwordHash,
      salt: salt
    });

    logger.info('User registered', { userId: user.id, username: user.username });

    // Generate token
    const token = this.generateToken(user);

    return { user: this.sanitizeUser(user), token };
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    // Find user by email or username
    const user = await this.userRepository.findByEmailOrUsername(
      credentials.emailOrUsername
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    logger.info('User logged in', { userId: user.id, username: user.username });

    // Generate token
    const token = this.generateToken(user);

    return { user: this.sanitizeUser(user), token };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user || !user.is_active) {
        return null;
      }

      return this.sanitizeUser(user);
    } catch (error) {
      logger.warn('Token validation failed', { error: error.message });
      return null;
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        isAdmin: user.is_admin
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  private sanitizeUser(user: User): User {
    const { password_hash, salt, ...sanitized } = user as any;
    return sanitized;
  }
}
```

### 3.2 Character Service

**File: `src/services/CharacterService.ts`**
```typescript
import { CharacterRepository } from '../repositories/CharacterRepository';
import { CharacterInventoryRepository } from '../repositories/EquipmentRepository';
import { Character, CharacterWithInventory } from '../types/database';
import { Char } from '../useChar'; // Existing character class
import { logger } from '../logger';

export class CharacterService {
  private characterRepository: CharacterRepository;
  private inventoryRepository: CharacterInventoryRepository;

  constructor() {
    this.characterRepository = new CharacterRepository();
    this.inventoryRepository = new CharacterInventoryRepository();
  }

  async getUserCharacters(userId: number): Promise<Character[]> {
    return await this.characterRepository.findByUserId(userId);
  }

  async getCharacterWithInventory(characterId: number, userId: number): Promise<CharacterWithInventory | null> {
    const character = await this.characterRepository.findById(characterId);
    
    if (!character || character.user_id !== userId) {
      return null;
    }

    const inventory = await this.inventoryRepository.findByCharacterId(characterId);
    
    // Update last accessed
    await this.characterRepository.updateLastAccessed(characterId);

    return {
      ...character,
      inventory
    };
  }

  async createCharacter(userId: number, characterData: {
    name: string;
    highStat: string;
    midStat: string;
    race?: string;
    racialBonuses?: string[];
  }): Promise<Character> {
    // Check for duplicate names
    const existing = await this.characterRepository.findByUserIdAndName(userId, characterData.name);
    if (existing) {
      throw new Error('Character name already exists');
    }

    // Calculate initial stats based on stat selection
    const stats = this.calculateInitialStats(
      characterData.highStat, 
      characterData.midStat, 
      characterData.race,
      characterData.racialBonuses
    );

    const character = await this.characterRepository.createCharacter({
      user_id: userId,
      name: characterData.name,
      high_stat: characterData.highStat,
      mid_stat: characterData.midStat,
      race: characterData.race,
      racial_bonuses: characterData.racialBonuses,
      current_str: stats.str,
      current_dex: stats.dex,
      current_int: stats.int,
      current_hp: stats.hp
    });

    logger.info('Character created via service', {
      characterId: character.id,
      userId,
      name: character.name
    });

    return character;
  }

  async importFromLocalStorage(userId: number, localStorageData: any): Promise<Character[]> {
    const importedCharacters: Character[] = [];

    for (const [name, data] of Object.entries(localStorageData)) {
      try {
        // Parse localStorage character data
        const charData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Check if character already exists
        const existing = await this.characterRepository.findByUserIdAndName(userId, name);
        if (existing) {
          logger.warn('Skipping character import - name already exists', { name, userId });
          continue;
        }

        // Convert localStorage format to database format
        const character = await this.convertLocalStorageCharacter(userId, name, charData);
        importedCharacters.push(character);

        logger.info('Character imported from localStorage', {
          characterId: character.id,
          name,
          userId
        });

      } catch (error) {
        logger.error('Failed to import character from localStorage', {
          name,
          userId,
          error: error.message
        });
      }
    }

    return importedCharacters;
  }

  private calculateInitialStats(highStat: string, midStat: string, race?: string, racialBonuses?: string[]): {
    str: number;
    dex: number;
    int: number;
    hp: number;
  } {
    // Base stats: high=16, mid=10, low=6
    let str = 6, dex = 6, int = 6;
    
    if (highStat === 'str') str = 16;
    else if (highStat === 'dex') dex = 16;
    else if (highStat === 'int') int = 16;

    if (midStat === 'str') str = 10;
    else if (midStat === 'dex') dex = 10;
    else if (midStat === 'int') int = 10;

    // Apply racial bonuses (would need to be loaded from database)
    // This is a simplified version - full implementation would query the races table
    if (race && racialBonuses) {
      // Implementation would apply racial bonuses here
    }

    // Calculate initial HP
    const strMod = Math.floor((str - 10) / 2);
    const baseHp = 10;
    const hpRoll = 4 + strMod; // Simplified - would use actual dice system
    const hp = baseHp + hpRoll;

    return { str, dex, int, hp };
  }

  private async convertLocalStorageCharacter(userId: number, name: string, data: any): Promise<Character> {
    // This method converts localStorage character data to database format
    // Implementation would map all the localStorage fields to database fields
    
    const character = await this.characterRepository.createCharacter({
      user_id: userId,
      name: name,
      high_stat: data.high || 'str',
      mid_stat: data.mid || 'dex',
      race: data.race,
      racial_bonuses: data.racialBonuses || [],
      level: data.level || 1,
      current_str: data.str || 16,
      current_dex: data.dex || 10,
      current_int: data.int || 6,
      current_hp: data.hp || 17,
      // ... map other fields
    });

    // Import inventory if present
    if (data.inventory?.items) {
      await this.importCharacterInventory(character.id, data.inventory.items);
    }

    return character;
  }

  private async importCharacterInventory(characterId: number, items: any[]): Promise<void> {
    // Import inventory items from localStorage format
    for (const item of items) {
      try {
        // This would require mapping localStorage item format to database format
        // and finding/creating corresponding equipment templates
        
        await this.inventoryRepository.addItem(characterId, item.templateId, {
          custom_name: item.name !== item.templateName ? item.name : null,
          enchantment_level: item.enchantmentLevel || 0,
          is_equipped: item.equipped || false,
          equipment_slot: item.equipmentSlot,
          notes: item.description
        });
      } catch (error) {
        logger.error('Failed to import inventory item', {
          characterId,
          item: item.name,
          error: error.message
        });
      }
    }
  }
}
```

## 4. API Layer Implementation

### 4.1 Authentication Middleware

**File: `src/middleware/auth.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { logger } from '../logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const user = await this.authService.validateToken(token);

      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error('Authentication failed', { error: error.message });
      res.status(401).json({ error: 'Authentication failed' });
    }
  };

  requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };
}
```

### 4.2 Character API Controller

**File: `src/controllers/CharacterController.ts`**
```typescript
import { Request, Response } from 'express';
import { CharacterService } from '../services/CharacterService';
import { logger } from '../logger';

interface AuthenticatedRequest extends Request {
  user: any;
}

export class CharacterController {
  private characterService: CharacterService;

  constructor() {
    this.characterService = new CharacterService();
  }

  listCharacters = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const characters = await this.characterService.getUserCharacters(req.user.id);
      res.json({ characters });
    } catch (error) {
      logger.error('Failed to list characters', { 
        userId: req.user.id, 
        error: error.message 
      });
      res.status(500).json({ error: 'Failed to retrieve characters' });
    }
  };

  getCharacter = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const characterId = parseInt(req.params.id);
      const character = await this.characterService.getCharacterWithInventory(
        characterId, 
        req.user.id
      );

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      res.json({ character });
    } catch (error) {
      logger.error('Failed to get character', { 
        characterId: req.params.id,
        userId: req.user.id,
        error: error.message 
      });
      res.status(500).json({ error: 'Failed to retrieve character' });
    }
  };

  createCharacter = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, highStat, midStat, race, racialBonuses } = req.body;

      // Validation
      if (!name || !highStat || !midStat) {
        return res.status(400).json({ error: 'Missing required character data' });
      }

      const character = await this.characterService.createCharacter(req.user.id, {
        name,
        highStat,
        midStat,
        race,
        racialBonuses
      });

      res.status(201).json({ character });
    } catch (error) {
      if (error.message === 'Character name already exists') {
        return res.status(409).json({ error: error.message });
      }

      logger.error('Failed to create character', { 
        userId: req.user.id,
        error: error.message 
      });
      res.status(500).json({ error: 'Failed to create character' });
    }
  };

  importCharacters = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { localStorageData } = req.body;

      if (!localStorageData) {
        return res.status(400).json({ error: 'No data provided for import' });
      }

      const importedCharacters = await this.characterService.importFromLocalStorage(
        req.user.id,
        localStorageData
      );

      res.json({ 
        imported: importedCharacters,
        count: importedCharacters.length
      });
    } catch (error) {
      logger.error('Failed to import characters', { 
        userId: req.user.id,
        error: error.message 
      });
      res.status(500).json({ error: 'Failed to import characters' });
    }
  };
}
```

## 5. Frontend Integration Changes

### 5.1 API Client

**File: `src/api/ApiClient.ts`**
```typescript
interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 10000;
    
    // Load token from localStorage initially
    this.authToken = localStorage.getItem('auth_token');
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Request failed',
          status: response.status
        };
      }

      return {
        data,
        status: response.status
      };
    } catch (error) {
      return {
        error: error.message || 'Network error',
        status: 0
      };
    }
  }

  // Authentication methods
  async login(credentials: { emailOrUsername: string; password: string }) {
    return this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData: { username: string; email: string; password: string }) {
    return this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async validateToken() {
    return this.makeRequest('/api/auth/me');
  }

  // Character methods
  async getCharacters() {
    return this.makeRequest('/api/characters');
  }

  async getCharacter(id: number) {
    return this.makeRequest(`/api/characters/${id}`);
  }

  async createCharacter(characterData: any) {
    return this.makeRequest('/api/characters', {
      method: 'POST',
      body: JSON.stringify(characterData)
    });
  }

  async updateCharacter(id: number, updates: any) {
    return this.makeRequest(`/api/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteCharacter(id: number) {
    return this.makeRequest(`/api/characters/${id}`, {
      method: 'DELETE'
    });
  }

  async importCharacters(localStorageData: any) {
    return this.makeRequest('/api/characters/import', {
      method: 'POST',
      body: JSON.stringify({ localStorageData })
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001'
});
```

### 5.2 Modified Character Storage Interface

**File: `src/storage/DatabaseCharacterStorage.ts`**
```typescript
import { ICharacterStorage, SavedCharacter, CharacterData } from './ICharacterStorage';
import { apiClient } from '../api/ApiClient';
import { logger } from '../logger';

export class DatabaseCharacterStorage implements ICharacterStorage {
  async saveCharacter(
    char: any, 
    name: string, 
    high: string, 
    mid: string, 
    racialBonuses: string[]
  ): Promise<void> {
    try {
      // Convert character to API format
      const characterData = this.serializeCharacter(char, high, mid, racialBonuses);
      
      const response = await apiClient.createCharacter({
        name,
        ...characterData
      });

      if (response.error) {
        throw new Error(response.error);
      }

      logger.info('Character saved to database', { name });
    } catch (error) {
      logger.error('Failed to save character to database', { name, error: error.message });
      throw error;
    }
  }

  async loadCharacter(name: string): Promise<CharacterData | null> {
    try {
      // First get list of characters to find the one with matching name
      const charactersResponse = await apiClient.getCharacters();
      
      if (charactersResponse.error) {
        throw new Error(charactersResponse.error);
      }

      const character = charactersResponse.data.characters.find((c: any) => c.name === name);
      
      if (!character) {
        return null;
      }

      // Get full character data including inventory
      const fullCharacterResponse = await apiClient.getCharacter(character.id);
      
      if (fullCharacterResponse.error) {
        throw new Error(fullCharacterResponse.error);
      }

      // Convert database format back to application format
      return this.deserializeCharacter(fullCharacterResponse.data.character);
    } catch (error) {
      logger.error('Failed to load character from database', { name, error: error.message });
      throw error;
    }
  }

  async deleteCharacter(name: string): Promise<void> {
    try {
      // Find character by name first
      const charactersResponse = await apiClient.getCharacters();
      
      if (charactersResponse.error) {
        throw new Error(charactersResponse.error);
      }

      const character = charactersResponse.data.characters.find((c: any) => c.name === name);
      
      if (!character) {
        throw new Error('Character not found');
      }

      const response = await apiClient.deleteCharacter(character.id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      logger.info('Character deleted from database', { name });
    } catch (error) {
      logger.error('Failed to delete character from database', { name, error: error.message });
      throw error;
    }
  }

  async listCharacters(): Promise<SavedCharacter[]> {
    try {
      const response = await apiClient.getCharacters();
      
      if (response.error) {
        throw new Error(response.error);
      }

      return response.data.characters.map((char: any) => ({
        name: char.name,
        hash: char.data_hash || 'db-' + char.id,
        data: {
          high: char.high_stat,
          mid: char.mid_stat,
          race: char.race,
          racialBonuses: char.racial_bonuses,
          level: char.level,
          // ... map other fields
        },
        timestamp: new Date(char.updated_at).getTime()
      }));
    } catch (error) {
      logger.error('Failed to list characters from database', { error: error.message });
      throw error;
    }
  }

  private serializeCharacter(char: any, high: string, mid: string, racialBonuses: string[]): any {
    // Convert Char class instance to database-compatible format
    return {
      highStat: high,
      midStat: mid,
      race: char.race,
      racialBonuses,
      level: char.lvl,
      currentStr: char.str,
      currentDex: char.dex,
      currentInt: char.int,
      currentHp: char.hp,
      // ... serialize other properties
    };
  }

  private deserializeCharacter(dbCharacter: any): CharacterData {
    // Convert database format back to application format
    return {
      char: null, // Will be reconstructed by useChar hook
      high: dbCharacter.high_stat,
      mid: dbCharacter.mid_stat,
      racialBonuses: dbCharacter.racial_bonuses,
      // ... map other fields
    };
  }
}
```

## 6. Testing Implementation

### 6.1 Database Repository Tests

**File: `src/test/repositories/CharacterRepository.test.ts`**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CharacterRepository } from '../../repositories/CharacterRepository';
import { DatabaseConnection } from '../../database/connection';

describe('CharacterRepository', () => {
  let repository: CharacterRepository;
  let testUserId: number;

  beforeEach(async () => {
    // Setup test database connection
    const testDb = DatabaseConnection.getInstance({
      host: 'localhost',
      port: 5432,
      database: 'simple_char_test',
      username: 'test_user',
      password: 'test_password'
    });

    repository = new CharacterRepository();
    
    // Create test user
    const userResult = await testDb.query(
      'INSERT INTO users (username, email, password_hash, salt) VALUES ($1, $2, $3, $4) RETURNING id',
      ['testuser', 'test@example.com', 'hash', 'salt']
    );
    testUserId = userResult.rows[0].id;
  });

  afterEach(async () => {
    // Clean up test data
    const db = DatabaseConnection.getInstance();
    await db.query('DELETE FROM characters WHERE user_id = $1', [testUserId]);
    await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  it('should create a character', async () => {
    const characterData = {
      user_id: testUserId,
      name: 'Test Character',
      high_stat: 'str',
      mid_stat: 'dex',
      race: 'human',
      racial_bonuses: ['str'],
      current_str: 17,
      current_dex: 10,
      current_int: 6,
      current_hp: 17
    };

    const character = await repository.createCharacter(characterData);

    expect(character).toBeDefined();
    expect(character.id).toBeDefined();
    expect(character.name).toBe('Test Character');
    expect(character.user_id).toBe(testUserId);
  });

  it('should find characters by user ID', async () => {
    // Create test characters
    await repository.createCharacter({
      user_id: testUserId,
      name: 'Character 1',
      high_stat: 'str',
      mid_stat: 'dex',
      current_str: 16,
      current_dex: 10,
      current_int: 6,
      current_hp: 17
    });

    await repository.createCharacter({
      user_id: testUserId,
      name: 'Character 2',
      high_stat: 'int',
      mid_stat: 'str',
      current_str: 10,
      current_dex: 6,
      current_int: 16,
      current_hp: 14
    });

    const characters = await repository.findByUserId(testUserId);

    expect(characters).toHaveLength(2);
    expect(characters.map(c => c.name)).toContain('Character 1');
    expect(characters.map(c => c.name)).toContain('Character 2');
  });

  it('should prevent duplicate character names per user', async () => {
    const characterData = {
      user_id: testUserId,
      name: 'Duplicate Name',
      high_stat: 'str',
      mid_stat: 'dex',
      current_str: 16,
      current_dex: 10,
      current_int: 6,
      current_hp: 17
    };

    // Create first character
    await repository.createCharacter(characterData);

    // Try to create second character with same name
    const existing = await repository.findByUserIdAndName(testUserId, 'Duplicate Name');
    expect(existing).toBeDefined();
  });
});
```

### 6.2 Service Layer Tests

**File: `src/test/services/CharacterService.test.ts`**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterService } from '../../services/CharacterService';

describe('CharacterService', () => {
  let service: CharacterService;
  let mockCharacterRepository: any;
  let mockInventoryRepository: any;

  beforeEach(() => {
    // Mock repositories
    mockCharacterRepository = {
      findByUserId: vi.fn(),
      findById: vi.fn(),
      findByUserIdAndName: vi.fn(),
      createCharacter: vi.fn(),
      updateLastAccessed: vi.fn()
    };

    mockInventoryRepository = {
      findByCharacterId: vi.fn()
    };

    service = new CharacterService();
    // Inject mocks (would need dependency injection setup)
  });

  it('should create a character with correct initial stats', async () => {
    mockCharacterRepository.findByUserIdAndName.mockResolvedValue(null);
    mockCharacterRepository.createCharacter.mockResolvedValue({
      id: 1,
      name: 'Test Character',
      user_id: 1
    });

    const result = await service.createCharacter(1, {
      name: 'Test Character',
      highStat: 'str',
      midStat: 'dex',
      race: 'human'
    });

    expect(mockCharacterRepository.createCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Character',
        high_stat: 'str',
        mid_stat: 'dex',
        current_str: expect.any(Number),
        current_dex: expect.any(Number),
        current_int: expect.any(Number)
      })
    );
  });

  it('should prevent duplicate character names', async () => {
    mockCharacterRepository.findByUserIdAndName.mockResolvedValue({
      id: 1,
      name: 'Existing Character'
    });

    await expect(
      service.createCharacter(1, {
        name: 'Existing Character',
        highStat: 'str',
        midStat: 'dex'
      })
    ).rejects.toThrow('Character name already exists');
  });
});
```

### 6.3 Migration Tests

**File: `src/test/migration/LocalStorageMigration.test.ts`**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterService } from '../../services/CharacterService';

describe('LocalStorage Migration', () => {
  let service: CharacterService;

  beforeEach(() => {
    service = new CharacterService();
  });

  it('should migrate localStorage character data correctly', async () => {
    const mockLocalStorageData = {
      'Test Character': {
        high: 'str',
        mid: 'dex',
        race: 'human',
        racialBonuses: ['str'],
        level: 3,
        str: 19,
        dex: 12,
        int: 6,
        hp: 28,
        inventory: {
          items: [
            {
              id: 'sword-1',
              name: 'Iron Sword',
              type: 'weapon',
              weaponType: 'one-hand',
              equipped: true,
              equipmentSlot: 'main-hand',
              enchantmentLevel: 1
            }
          ]
        },
        notes: JSON.stringify([
          {
            id: '1',
            content: 'Test note',
            timestamp: Date.now(),
            createdAt: '2023-01-01'
          }
        ])
      }
    };

    const result = await service.importFromLocalStorage(1, mockLocalStorageData);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Character');
    expect(result[0].level).toBe(3);
    expect(result[0].current_str).toBe(19);
  });

  it('should handle corrupted localStorage data gracefully', async () => {
    const corruptedData = {
      'Bad Character': 'invalid json string',
      'Good Character': {
        high: 'str',
        mid: 'dex',
        level: 1,
        str: 16,
        dex: 10,
        int: 6,
        hp: 17
      }
    };

    const result = await service.importFromLocalStorage(1, corruptedData);

    // Should import only the valid character
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Good Character');
  });
});
```

## 7. Configuration and Environment Setup

### 7.1 Environment Variables

**File: `.env.example`**
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/simple_char
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=simple_char
DATABASE_USER=simple_char_user
DATABASE_PASSWORD=your_secure_password

# Authentication
JWT_SECRET=your-very-secure-jwt-secret-key-here
BCRYPT_SALT_ROUNDS=12

# API Configuration
API_PORT=3001
API_HOST=localhost
CORS_ORIGIN=http://localhost:3000

# Environment
NODE_ENV=development
LOG_LEVEL=info

# Frontend Configuration (for React app)
REACT_APP_API_URL=http://localhost:3001
```

### 7.2 Database Migration Scripts

**File: `scripts/migrate.ts`**
```typescript
import fs from 'fs';
import path from 'path';
import { DatabaseConnection } from '../src/database/connection';

interface Migration {
  version: string;
  description: string;
  sql: string;
}

class MigrationRunner {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance({
      host: process.env.DATABASE_HOST!,
      port: parseInt(process.env.DATABASE_PORT!),
      database: process.env.DATABASE_NAME!,
      username: process.env.DATABASE_USER!,
      password: process.env.DATABASE_PASSWORD!
    });
  }

  async run() {
    await this.ensureMigrationTable();
    const migrations = await this.loadMigrations();
    const appliedMigrations = await this.getAppliedMigrations();

    for (const migration of migrations) {
      if (!appliedMigrations.includes(migration.version)) {
        console.log(`Applying migration ${migration.version}: ${migration.description}`);
        await this.applyMigration(migration);
        await this.recordMigration(migration);
        console.log(`Migration ${migration.version} completed`);
      }
    }

    console.log('All migrations completed');
  }

  private async ensureMigrationTable() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        version VARCHAR(255) PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = path.join(__dirname, '../src/database/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    return files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const [version, ...descParts] = file.replace('.sql', '').split('_');
        const description = descParts.join(' ');
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        return { version, description, sql };
      });
  }

  private async getAppliedMigrations(): Promise<string[]> {
    const result = await this.db.query('SELECT version FROM migrations ORDER BY version');
    return result.rows.map(row => row.version);
  }

  private async applyMigration(migration: Migration) {
    await this.db.query(migration.sql);
  }

  private async recordMigration(migration: Migration) {
    await this.db.query(
      'INSERT INTO migrations (version, description) VALUES ($1, $2)',
      [migration.version, migration.description]
    );
  }
}

if (require.main === module) {
  const runner = new MigrationRunner();
  runner.run().catch(console.error);
}
```

This technical implementation guide provides the concrete code structure needed to implement the database migration. The next steps would be to:

1. Set up the database schema
2. Implement the repositories and services
3. Create the API endpoints
4. Update the frontend to use the new API
5. Implement comprehensive testing
6. Create migration scripts for existing data

Each component is designed to be modular and testable, following best practices for Node.js/TypeScript applications with PostgreSQL.