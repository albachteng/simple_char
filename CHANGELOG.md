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

### Changed
- Updated CLAUDE.md with testing documentation and planned features
- **App layout** - Split into two columns with character sheet and log viewer
- All character calculations now include verbose logging with before/after states

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

### Technical Details
- Added dependencies: vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom
- Created vitest.config.ts with React plugin and jsdom environment
- Created test setup file with matchMedia mock for Mantine compatibility
- Test files: src/test/useChar.test.ts, src/test/Picker.test.tsx, src/test/logger.test.ts
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