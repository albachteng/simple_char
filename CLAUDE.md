# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript character generator/simulator for what appears to be a tabletop RPG system. The app allows users to create characters by selecting primary and secondary stats, then level them up and view their combat capabilities.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally
- `npm run deploy` - Deploy to GitHub Pages
- `npm run test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode

## Architecture

### Core Components
- **App.tsx** - Main application with character display and stat selection flow
- **Picker.tsx** - Stat selection interface (primary/secondary stats)
- **useChar.tsx** - Character logic hook and Char class definition
- **types.ts** - Type definitions for Armor, Weapon, and Stat
- **constants.ts** - Game balance constants and lookup tables

### Character System
The `Char` class (useChar.tsx:32) is the core character model with:
- Three stats: STR, DEX, INT (6/10/16 based on selection)
- Level-based progression with stat increases
- Combat maneuvers tied to stats (STR ≥16 gets combat maneuvers, DEX ≥16 gets finesse points, INT >10 gets sorcery points)
- Equipment system with armor/weapon/shield restrictions
- HP calculation based on STR modifier using hit dice

### State Management
- Uses React hooks with mitt event emitter for character updates
- Character state triggers re-renders through the useChar hook
- Two-phase stat selection (high stat → mid stat → character view)

### UI Framework
- Uses Mantine UI components (@mantine/core)
- Vite for build tooling
- GitHub Pages deployment configured

### Testing
- Vitest for unit testing with jsdom environment
- React Testing Library for component testing
- Test setup includes matchMedia mock for Mantine components
- Test files located in `src/test/`

## Key Files
- `constants.ts` - All game balance numbers and lookup tables
- `src/useChar.tsx` - Character logic and state management
- `types.ts` - Core type definitions

## Planned Features

The following features are planned for development:

### Core Systems
- **Racial Bonus System** - Implementation of racial bonuses (data structure exists in constants.ts)
- **Local Storage Database** - Save/load character data for persistence
- **Character Customization** - Name changes and stat overrides
- **Note-Taking Feature** - Character notes and campaign tracking

### Equipment & Combat
- **Inventory Management System** - Item storage and organization
- **Equipment Effects** - Stat modifications from equipped items
- **Dice Rolling System** - Equipment-based dice rolls
- **Equipment Management** - Equip/unequip with stat applications

### Features & Abilities
- **Special Abilities Display** - View abilities from spells, items, racial bonuses
- **Feature Tracking** - Comprehensive ability and feature management

### Development Tools
- **Verbose Logging System** - Debug logging for development
- **Unit Testing** - Test coverage for new features
- **UI Enhancements** - Mantine tooltips, modals for feature explanations

### Documentation
- **Changelog** - Track all changes with timestamps using `date` command
- **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Comprehensive authentication system analysis and troubleshooting guide
- All changes should be documented with date/time stamps

## Development Guidelines
- Add unit tests for all new features
- Use Mantine UI components for consistency
- Focus on functionality over styling
- Document all changes in changelog with timestamps
- Test thoroughly before moving to next feature

## Testing Strategy
- **TESTING_STRATEGY.md** - Comprehensive testing plan including integration tests, E2E tests, and unit test audit
- Current test suite: 441 tests across 47 files with 98.2% pass rate using Vitest + Testing Library
- Planned additions: Cypress E2E tests, API integration tests, coverage reporting
- Test audit needed: Identify duplicates and gaps in current 47 test files

## IMPORTANT: Game System Rules

**DO NOT MODIFY CONSTANTS.TS** - This file contains the game balance and rules for a custom RPG system (NOT D&D). The racial bonuses, stat progressions, equipment values, and other game mechanics are specifically designed for this system. Do not:
- Change racial bonus values or abilities
- Modify stat progression formulas
- Alter equipment statistics or requirements
- Update any game balance numbers without explicit user request

When working with racial bonuses or other game mechanics, use the existing data as-is. If tests fail due to game data, update the tests to match the constants, not the other way around.

## Database Migration Documentation

This project is in the process of migrating from localStorage to PostgreSQL. All development should follow the comprehensive migration plan:

### Primary Migration Documents
- **[DATABASE_MIGRATION_PLAN.md](./DATABASE_MIGRATION_PLAN.md)** - Strategic overview, database schema design, and migration phases
- **[TECHNICAL_IMPLEMENTATION_GUIDE.md](./TECHNICAL_IMPLEMENTATION_GUIDE.md)** - Detailed code specifications and implementation patterns

### Migration Phase Status
Currently in **Phase 1: Foundation** - Setting up database infrastructure and user authentication system.

### Key Migration Principles
- **Backward Compatibility**: Maintain localStorage fallback during transition
- **Data Integrity**: All existing character data must be preserved
- **Equipment Extensibility**: New database schema supports advanced equipment features (abilities, stat modifications, resource bonuses)
- **User System**: Multi-user support with authentication and character ownership
- **Universal Content**: Admin-managed content (equipment templates, universal notes) for all users

### Development Approach
- Follow the 8-week migration timeline outlined in DATABASE_MIGRATION_PLAN.md
- Implement repository pattern with proper abstraction layers
- Use comprehensive testing strategy covering unit, integration, and migration scenarios  
- Maintain all current functionality while adding new database-backed features

### Database Schema Highlights
- **15+ tables** with proper relationships and indexing
- **Extensible equipment system** supporting custom abilities and stat modifications
- **User authentication** with JWT tokens and secure session management
- **Universal notes system** for admin-pushed content
- **Character logging** with per-character and global application logs

When implementing new features, always check these migration documents first to ensure consistency with the overall database migration strategy.

## Backend System File Reference

### Core Server Files
- **src/server.js** - Main server startup and lifecycle management (converted from TS)
- **src/app.js** - Express application setup with middleware and route registration (converted from TS)
- **src/database/connection.js** - Database connection manager (Knex + PostgreSQL) (converted from TS)

### API Routes and Controllers
- **src/routes/index.js** - Main API router with equipment routes registration (converted from TS)
- **src/api/routes/equipmentRoutes.js** - Equipment template API routes
- **src/api/controllers/EquipmentController.js** - Equipment template controller with CRUD operations
- **src/routes/auth.ts** - Authentication API routes (login, register, logout, etc.)
- **src/routes/admin.ts** - Admin API routes (user management)
- **src/controllers/AuthController.ts** - Authentication controller
- **src/controllers/AdminController.ts** - Admin controller

### Services and Middleware
- **src/services/AuthService.ts** - Authentication business logic and JWT handling
- **src/middleware/auth.ts** - JWT authentication middleware
- **src/middleware/validation.ts** - Request validation middleware
- **src/middleware/errorHandler.ts** - Global error handling middleware

### Database Schema and Seeds
- **src/database/migrations/** - Knex migration files (001-010 covering all tables)
- **src/database/seeds/001_equipment_templates.cjs** - Equipment templates seed data
- **src/database/seeds/002_ability_templates.cjs** - Ability templates seed data
- **src/database/seeds/003_character_races.cjs** - Character races seed data

### Frontend Integration
- **src/hooks/useAuth.tsx** - Authentication context and state management
- **src/hooks/useStorage.tsx** - Dual storage system (localStorage/database)
- **src/components/AuthStatus.tsx** - Authentication UI component
- **src/components/StorageModeSelector.tsx** - Storage status indicator

### Configuration and Utilities
- **src/test-logger.js** - Logging configuration for backend services
- **knexfile.js** - Knex database configuration
- **knex-wrapper.js** - Migration runner utilities
- **.env** - Environment variables (DATABASE_HOST, DATABASE_PASSWORD, etc.)

### Quick Server Commands
- `npm run dev` - Start frontend development server (port 3000)
- `node src/server.js` - Start backend API server (port 3001)
- `node knex-wrapper.js migrate:latest` - Run database migrations
- `node knex-wrapper.js seed:run` - Run database seeds

### Important Notes
- Backend is being converted from TypeScript to JavaScript for compatibility
- Database connection requires .env file with PostgreSQL credentials
- Equipment templates are seeded from constants.ts game balance data
- Authentication uses JWT tokens with bcrypt password hashing

### Authentication System
The authentication system supports two modes via the `AUTH_MODE` environment variable:

- **AUTH_MODE=real** (default) - Full authentication with JWT tokens and database
  - User registration with password validation
  - JWT token generation and validation
  - Database-backed user management
  - Proper error handling and security

- **AUTH_MODE=mock** - Mock authentication for testing
  - Returns fake user data (id=1, username='testuser')
  - Uses mock JWT token ('mock-jwt-token-12345')
  - Accepts any password for login
  - Useful for testing frontend without database

#### Authentication Commands
- `AUTH_MODE=real node src/server.cjs` - Start with real authentication
- `AUTH_MODE=mock node src/server.cjs` - Start with mock authentication
- Check current mode: `curl http://localhost:3001/api/health` (shows authMode)