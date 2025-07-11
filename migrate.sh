#!/bin/bash

# Shell script to run migrations with explicit environment loading
echo "🔍 Loading environment variables from .env file..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found in current directory: $(pwd)"
    exit 1
fi

echo "✅ .env file found at: $(pwd)/.env"

# Load environment variables
set -a  # automatically export all variables
source .env
set +a  # stop auto-exporting

echo "🔍 Loaded environment variables:"
echo "   DATABASE_HOST: ${DATABASE_HOST:-undefined}"
echo "   DATABASE_PORT: ${DATABASE_PORT:-undefined}"
echo "   DATABASE_NAME: ${DATABASE_NAME:-undefined}"
echo "   DATABASE_USER: ${DATABASE_USER:-undefined}"
echo "   DATABASE_PASSWORD: ${DATABASE_PASSWORD:+[SET]}"
echo "   DATABASE_URL: ${DATABASE_URL:+[SET]}"

# Verify we have the required variables
if [ -z "$DATABASE_HOST" ] || [ -z "$DATABASE_NAME" ] || [ -z "$DATABASE_USER" ] || [ -z "$DATABASE_PASSWORD" ]; then
    echo "❌ Missing required environment variables"
    echo "Required: DATABASE_HOST, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD"
    exit 1
fi

echo ""
echo "🚀 Running migration with loaded environment..."

# Run the migration with ts-node for TypeScript support
NODE_ENV=development npx ts-node ./node_modules/knex/bin/cli.js migrate:latest --knexfile knexfile.cjs