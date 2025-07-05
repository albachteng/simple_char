# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial testing framework setup with Vitest and React Testing Library
- Test configuration with jsdom environment and matchMedia mock for Mantine components
- Unit tests for `mod` function and `Char` class core functionality
- Component tests for `Picker` component
- npm test commands in package.json

### Changed
- Updated CLAUDE.md with testing documentation and planned features

### Fixed
- Corrected maneuvers calculation for STR stat: now returns character level when STR >= 16, instead of level modifier
- Fixed inconsistency between `maneuvers` method and `combat_maneuvers` in useChar hook (both now use >= 16)

### Technical Details
- Added dependencies: vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom
- Created vitest.config.ts with React plugin and jsdom environment
- Created test setup file with matchMedia mock for Mantine compatibility
- Test files: src/test/useChar.test.ts, src/test/Picker.test.tsx

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