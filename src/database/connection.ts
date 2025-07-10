import knex, { Knex } from 'knex';
import { logger } from '../logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeoutMillis?: number;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private knexInstance: Knex;

  private constructor(config: DatabaseConfig) {
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
        min: 2,
        max: config.maxConnections || 20,
        acquireTimeoutMillis: config.connectionTimeoutMillis || 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
      acquireConnectionTimeout: config.connectionTimeoutMillis || 30000,
    });

    this.setupEventHandlers();
  }

  static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      if (!config) {
        // Try to create from environment variables
        const envConfig: DatabaseConfig = {
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432'),
          database: process.env.DATABASE_NAME || 'simple_char',
          user: process.env.DATABASE_USER || 'simple_char_user',
          password: process.env.DATABASE_PASSWORD || '',
          ssl: process.env.NODE_ENV === 'production',
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

  get knex(): Knex {
    return this.knexInstance;
  }

  async query(sql: string, bindings?: any[]): Promise<any> {
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

  async transaction<T>(callback: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return await this.knexInstance.transaction(callback);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.knexInstance.raw('SELECT 1');
      logger.info('Database connection test successful');
      return true;
    } catch (error) {
      logger.error('Database connection test failed', { error: error.message });
      return false;
    }
  }

  private setupEventHandlers() {
    // Note: Knex doesn't expose pool events like node-postgres does directly
    // But we can add error handling at the query level
    logger.info('Database connection initialized');
  }

  async close(): Promise<void> {
    await this.knexInstance.destroy();
    logger.info('Database connection closed');
  }

  // Helper method to get table information
  async getTableInfo(tableName: string): Promise<any> {
    return await this.knexInstance(tableName).columnInfo();
  }

  // Helper method to check if table exists
  async tableExists(tableName: string): Promise<boolean> {
    return await this.knexInstance.schema.hasTable(tableName);
  }
}

// Export both the class and a convenience function
export { DatabaseConnection };

// Convenience function to get the database instance
export function getDatabase(): Knex {
  return DatabaseConnection.getInstance().knex;
}

// Initialize database connection (will use environment variables)
export function initializeDatabase(config?: DatabaseConfig): DatabaseConnection {
  return DatabaseConnection.getInstance(config);
}