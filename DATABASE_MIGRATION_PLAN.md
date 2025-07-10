# Database Migration Plan: PostgreSQL Implementation

## Executive Summary

This document outlines the comprehensive migration from localStorage to PostgreSQL for the Simple Character application. The plan includes user authentication, character management, equipment extensibility, and universal content management.

## 1. Database Schema Design

### 1.1 User Authentication & Management

```sql
-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false
);

-- User sessions for authentication management
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);
```

### 1.2 Character Management

```sql
-- Main character table
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    
    -- Core stats and creation parameters
    high_stat VARCHAR(3) NOT NULL CHECK (high_stat IN ('str', 'dex', 'int')),
    mid_stat VARCHAR(3) NOT NULL CHECK (mid_stat IN ('str', 'dex', 'int')),
    race VARCHAR(50),
    racial_bonuses TEXT[], -- Array of chosen racial bonus stats
    
    -- Current derived stats (calculated from base + racial + equipment)
    current_str INTEGER NOT NULL DEFAULT 16,
    current_dex INTEGER NOT NULL DEFAULT 10,
    current_int INTEGER NOT NULL DEFAULT 6,
    
    -- Progression tracking
    level INTEGER NOT NULL DEFAULT 1,
    current_hp INTEGER NOT NULL DEFAULT 10,
    pending_level_up_points INTEGER DEFAULT 0,
    
    -- Stat override system
    use_stat_overrides BOOLEAN DEFAULT false,
    str_override INTEGER,
    dex_override INTEGER,
    int_override INTEGER,
    
    -- Resource threshold tracking (for non-retroactive bonuses)
    sorcery_threshold_level INTEGER,
    double_sorcery_threshold_level INTEGER,
    finesse_threshold_level INTEGER,
    
    -- Character integrity and metadata
    data_hash VARCHAR(255), -- For backward compatibility and integrity
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, name) -- Users can't have duplicate character names
);

-- Character progression history
CREATE TABLE character_progression (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    stat_choice VARCHAR(3) CHECK (stat_choice IN ('str', 'dex', 'int')),
    hp_roll INTEGER NOT NULL,
    level_up_type VARCHAR(20) DEFAULT 'traditional' CHECK (level_up_type IN ('traditional', 'split')),
    split_allocation JSONB, -- For split level-ups: {"str": 1, "dex": 1}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 Equipment System (Extensible)

```sql
-- Base equipment templates (seeded data)
CREATE TABLE equipment_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('weapon', 'armor', 'shield', 'accessory')),
    subtype VARCHAR(50), -- weapon_type, armor_type, etc.
    description TEXT,
    flavor_text TEXT,
    
    -- Base requirements
    str_requirement INTEGER DEFAULT 0,
    dex_requirement INTEGER DEFAULT 0,
    int_requirement INTEGER DEFAULT 0,
    
    -- Base item properties (can be overridden by enchantments)
    base_ac_bonus INTEGER DEFAULT 0,
    base_attack_bonus INTEGER DEFAULT 0,
    base_damage_dice VARCHAR(10), -- "1d8", "2d6", etc.
    
    -- Equipment slot restrictions
    valid_slots TEXT[], -- ['main-hand', 'off-hand'] for weapons
    conflicts_with TEXT[], -- Equipment slots that conflict
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    UNIQUE(name) -- Equipment names must be unique
);

-- Equipment abilities (seeded data - can be attached to equipment)
CREATE TABLE equipment_abilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    ability_type VARCHAR(50) NOT NULL, -- 'passive', 'active', 'triggered'
    trigger_condition VARCHAR(100), -- 'on_equip', 'on_attack', 'per_day', etc.
    resource_cost INTEGER DEFAULT 0,
    resource_type VARCHAR(20), -- 'sorcery', 'finesse', 'combat_maneuver'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link equipment templates to their granted abilities
CREATE TABLE equipment_template_abilities (
    equipment_template_id INTEGER REFERENCES equipment_templates(id) ON DELETE CASCADE,
    equipment_ability_id INTEGER REFERENCES equipment_abilities(id) ON DELETE CASCADE,
    granted_at_enchantment INTEGER DEFAULT 0, -- Ability available at this enchantment level
    PRIMARY KEY (equipment_template_id, equipment_ability_id)
);

