// Theme constants for consistent styling across the application
export const COLORS = {
  // Dark theme backgrounds
  BACKGROUND_DARK: '#2a2a2a',
  BACKGROUND_DARKER: '#333',
  BACKGROUND_DARKEST: '#404040',
  
  // Text colors  
  TEXT_PRIMARY: '#e0e0e0',
  TEXT_SECONDARY: '#bbb',
  TEXT_MUTED: '#999',
  
  // Border colors
  BORDER_LIGHT: '#555',
  BORDER_MEDIUM: '#666',
  
  // Accent colors for abilities
  RACIAL_ABILITY: '#ffb347',    // Orange/amber - for racial abilities
  FINESSE_ABILITY: '#51cf66',   // Green - for finesse abilities  
  COMBAT_ABILITY: '#ff6b6b',    // Red - for combat abilities
  SPELLWORD_ABILITY: '#bb86fc', // Purple - for spellwords
  METAMAGIC_ABILITY: '#03dac6', // Cyan - for metamagic
  
  // Status/UI colors
  SUCCESS: '#51cf66',
  WARNING: '#ffb347', 
  ERROR: '#ff6b6b',
  INFO: '#4a9eff',
  
  // Focus/interaction colors
  FOCUS_PRIMARY: '#646cff',
  HOVER_OVERLAY: 'rgba(255, 255, 255, 0.1)',
} as const

// Spacing constants
export const SPACING = {
  XS: '4px',
  SM: '8px', 
  MD: '16px',
  LG: '24px',
  XL: '32px',
} as const

// Component-specific style helpers
export const STYLES = {
  // Common paper/card backgrounds
  CARD_BACKGROUND: {
    backgroundColor: COLORS.BACKGROUND_DARK,
  },
  
  // Common text styles
  DESCRIPTION_TEXT: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: '12px',
    marginTop: '4px',
  },
  
  // Common border styles
  CARD_BORDER: {
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
  },
} as const

// Type exports for better TypeScript support
export type ColorKey = keyof typeof COLORS
export type SpacingKey = keyof typeof SPACING