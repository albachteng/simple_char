# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial testing framework setup with Vitest and React Testing Library
- Test configuration with jsdom environment and matchMedia mock for Mantine components
- Unit tests for `mod` function and `Char` class core functionality
- Component tests for `Picker` component
- npm test commands in package.json
- **Comprehensive logging system** - Tracks all game calculations and state changes
- **LogViewer component** - Real-time log display with filtering by level and category
- **Improved LogViewer UI** - Collapsible interface, monospace font, auto-refresh, subtle styling
- Detailed logging for: character creation, stat calculations, HP rolls, AC calculations, level ups, equipment changes, combat attacks, and maneuvers
- **Racial bonus system** - Character races with unique abilities and stat bonuses (Human, Elf, Dwarf, Halfling, Gnome, Half-Orc, Tiefling, Dragonborn)
- **Local storage character persistence** - Save/load multiple characters with unique names
- **Character name editor** - Double-click to edit character names with validation
- **Stat override system** - Debug feature allowing temporary stat modifications with additive bonuses/penalties
- **Finesse combat system** - Sneak attacks and assassinations for characters with finesse points (DEX 16+) [2025-07-08]
  - Sneak attacks: Cost 1 finesse point, add remaining finesse points as d8 damage dice
  - Assassinations: No finesse cost, critical hits (doubled dice) with finesse points as d8 damage dice
  - Rest functionality: Restore all resources (HP, sorcery, combat maneuvers, finesse) to maximum
  - UI integration: Combat action buttons for main-hand and off-hand weapons
  - Comprehensive test suite for finesse mechanics and damage calculations
- **Comprehensive inventory management** - Full equipment system with slot-based dual-wielding
- **Equipment stat bonuses** - Items can provide stat modifications and maneuver bonuses
- **Dice rolling system** - Toggle between random rolls and average values for consistency
- **Dual-wielding combat** - Main-hand and off-hand weapon slots with different mechanics
- **Individual combat actions** - Separate attack and damage roll buttons for each equipped weapon
- **Combat calculation breakdowns** - Detailed roll summaries showing all modifiers (e.g., "10 (1d20) + 3 (STR modifier) + 1 (level)")
- **CustomNumberInput component** - Replacement for problematic Mantine NumberInput with keyboard controls
- **Enchantment system** - Items can be enchanted from -3 (cursed) to +3 (maximum) affecting combat and AC
- **ResourceDisplay component** - Reusable component for displaying HP/AC/resource information with flexible layouts (2025-07-08 11:56:40 CDT)
- **AbilityManagerViewer component extraction** - Split 379-line component into 5 focused sub-components: LearnAbilitySection, RacialAbilitiesSection, SpellcastingSection, CombatManeuversSection, and FinesseAbilitiesSection (2025-07-08 11:56:40 CDT)
- **Theme constants system** - Created comprehensive color and styling constants in src/theme/constants.ts to eliminate hardcoded values and improve maintainability (2025-07-08 13:26:23 CDT)

### Changed
- Updated CLAUDE.md with testing documentation and planned features
- **App layout** - Split into two columns with character sheet and log viewer
- All character calculations now include verbose logging with before/after states
- **Stat overrides to additive modifiers** - Changed from absolute value replacement to bonus/penalty system with 0-30 clamping
- **Equipment slots reworked** - Added main-hand/off-hand weapon distinction with visual indicators
- **Combat mechanics enhanced** - Off-hand attacks get no level bonus, off-hand damage gets no stat modifier
- **AC calculation improved** - Now includes equipment stat bonuses and enchantment bonuses
- **CharacterDisplay refactored** - Replaced manual h3 tags with standardized CompactResourceDisplay component (2025-07-08 11:56:40 CDT)
- **Style consistency improved** - Updated CharacterDisplay, AbilityViewer, LogViewer, and NotesManager to use theme constants instead of hardcoded colors (2025-07-08 13:26:23 CDT)

### Fixed
- Corrected maneuvers calculation for STR stat: now returns character level when STR >= 16, instead of level modifier
- Fixed inconsistency between `maneuvers` method and `combat_maneuvers` in useChar hook (both now use >= 16)
- **Fixed Mantine Grid import** - Using `Grid.Col` instead of separate `Col` import
- **Removed polearm weapon type** - Cleaned up from types and constants
- **LogViewer display issues** - Auto-refresh now properly shows logs, improved styling with smaller icons
- **CRITICAL: Fixed massive chevron icons** - Resolved 746x749px Select dropdown arrows caused by global flexbox CSS interference
- **Fixed chevron positioning** - Removed problematic global flexbox layout, simplified to grid-based approach for better component control
- **MAJOR: Replaced Mantine Select with custom component** - Built reliable CustomSelect from scratch to eliminate layout issues entirely
- **Improved contrast and readability** - Updated CustomSelect and log colors for dark theme compatibility with high-contrast text
- **Fixed inventory state management** - Resolved equipment conflicts and character reset issues
- **Fixed stat override state persistence** - Override states now properly activate on load and respond immediately to toggle
- **Fixed NumberInput layout issues** - Custom component eliminates Mantine layout problems
- **CRITICAL: Fixed sorcery and finesse point calculation bug** - Resource points now correctly scale with level instead of being capped at base values (2025-07-08 13:36:57 CDT)
- **CRITICAL: Implemented non-retroactive resource system** - Sorcery and finesse points are now only granted for levels gained AFTER reaching required stat thresholds, encouraging strategic stat investment timing. Combat maneuvers remain immediate/retroactive. Added comprehensive threshold tracking to save/load system to ensure proper resource progression across character sessions. (2025-07-08 13:52:00 CDT)