-- Equipment stat modifications (for both base and enchanted equipment)
CREATE TABLE equipment_stat_modifiers (
    id SERIAL PRIMARY KEY,
    equipment_template_id INTEGER REFERENCES equipment_templates(id) ON DELETE CASCADE,
    stat_name VARCHAR(20) NOT NULL, -- 'str', 'dex', 'int', 'hp', 'ac', etc.
    modifier_type VARCHAR(20) NOT NULL CHECK (modifier_type IN ('bonus', 'penalty', 'override')),
    base_value INTEGER DEFAULT 0, -- Base modifier value
    per_enchantment_value INTEGER DEFAULT 0, -- Additional value per enchantment level
    max_enchantment_level INTEGER DEFAULT 3, -- Maximum enchantment this modifier scales to
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment resource bonuses (sorcery/finesse/combat points)
CREATE TABLE equipment_resource_bonuses (
    id SERIAL PRIMARY KEY,
    equipment_template_id INTEGER REFERENCES equipment_templates(id) ON DELETE CASCADE,
    resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('sorcery', 'finesse', 'combat_maneuver')),
    base_bonus INTEGER DEFAULT 0,
    per_enchantment_bonus INTEGER DEFAULT 0,
    max_enchantment_level INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.4 Character Inventory

```sql
-- Character's actual inventory items (instances of equipment templates)
CREATE TABLE character_inventory (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    equipment_template_id INTEGER REFERENCES equipment_templates(id) ON DELETE RESTRICT,
    
    -- Item instance properties
    custom_name VARCHAR(100), -- Custom name override
    enchantment_level INTEGER DEFAULT 0 CHECK (enchantment_level BETWEEN -3 AND 3),
    is_equipped BOOLEAN DEFAULT false,
    equipment_slot VARCHAR(20), -- 'main-hand', 'off-hand', 'armor', 'shield'
    
    -- Custom modifications (for unique items)
    custom_description TEXT,
    custom_stat_modifiers JSONB, -- Override/additional stat mods: {"str": 2, "ac": 1}
    custom_resource_bonuses JSONB, -- Override/additional resource bonuses
    custom_abilities INTEGER[], -- Array of equipment_ability IDs
    
    -- Metadata
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT -- Player notes about this specific item
);
```

### 1.5 Character Abilities & Spells

```sql
-- Master ability templates (seeded data)
CREATE TABLE ability_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('metamagic', 'spellword', 'combat_maneuver', 'racial', 'equipment')),
    description TEXT NOT NULL,
    short_description VARCHAR(200),
    
    -- Learning requirements
    min_level INTEGER DEFAULT 1,
    stat_requirements JSONB, -- {"str": 16, "int": 12}
    prerequisite_abilities INTEGER[], -- Array of ability_template IDs
    
    -- Usage properties
    resource_cost INTEGER DEFAULT 0,
    resource_type VARCHAR(20), -- 'sorcery', 'finesse', 'combat_maneuver'
    usage_limit VARCHAR(20), -- 'unlimited', 'per_day', 'per_combat'
    
    -- Metadata
    source VARCHAR(50), -- 'core', 'expansion', 'custom'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Character learned abilities
CREATE TABLE character_abilities (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    ability_template_id INTEGER REFERENCES ability_templates(id) ON DELETE RESTRICT,
    learned_at_level INTEGER NOT NULL,
    times_used INTEGER DEFAULT 0, -- Usage tracking
    custom_notes TEXT,
    learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(character_id, ability_template_id) -- Can't learn the same ability twice
);
```

### 1.6 Notes System

```sql
-- Character-specific notes
CREATE TABLE character_notes (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    note_type VARCHAR(20) DEFAULT 'general' CHECK (note_type IN ('general', 'combat', 'story', 'reminder')),
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Universal notes (pushed to all characters)
CREATE TABLE universal_notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    note_type VARCHAR(20) DEFAULT 'announcement' CHECK (note_type IN ('announcement', 'rule_update', 'system_info')),
    target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'new_characters', 'existing_characters')),
    
    -- Visibility controls
    is_active BOOLEAN DEFAULT true,
    show_until TIMESTAMP,
    min_character_level INTEGER DEFAULT 1,
    max_character_level INTEGER,
    
    -- Metadata
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track which users have seen which universal notes
CREATE TABLE user_universal_notes_seen (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    universal_note_id INTEGER REFERENCES universal_notes(id) ON DELETE CASCADE,
    seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, universal_note_id)
);
```

### 1.7 Logging System

```sql
-- Application logs (global)
CREATE TABLE application_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
    session_id INTEGER REFERENCES user_sessions(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT
);

-- Character-specific activity logs
CREATE TABLE character_logs (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    session_id INTEGER REFERENCES user_sessions(id) ON DELETE SET NULL
);
```

### 1.8 Game Data & Configuration

```sql
-- Race definitions (seeded data)
CREATE TABLE races (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    stat_bonuses JSONB NOT NULL, -- [{"stat": "str", "bonus": 2}, {"stat": "any", "bonus": 1}]
    racial_abilities INTEGER[], -- Array of ability_template IDs
    flavor_text TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application settings (global configuration)
CREATE TABLE application_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_user_configurable BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- User preferences
CREATE TABLE user_preferences (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, preference_key)
);
```

## 2. Indexes for Performance

```sql
-- Character lookup indexes
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_name ON characters(name);
CREATE INDEX idx_characters_updated_at ON characters(updated_at);

-- Inventory indexes
CREATE INDEX idx_character_inventory_character_id ON character_inventory(character_id);
CREATE INDEX idx_character_inventory_equipped ON character_inventory(character_id, is_equipped);

-- Ability indexes
CREATE INDEX idx_character_abilities_character_id ON character_abilities(character_id);
CREATE INDEX idx_ability_templates_type ON ability_templates(type);

-- Notes indexes
CREATE INDEX idx_character_notes_character_id ON character_notes(character_id);
CREATE INDEX idx_character_notes_created_at ON character_notes(created_at);
CREATE INDEX idx_universal_notes_active ON universal_notes(is_active, created_at);

-- Logging indexes
CREATE INDEX idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX idx_application_logs_level ON application_logs(level);
CREATE INDEX idx_application_logs_user_character ON application_logs(user_id, character_id);
CREATE INDEX idx_character_logs_character_timestamp ON character_logs(character_id, timestamp);

-- Session indexes
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
```

## 3. Data Migration Strategy

### 3.1 Migration Phases

**Phase 1: Database Setup**
- Create PostgreSQL database and schema
- Set up connection pooling and configuration
- Implement database access layer

**Phase 2: User System**
- Implement authentication system
- Create user management endpoints
- Add session management

**Phase 3: Character Migration**
- Create character import/export utilities
- Migrate existing localStorage characters
- Implement character CRUD operations

**Phase 4: Enhanced Features**
- Add equipment template system
- Implement universal notes
- Add advanced logging

**Phase 5: Testing & Optimization**
- Comprehensive regression testing
- Performance optimization
- Data integrity validation

### 3.2 Backward Compatibility

During migration, maintain localStorage as a fallback:
- Implement database/localStorage adapter pattern
- Allow importing characters from localStorage
- Provide export functionality for backup

## 4. API Design

### 4.1 Authentication Endpoints

```typescript
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 4.2 Character Management Endpoints

```typescript
GET    /api/characters              // List user's characters
POST   /api/characters              // Create new character
GET    /api/characters/:id          // Get character details
PUT    /api/characters/:id          // Update character
DELETE /api/characters/:id          // Delete character
POST   /api/characters/:id/clone    // Clone character
POST   /api/characters/import       // Import from localStorage
GET    /api/characters/:id/export   // Export character data
```

### 4.3 Equipment & Inventory Endpoints

```typescript
GET    /api/equipment/templates     // List available equipment
GET    /api/equipment/templates/:id // Get equipment details
POST   /api/characters/:id/inventory          // Add item to inventory
PUT    /api/characters/:id/inventory/:itemId  // Update inventory item
DELETE /api/characters/:id/inventory/:itemId  // Remove from inventory
POST   /api/characters/:id/inventory/:itemId/equip   // Equip item
POST   /api/characters/:id/inventory/:itemId/unequip // Unequip item
```

### 4.4 Notes & Logging Endpoints

```typescript
GET    /api/characters/:id/notes    // Get character notes
POST   /api/characters/:id/notes    // Create note
PUT    /api/notes/:noteId           // Update note
DELETE /api/notes/:noteId           // Delete note

GET    /api/universal-notes         // Get universal notes
POST   /api/universal-notes         // Create universal note (admin)

GET    /api/characters/:id/logs     // Get character logs
GET    /api/admin/logs              // Get application logs (admin)
```

## 5. Code Changes Required

### 5.1 New Infrastructure Files

```
src/
├── database/
│   ├── connection.ts           // Database connection setup
│   ├── migrations/             // Database migration files
│   └── seeds/                  // Seed data files
├── services/
│   ├── AuthService.ts          // Authentication logic
│   ├── CharacterService.ts     // Character CRUD operations
│   ├── EquipmentService.ts     // Equipment management
│   ├── NotesService.ts         // Notes management
│   └── LoggingService.ts       // Enhanced logging
├── repositories/
│   ├── CharacterRepository.ts  // Character data access
│   ├── EquipmentRepository.ts  // Equipment data access
│   ├── UserRepository.ts       // User data access
│   └── BaseRepository.ts       // Common repository patterns
├── middleware/
│   ├── auth.ts                 // Authentication middleware
│   ├── validation.ts           // Request validation
│   └── errorHandler.ts         // Error handling
└── types/
    ├── api.ts                  // API request/response types
    ├── database.ts             // Database entity types
    └── auth.ts                 // Authentication types
```

### 5.2 Modified Existing Files

**Character Management:**
- `src/useChar.tsx` - Add database persistence hooks
- `src/storage/` - Replace localStorage with API calls
- `src/inventory/InventoryManager.ts` - Add database synchronization

**UI Components:**
- Add login/registration forms
- Add character selection/management UI
- Add equipment template browser
- Add universal notes display

**Configuration:**
- Environment variables for database connection
- API configuration and base URLs
- Authentication token management

## 6. Testing Strategy

### 6.1 Database Testing

```typescript
// Integration tests for database operations
describe('Character Database Operations', () => {
  it('should create and retrieve character');
  it('should handle inventory operations');
  it('should maintain data integrity');
  it('should handle concurrent access');
});
```

### 6.2 Migration Testing

```typescript
// Test localStorage to database migration
describe('Data Migration', () => {
  it('should migrate character data correctly');
  it('should preserve equipment and enchantments');
  it('should maintain notes and logs');
  it('should handle corrupted localStorage data');
});
```

### 6.3 API Testing

```typescript
// API endpoint testing
describe('Character API', () => {
  it('should authenticate users correctly');
  it('should CRUD characters with authorization');
  it('should handle equipment operations');
  it('should manage notes and logging');
});
```

### 6.4 Performance Testing

- Load testing with multiple users
- Database query performance
- Memory usage monitoring
- Response time benchmarks

## 7. Security Considerations

### 7.1 Authentication Security

- Password hashing with bcrypt
- Secure session token generation
- JWT token expiration and refresh
- Rate limiting on authentication endpoints

### 7.2 Authorization

- User can only access their own characters
- Admin-only endpoints for universal content
- Input validation and sanitization
- SQL injection prevention

### 7.3 Data Protection

- Database connection encryption
- Sensitive data encryption at rest
- Audit logging for data changes
- Regular security updates

## 8. Deployment Considerations

### 8.1 Database Setup

- PostgreSQL 14+ recommended
- Connection pooling (pg-pool)
- Database backups and recovery
- Monitoring and alerting

### 8.2 Application Deployment

- Environment configuration
- Database migration automation
- Health check endpoints
- Performance monitoring

### 8.3 Scaling Considerations

- Read replicas for improved performance
- Horizontal scaling strategies
- Caching layer for frequently accessed data
- CDN for static assets

## 9. Timeline and Milestones

### Week 1-2: Foundation
- Database schema creation
- Basic authentication system
- Database connection and ORM setup

### Week 3-4: Core Migration
- Character data migration
- Basic CRUD operations
- API endpoint implementation

### Week 5-6: Enhanced Features
- Equipment template system
- Universal notes implementation
- Advanced logging system

### Week 7-8: Testing & Polish
- Comprehensive testing
- Performance optimization
- Documentation completion
- Deployment preparation

## 10. Risk Mitigation

### Data Loss Prevention
- Multiple backup strategies
- Migration validation scripts
- Rollback procedures
- Data integrity checks

### Performance Risks
- Database query optimization
- Connection pool management
- Caching strategies
- Load testing validation

### Security Risks
- Regular security audits
- Dependency vulnerability scanning
- Input validation testing
- Authentication testing

This comprehensive plan provides a roadmap for migrating the Simple Character application from localStorage to a robust PostgreSQL-based system while maintaining all existing functionality and adding the requested enhancements.