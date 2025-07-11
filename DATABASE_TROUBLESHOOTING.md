# Database Connection Troubleshooting Guide

## Quick Fix Summary

I've fixed several issues with your database configuration that were likely causing the "pool is probably full" error:

### ✅ **Changes Made:**

1. **Updated `knexfile.cjs`** with proper AWS RDS configuration:
   - Added connection pool settings with reasonable timeouts
   - Added SSL configuration for AWS RDS
   - Set proper timeout values (60 seconds)
   - Reduced max connections to 5 for development

2. **Updated `package.json` scripts** to use `--knexfile knexfile.cjs`

3. **Added connection testing tools**:
   - `npm run db:test` - Test database connection
   - `scripts/test-db-connection.js` - Detailed connection testing

4. **Created `.env.example`** with AWS RDS configuration examples

### 🔧 **Next Steps:**

1. **Test your database connection first:**
   ```bash
   npm run db:test
   ```

2. **If connection works, try migration:**
   ```bash
   npm run db:migrate
   ```

## Common AWS RDS Issues & Solutions

### 1. "Pool is probably full" Error

**Causes:**
- Too many concurrent connections
- Connection timeouts not configured properly
- SSL configuration missing

**Solutions:**
✅ **Fixed:** Reduced pool size and added proper timeouts in `knexfile.cjs`

### 2. SSL/TLS Connection Issues

**Error:** `no pg_hba.conf entry for host`

**Solution:**
Ensure your `.env` has:
```bash
DATABASE_SSL=true
```

### 3. Security Group Issues

**Error:** `ECONNREFUSED` or connection timeout

**Check:**
- RDS Security Group allows inbound connections on port 5432
- Your IP address is allowed (or use 0.0.0.0/0 for testing)
- Database is publicly accessible (if connecting from outside AWS)

### 4. Wrong Endpoint or Credentials

**Error:** `ENOTFOUND` or authentication failed

**Check:**
- RDS endpoint is correct (don't include port in hostname)
- Username and password are correct
- Database name exists

## Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# Copy example file
cp .env.example .env

# Edit with your actual AWS RDS values
nano .env
```

### Required AWS RDS Configuration:

```bash
# Your AWS RDS endpoint (without port)
DATABASE_HOST=your-instance.region.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=simple_char
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
DATABASE_SSL=true

# JWT (generate a secure random string)
JWT_SECRET=your-very-secure-random-string-here
```

## Step-by-Step Debugging

### 1. Test Basic Connection
```bash
npm run db:test
```

**Expected Output:**
```
✅ Connected successfully!
✅ Query successful!
✅ Table creation successful!
✅ All database tests passed!
```

### 2. If Connection Fails

Check the error message and follow the suggestions provided by the test script.

**Common Issues:**

- **ENOTFOUND**: Wrong hostname
- **ECONNREFUSED**: Wrong port or security group
- **Authentication failed**: Wrong username/password
- **Timeout**: Security group or network issue

### 3. Test Migration
```bash
npm run db:migrate
```

### 4. If Migration Fails

**Error:** `timeout acquiring a connection`
- Check pool configuration in `knexfile.cjs`
- Verify SSL settings

**Error:** `relation already exists`
- Database partially migrated, try: `npm run db:migrate:rollback`

**Error:** `permission denied`
- User lacks CREATE privileges

## AWS RDS Setup Checklist

### ✅ **Database Instance:**
- [ ] PostgreSQL engine (version 12+ recommended)
- [ ] Publicly accessible (if connecting from outside AWS)
- [ ] Backup retention configured

### ✅ **Security Groups:**
- [ ] Inbound rule: PostgreSQL (5432) from your IP
- [ ] For development: 0.0.0.0/0 (not recommended for production)

### ✅ **Database Configuration:**
- [ ] Master username set
- [ ] Master password set
- [ ] Initial database name created
- [ ] Parameter group allows connections

### ✅ **Local Configuration:**
- [ ] `.env` file created with correct values
- [ ] `DATABASE_SSL=true` for AWS RDS
- [ ] Credentials match RDS setup

## Testing Different Scenarios

### Test with DATABASE_URL
```bash
# In .env, try using a connection string instead:
DATABASE_URL=postgresql://username:password@hostname:5432/database?sslmode=require
```

### Test with Different Pool Settings
```bash
# If still having pool issues, try these in .env:
DATABASE_MAX_CONNECTIONS=3
DATABASE_TIMEOUT=30000
```

### Test Without SSL (Local Only)
```bash
# Only for local PostgreSQL (not AWS RDS):
DATABASE_SSL=false
```

## Production Considerations

When moving to production:

1. **Use IAM Authentication** instead of passwords
2. **Enable SSL certificate verification**
3. **Use VPC security groups** instead of public access
4. **Set up connection monitoring**
5. **Configure backup and monitoring**

## Get Help

If you're still having issues, run:

```bash
npm run db:test
```

And share the complete output. The test script provides detailed error information and suggestions for each type of failure.

## Example Working Configuration

Here's an example of a working AWS RDS configuration:

```bash
# .env file
DATABASE_HOST=myapp-db.xyz123.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=simple_char
DATABASE_USER=postgres
DATABASE_PASSWORD=MySecurePassword123!
DATABASE_SSL=true
JWT_SECRET=super-secret-jwt-key-change-in-production-xyz123
NODE_ENV=development
```

The key points are:
- Use the RDS endpoint hostname (without `http://` or port)
- Enable SSL for AWS RDS
- Use a strong JWT secret
- Ensure security groups allow your IP