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
- All changes should be documented with date/time stamps

## Development Guidelines
- Add unit tests for all new features
- Use Mantine UI components for consistency
- Focus on functionality over styling
- Document all changes in changelog with timestamps
- Test thoroughly before moving to next feature

## IMPORTANT: Game System Rules

**DO NOT MODIFY CONSTANTS.TS** - This file contains the game balance and rules for a custom RPG system (NOT D&D). The racial bonuses, stat progressions, equipment values, and other game mechanics are specifically designed for this system. Do not:
- Change racial bonus values or abilities
- Modify stat progression formulas
- Alter equipment statistics or requirements
- Update any game balance numbers without explicit user request

When working with racial bonuses or other game mechanics, use the existing data as-is. If tests fail due to game data, update the tests to match the constants, not the other way around.