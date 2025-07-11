# Backend Deployment Guide

This guide covers deploying your Node.js/Express API server with PostgreSQL database to various platforms.

## Overview

Your application has two parts:
- **Frontend**: React app (currently on GitHub Pages)
- **Backend**: Node.js/Express API + PostgreSQL database

GitHub Pages only serves static files, so you need a different solution for the backend.

## 🚀 Recommended Deployment Options

### 1. **Railway** (Easiest, Free Tier)

**Best for**: Quick deployment, beginners, free tier

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from your project directory
railway up

# Railway will:
# - Detect your Node.js app automatically
# - Provide a PostgreSQL database
# - Give you a public URL
```

**Pros**: 
- Free tier available
- Built-in PostgreSQL
- Auto-deploys from Git
- Zero configuration

**Cons**: 
- Limited free tier resources
- Less control over configuration

---

### 2. **Render** (Great Balance)

**Best for**: Production apps, good free tier, easy setup

1. **Database Setup**:
   - Go to [render.com](https://render.com)
   - Create new PostgreSQL database
   - Copy connection string

2. **API Deployment**:
   - Connect your GitHub repo
   - Choose "Web Service"
   - Build command: `npm run build`
   - Start command: `npm start`
   - Add environment variables

**Environment Variables for Render**:
```
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-production-secret
NODE_ENV=production
PORT=10000
```

**Pros**:
- Excellent free tier
- Built-in SSL certificates
- Auto-deploys from Git
- Good performance

---

### 3. **Heroku** (Established Platform)

**Best for**: Production apps, lots of add-ons

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main
```

**Pros**:
- Very mature platform
- Extensive add-on ecosystem
- Great documentation

**Cons**:
- No free tier anymore
- Can be expensive

---

### 4. **DigitalOcean App Platform**

**Best for**: Scalable production apps

1. **Database**: Create managed PostgreSQL database
2. **App**: Deploy from GitHub repository
3. **Environment**: Configure via dashboard

**Pros**:
- Predictable pricing
- Managed databases
- Good performance

**Cons**:
- No free tier
- More complex setup

---

### 5. **AWS/Vercel (Advanced)**

**AWS**: Full control, complex setup, pay-per-use
**Vercel**: Great for Next.js, serverless functions only

---

## 📦 Deployment Preparation

### 1. **Update package.json**

Ensure your package.json has the right scripts:

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc -b",
    "dev": "ts-node src/server.ts",
    "migrate": "node migrate.cjs",
    "seed": "npm run db:seed"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

### 2. **Environment Variables**

Create production environment variables:

```bash
# Required for production
NODE_ENV=production
PORT=3001

# Database (provided by platform)
DATABASE_URL=postgresql://user:pass@host:port/db

# OR individual database settings
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_NAME=simple_char
DATABASE_USER=your-user
DATABASE_PASSWORD=your-password
DATABASE_SSL=true

# Authentication (CHANGE THESE!)
JWT_SECRET=your-very-secure-production-secret-key-min-32-chars
JWT_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12

# CORS (your frontend URL)
CORS_ORIGIN=https://your-username.github.io

# Optional
LOG_LEVEL=info
```

### 3. **Database Migration Strategy**

Add these scripts to handle migrations on deployment:

```json
{
  "scripts": {
    "postinstall": "npm run build",
    "deploy:migrate": "npm run migrate && npm run seed",
    "start:prod": "npm run deploy:migrate && npm start"
  }
}
```

### 4. **Build Process**

Make sure your build works locally:

```bash
# Test build process
npm run build
ls dist/  # Should contain compiled JS files

# Test production start
NODE_ENV=production npm start
```

---

## 🔧 Platform-Specific Setup

### Railway Setup (Recommended)

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

2. **Deploy**:
```bash
# From your project root
railway up

# Railway will prompt you to:
# - Connect to GitHub (optional)
# - Add PostgreSQL database
# - Set environment variables
```

3. **Configure Environment**:
```bash
# Set environment variables
railway variables set JWT_SECRET="your-secure-secret"
railway variables set CORS_ORIGIN="https://your-username.github.io"
railway variables set NODE_ENV="production"
```

