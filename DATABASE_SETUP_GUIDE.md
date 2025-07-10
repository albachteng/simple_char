# Database Setup Guide

This guide will help you set up PostgreSQL and initialize the database for the Simple Character application.

## Prerequisites

You have already installed:
- ✅ PostgreSQL client tools (`postgresql-client`)
- ✅ pgcli (better PostgreSQL CLI)
- ✅ Node.js dependencies (`pg`, `knex`, `node-pg-migrate`)

## Step 1: Create PostgreSQL Database

### Option A: Local PostgreSQL Installation

If you have PostgreSQL installed locally:

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE simple_char;
CREATE USER simple_char_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE simple_char TO simple_char_user;

# Grant schema permissions
\c simple_char
GRANT ALL ON SCHEMA public TO simple_char_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO simple_char_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO simple_char_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO simple_char_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO simple_char_user;

# Exit
\q
```

### Option B: Docker PostgreSQL (Recommended for Development)

```bash
# Run PostgreSQL in Docker
docker run --name simple-char-postgres \
  -e POSTGRES_DB=simple_char \
  -e POSTGRES_USER=simple_char_user \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  -d postgres:14

# Verify it's running
docker ps
```

### Option C: Cloud PostgreSQL

Use a cloud provider like:
- **Railway** (free tier available)
- **Supabase** (free tier with additional features)
- **AWS RDS** (free tier available)
- **DigitalOcean Managed Databases**

## Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your database credentials
nano .env
```

Update the database configuration in `.env`:

```bash
# For local/Docker setup
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=simple_char
DATABASE_USER=simple_char_user
DATABASE_PASSWORD=dev_password

# For cloud setup, you might use a single URL instead:
# DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your-very-secure-jwt-secret-key-change-this-in-production

# Environment
NODE_ENV=development
LOG_LEVEL=info
```

## Step 3: Test Database Connection

```bash
# Test connection using pgcli
pgcli postgresql://simple_char_user:dev_password@localhost:5432/simple_char

# You should see a prompt like:
# Server: PostgreSQL 14.x
# Version: x.x.x
# simple_char_user@localhost:simple_char>

# Test with a simple query
SELECT version();

# Exit pgcli
\q
```

## Step 4: Run Database Migrations

```bash
# Install dependencies if not already done
npm install

# Run all migrations to create tables
npm run db:migrate

# You should see output like:
# Batch 1 run: 10 migrations

# Seed the database with initial data
npm run db:seed

# You should see output indicating seed data was inserted
```

## Step 5: Verify Database Setup

```bash
# Connect with pgcli again
pgcli postgresql://simple_char_user:dev_password@localhost:5432/simple_char

# Check that tables were created
\dt

# You should see tables like:
# +--------+------------------------+-------+------------------+
# | Schema | Name                   | Type  | Owner            |
# +--------+------------------------+-------+------------------+
# | public | users                  | table | simple_char_user |
# | public | characters             | table | simple_char_user |
# | public | equipment_templates    | table | simple_char_user |
# ... and more

# Check that seed data exists
SELECT name FROM races;
SELECT name FROM equipment_templates LIMIT 5;

# Exit
\q
```

## Step 6: Create Test User (Optional)

```bash
# You can create a test user account through the API once it's running
# Or manually insert one for testing:

pgcli postgresql://simple_char_user:dev_password@localhost:5432/simple_char

# Insert a test user (password: 'testpass123')
INSERT INTO users (username, email, password_hash, salt) 
VALUES (
  'testuser', 
  'test@example.com',
  '$2b$12$example_hash_here', 
  'example_salt'
);

# Exit
\q
```

## Troubleshooting

### Connection Issues

1. **"Connection refused"**
   - Check if PostgreSQL is running: `sudo systemctl status postgresql`
   - For Docker: `docker ps` to verify container is running

2. **"Authentication failed"**
   - Verify username/password in `.env` file
   - Check PostgreSQL user permissions

3. **"Database does not exist"**
   - Make sure you created the database in Step 1
   - Check database name in `.env` file

### Migration Issues

1. **"relation does not exist"**
   - Run migrations: `npm run db:migrate`
   - Check for any failed migrations

2. **"permission denied"**
   - Verify database user has proper permissions
   - Grant schema permissions as shown in Step 1

### Knex Issues

1. **"Cannot find module 'knex'"**
   - Run `npm install` to ensure all dependencies are installed

2. **"Invalid configuration"**
   - Check `knexfile.js` configuration
   - Verify `.env` file exists and has correct values

## Next Steps

After successful database setup:

1. **Start the development server** (when API is implemented)
2. **Test user registration/login** (when auth is implemented)
3. **Import existing localStorage characters** (when migration tool is ready)

## Database Management Commands

```bash
# Run new migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Create a new migration
npm run db:migrate:make migration_name

# Run seeds
npm run db:seed
```

## Production Considerations

For production deployment:

1. **Use strong passwords** and change JWT_SECRET
2. **Enable SSL** connections
3. **Set up regular backups**
4. **Monitor database performance**
5. **Use connection pooling** (already configured in knex)
6. **Set appropriate resource limits**

## Security Notes

- Never commit `.env` file to version control
- Use strong, unique passwords for database users
- Enable SSL/TLS for database connections in production
- Regularly update PostgreSQL to latest stable version
- Monitor for suspicious database activity

---

**Need Help?** 

If you encounter issues during setup:
1. Check the PostgreSQL logs for error details
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL service is running and accessible
4. Test connection with pgcli before running migrations