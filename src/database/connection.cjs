/**
 * Database Connection Manager
 * Singleton database connection with PostgreSQL using Knex
 */

const knex = require('knex');
const { logger } = require('../test-logger.cjs');

/**
 * @typedef {Object} DatabaseConfig
 * @property {string} host - Database host
 * @property {number} port - Database port
 * @property {string} database - Database name
 * @property {string} user - Database user
 * @property {string} password - Database password
 * @property {boolean} [ssl] - Use SSL connection
 * @property {number} [maxConnections] - Maximum connections in pool
 * @property {number} [connectionTimeoutMillis] - Connection timeout
 */

class DatabaseConnection {
  static instance = null;

  /**
   * @param {DatabaseConfig} config - Database configuration
   */
  constructor(config) {
    this.knexInstance = knex({
      client: 'postgresql',
      connection: {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
      },
      pool: {
        min: 1,
        max: config.maxConnections || 10,
        acquireTimeoutMillis: config.connectionTimeoutMillis || 60000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
      acquireConnectionTimeout: config.connectionTimeoutMillis || 60000,
    });

    this.setupEventHandlers();
  }

  /**
   * Get singleton database instance
   * @param {DatabaseConfig} [config] - Database configuration
   * @returns {DatabaseConnection} Database connection instance
   */
  static getInstance(config) {
    if (!DatabaseConnection.instance) {
      if (!config) {
        // Try to create from environment variables
        const envConfig = {
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432'),
          database: process.env.DATABASE_NAME || 'simple_char',
          user: process.env.DATABASE_USER || 'simple_char_user',
          password: process.env.DATABASE_PASSWORD || '',
          ssl: process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production',
          maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
          connectionTimeoutMillis: parseInt(process.env.DATABASE_TIMEOUT || '60000'),
        };
        
        if (!envConfig.password) {
          throw new Error('Database configuration required. Please set DATABASE_PASSWORD or provide config.');
        }
        
        DatabaseConnection.instance = new DatabaseConnection(envConfig);
      } else {
        DatabaseConnection.instance = new DatabaseConnection(config);
      }
    }
    return DatabaseConnection.instance;
  }

  /**
   * Get Knex instance
   * @returns {import('knex').Knex} Knex database instance
   */
  get knex() {
    return this.knexInstance;
  }

  /**
   * Execute raw SQL query
   * @param {string} sql - SQL query string
   * @param {any[]} [bindings] - Query parameter bindings
   * @returns {Promise<any>} Query result
   */
  async query(sql, bindings) {
    const start = Date.now();
    try {
      const result = await this.knexInstance.raw(sql, bindings);
      const duration = Date.now() - start;
      
      logger.debug('Database query executed', {
        query: sql.substring(0, 100),
        duration,
        rowCount: result.rowCount || result.rows?.length
      });
      
      return result;
    } catch (error) {
      logger.error('Database query failed', {
        query: sql.substring(0, 100),
        error: error.message,
        bindings
      });
      throw error;
    }
  }

  /**
   * Execute database transaction
   * @param {Function} callback - Transaction callback function
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    return await this.knexInstance.transaction(callback);
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} Connection test result
   */
  async testConnection() {
    try {
      await this.knexInstance.raw('SELECT 1');
      logger.info('Database connection test successful');
      return true;
    } catch (error) {
      logger.error('Database connection test failed', { error: error.message });
      return false;
    }
  }

  /**
   * Setup event handlers
   * @private
   */
  setupEventHandlers() {
    // Note: Knex doesn't expose pool events like node-postgres does directly
    // But we can add error handling at the query level
    logger.info('Database connection initialized');
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    await this.knexInstance.destroy();
    logger.info('Database connection closed');
  }

  /**
   * Get table column information
   * @param {string} tableName - Table name
   * @returns {Promise<any>} Table column info
   */
  async getTableInfo(tableName) {
    return await this.knexInstance(tableName).columnInfo();
  }

  /**
   * Check if table exists
   * @param {string} tableName - Table name
   * @returns {Promise<boolean>} Table existence check
   */
  async tableExists(tableName) {
    return await this.knexInstance.schema.hasTable(tableName);
  }
}

// Export both the class and convenience functions
module.exports = { DatabaseConnection };

/**
 * Convenience function to get the database instance
 * @returns {import('knex').Knex} Knex database instance
 */
function getDatabase() {
  return DatabaseConnection.getInstance().knex;
}

/**
 * Initialize database connection (will use environment variables)
 * @param {DatabaseConfig} [config] - Database configuration
 * @returns {DatabaseConnection} Database connection instance
 */
function initializeDatabase(config) {
  return DatabaseConnection.getInstance(config);
}

module.exports.getDatabase = getDatabase;
module.exports.initializeDatabase = initializeDatabase;