4. **Database Migration**:
```bash
# Run migrations on Railway
railway run npm run migrate
railway run npm run db:seed
```

---

### Render Setup

1. **Database**:
   - Create PostgreSQL database on Render
   - Copy the "External Database URL"

2. **Web Service**:
   - Connect GitHub repository
   - Settings:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: `Node`

3. **Environment Variables** (in Render dashboard):
```
DATABASE_URL = [paste from database]
JWT_SECRET = your-secure-secret
CORS_ORIGIN = https://your-username.github.io
NODE_ENV = production
```

4. **Deploy Hook** (optional):
   Add to package.json for auto-migration:
```json
{
  "scripts": {
    "build": "tsc -b && npm run migrate && npm run db:seed"
  }
}
```

---

## 🔗 Frontend Integration

### Update Frontend API URLs

Update your frontend to use the deployed backend:

```typescript
// src/config/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-app.railway.app/api'  // Your deployed backend
  : 'http://localhost:3001/api';  // Local development

export { API_BASE_URL };
```

### CORS Configuration

Make sure your backend allows your frontend domain:

```typescript
// In your backend src/app.ts
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

---

## 🔍 Testing Your Deployment

### 1. **Health Check**

Test your deployed API:

```bash
# Replace with your deployed URL
curl https://your-app.railway.app/health

# Should return:
# {
#   "success": true,
#   "message": "Server is healthy",
#   "timestamp": "2025-07-11T..."
# }
```

### 2. **Database Connection**

Test database endpoints:

```bash
# Test authentication endpoint
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"testpass123"}'
```

### 3. **Frontend Integration**

Update your GitHub Pages frontend to use the new API URL and test the full flow.

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Build process working locally
- [ ] Database migrations tested
- [ ] CORS configured for frontend domain
- [ ] JWT secrets are secure (32+ characters)

### Platform Setup
- [ ] Database created and accessible
- [ ] Application deployed and running
- [ ] Environment variables set
- [ ] Custom domain configured (optional)

### Post-Deployment
- [ ] Health check passes
- [ ] Database migrations ran successfully
- [ ] Seed data populated
- [ ] Frontend can connect to backend
- [ ] Authentication flow works end-to-end

### Security
- [ ] Database connection uses SSL
- [ ] JWT secrets are production-strength
- [ ] CORS only allows your frontend domain
- [ ] Rate limiting configured
- [ ] Environment variables secured

---

## 🚨 Common Issues & Solutions

### Build Failures
```bash
# Make sure TypeScript compiles
npm run build

# Check for missing dependencies
npm install

# Verify Node.js version
node --version  # Should be 18+
```

### Database Connection Issues
```bash
# Test database connection
npm run db:test

# Check environment variables
echo $DATABASE_URL

# Verify SSL requirements
# Most cloud databases require SSL
```

### CORS Errors
- Make sure `CORS_ORIGIN` matches your frontend URL exactly
- Include protocol: `https://username.github.io` not `username.github.io`
- Check browser dev tools for specific error messages

### 500 Errors
- Check application logs on your platform
- Verify all environment variables are set
- Test locally with production environment

---

## 💰 Cost Comparison

| Platform | Free Tier | Database | Ease | Best For |
|----------|-----------|----------|------|----------|
| **Railway** | 500 hours/month | ✅ PostgreSQL | ⭐⭐⭐⭐⭐ | Getting started |
| **Render** | 750 hours/month | ✅ PostgreSQL | ⭐⭐⭐⭐ | Production ready |
| **Heroku** | None | Add-on required | ⭐⭐⭐ | Enterprise |
| **DigitalOcean** | None | Managed DB | ⭐⭐⭐ | Scaling up |

## 🎯 Quick Start Recommendation

**For immediate deployment**, I recommend Railway:

1. `npm install -g @railway/cli`
2. `railway login`
3. `railway up` (in your project directory)
4. Set environment variables in Railway dashboard
5. Run migrations: `railway run npm run migrate`

Your backend will be live in under 10 minutes! 🚀

---

**Questions?** Each platform has good documentation and community support. Railway and Render are the most beginner-friendly options.