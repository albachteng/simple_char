/**
 * Database connection management using Knex.js with PostgreSQL
 * Provides singleton database connection with connection pooling, error handling, and utility methods
 */

const knex = require('knex');
const { logger } = require('../logger.cjs');

/**
 * Database configuration object
 * @typedef {Object} DatabaseConfig
 * @property {string} host - Database host
 * @property {number} port - Database port
 * @property {string} database - Database name
 * @property {string} user - Database username
 * @property {string} password - Database password
 * @property {boolean} [ssl] - Enable SSL connection
 * @property {number} [maxConnections] - Maximum number of connections in pool
 * @property {number} [connectionTimeoutMillis] - Connection timeout in milliseconds
 */

/**
 * Database connection manager using singleton pattern
 * Manages Knex.js instance with connection pooling and error handling
 */
class DatabaseConnection {
  /**
   * @type {DatabaseConnection}
   * @private
   */
  static instance;
  
  /**
   * @type {import('knex').Knex}
   * @private
   */
  knexInstance;

  /**
   * Private constructor - use getInstance() instead
   * @param {DatabaseConfig} config - Database configuration
   * @private
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
   * Get or create singleton database connection instance
   * @param {DatabaseConfig} [config] - Database configuration (only used on first call)
   * @returns {DatabaseConnection} Database connection instance
   * @throws {Error} If no config provided and no environment variables set
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
   * Get the Knex instance for database operations
   * @returns {import('knex').Knex} Knex database instance
   */
  get knex() {
    return this.knexInstance;
  }

  /**
   * Execute raw SQL query with optional parameter bindings
   * @param {string} sql - SQL query string
   * @param {any[]} [bindings] - Query parameter bindings
   * @returns {Promise<any>} Query result
   * @throws {Error} Database query error
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
   * Execute operations within a database transaction
   * @template T
   * @param {function(import('knex').Knex.Transaction): Promise<T>} callback - Transaction callback function
   * @returns {Promise<T>} Transaction result
   */
  async transaction(callback) {
    return await this.knexInstance.transaction(callback);
  }

  /**
   * Test database connection with a simple query
   * @returns {Promise<boolean>} True if connection successful, false otherwise
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
   * Setup database event handlers and logging
   * @private
   */
  setupEventHandlers() {
    // Note: Knex doesn't expose pool events like node-postgres does directly
    // But we can add error handling at the query level
    logger.info('Database connection initialized');
  }

  /**
   * Close database connection and destroy connection pool
   * @returns {Promise<void>}
   */
  async close() {
    await this.knexInstance.destroy();
    logger.info('Database connection closed');
  }

  /**
   * Get column information for a specific table
   * @param {string} tableName - Name of the table
   * @returns {Promise<any>} Table column information
   */
  async getTableInfo(tableName) {
    return await this.knexInstance(tableName).columnInfo();
  }

  /**
   * Check if a table exists in the database
   * @param {string} tableName - Name of the table to check
   * @returns {Promise<boolean>} True if table exists, false otherwise
   */
  async tableExists(tableName) {
    return await this.knexInstance.schema.hasTable(tableName);
  }
}

/**
 * Get the singleton database instance (Knex object)
 * @returns {import('knex').Knex} Knex database instance
 */
function getDatabase() {
  return DatabaseConnection.getInstance().knex;
}

/**
 * Initialize database connection with optional configuration
 * @param {DatabaseConfig} [config] - Optional database configuration
 * @returns {DatabaseConnection} Database connection instance
 */
function initializeDatabase(config) {
  return DatabaseConnection.getInstance(config);
}

// Export both the class and convenience functions
module.exports = {
  DatabaseConnection,
  getDatabase,
  initializeDatabase
};