### Technical Details
- Added dependencies: vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom
- Created vitest.config.ts with React plugin and jsdom environment
- Created test setup file with matchMedia mock for Mantine compatibility
- Test files: src/test/useChar.test.ts, src/test/Picker.test.tsx, src/test/logger.test.ts, src/test/enchantment.test.ts
- **Logger architecture**: Category-based logging with multiple levels (debug, info, warn, error)
- **Logging integration**: All character methods now include detailed logging with data snapshots
- LogViewer UI component with real-time filtering and log management
- **CSS Architecture Fix**: Removed global flexbox entirely, simplified to margin/padding based layout
- **Chevron Fix Details**: Added explicit 16px sizing constraints with !important flags to prevent SVG expansion
- **Layout Simplification**: Replaced complex flexbox/grid systems with simple div containers for better Mantine compatibility
- **CustomSelect Component**: Built from scratch with proper positioning, hover effects, keyboard handling, and responsive sizing
- **Bundle Size Reduction**: Removed complex Mantine Select dependencies, reduced build size by ~76KB
- **Dark Theme Colors**: CustomSelect uses #2a2a2a background, #e0e0e0 text, #555 borders with #646cff focus states
- **Enhanced Log Readability**: Updated log level colors (#4a9eff, #ffb347, #ff6b6b) and alternating row backgrounds (#333/#2a2a2a)
- **CRITICAL: Fixed ability persistence bug** - Abilities (spells, metamagic, combat maneuvers) now properly reset when creating new characters instead of persisting from previous characters (2025-07-07 21:42:19 CDT)
- **CRITICAL: Fixed inventory crash bug** - Added missing ScrollArea import in InventoryViewer.tsx that was causing app crashes when adding/managing items (2025-07-08 11:56:40 CDT)
- **Fixed Load Character button** - Restored functionality for "Load Character" button in CharacterDisplay that was broken during refactoring (2025-07-08 08:14:06 CDT)
- **Improved UX with modal dialogs** - Converted CharacterLoader and CharacterSaver to use Mantine modals, providing better visibility and forcing user interaction with critical save/load flows (2025-07-08 08:52:15 CDT)
- **Fixed CharacterLoader in creation flow** - Restored CharacterLoader modal functionality in CharacterCreationFlow and updated corresponding tests (2025-07-08 11:31:52 CDT)
- **Race system architecture**: RACIAL_BONUS constant with flexible stat assignment including "any" stat bonuses
- **Character storage format**: Extended ICharacterStorage with race, abilities, level choices, and inventory data
- **Inventory system design**: InventoryManager with slot-based equipment, validation, and stat bonus calculations
- **Equipment slot types**: main-hand, off-hand, armor, shield with conflict resolution
- **CustomNumberInput implementation**: Keyboard navigation (arrow keys), focus states, value clamping, negative number support
- **EnchantmentControls component**: Modal interface with +1/-1 buttons, reset functionality, and detailed descriptions
- **Comprehensive test coverage**: 141 tests across 24 test files covering all major functionality
- **Type safety improvements**: EnchantmentLevel type (-3 to 3), EquipmentSlot type, enhanced inventory types
- **Theme constants architecture**: 22+ centralized color values including ability-specific colors (racial, finesse, combat, spellword, metamagic), text colors, and background shades with comprehensive TypeScript typing (2025-07-08 13:26:23 CDT)
- **Resource calculation fix**: Updated updateMaxValues() method to properly calculate total sorcery and finesse points including level-based bonuses instead of only base values (2025-07-08 13:36:57 CDT)
- **Non-retroactive resource system**: Added private threshold tracking fields (sorceryThresholdLevel, doubleSorceryThresholdLevel, finesseThresholdLevel) to Char class with getter/setter methods. Updated save/load system (ICharacterStorage, CharacterHasher, CharacterManager) to persist threshold data. Modified finesse point calculation to count only odd levels after threshold reached. Created comprehensive test suite (nonRetroactiveResources.test.ts, thresholdPersistence.test.ts) with 14 tests covering threshold tracking, resource calculation, and save/load functionality (2025-07-08 13:52:00 CDT)

---

## [Initial State] - 2025-07-05 12:07:25 CDT

### Project Overview
- React + TypeScript character generator for tabletop RPG
- Uses Vite for build tooling
- Mantine UI components for interface
- Character creation with stat selection (STR/DEX/INT)
- Basic character progression and combat calculations

### Core Features
- Two-phase stat selection (primary 16, secondary 10, tertiary 6)
- Character leveling with stat increases
- Combat maneuvers, finesse points, and sorcery points
- Equipment system with armor, weapons, and shields
- AC and HP calculations
- Basic attack and sneak attack damage

### Architecture
- `Char` class for character logic with mitt event emitter
- `useChar` hook for React state management
- Component-based UI with `App`, `Picker` components
- Constants file for game balance values
- TypeScript types for Armor, Weapon, Stat