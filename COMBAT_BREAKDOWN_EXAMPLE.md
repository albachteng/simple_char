# Combat Roll Breakdown Examples

This document shows examples of how the combat roll breakdown system works.

## Example Calculations

### Main-Hand Attack Roll
**Result: 14**
```
10 (1d20) + 3 (STR modifier) + 1 (level)
```

### Main-Hand Damage Roll
**Result: 7**
```
4 (1d8) + 3 (STR modifier)
```

### Off-Hand Attack Roll
**Result: 10**
```
10 (1d20) + 0 (DEX modifier)
```
*Note: Off-hand gets no level bonus*

### Off-Hand Damage Roll
**Result: 3**
```
3 (1d6)
```
*Note: Off-hand gets no stat modifier*

## Future Enhancements

When enchantment bonuses are implemented, the breakdowns will include:

### Enchanted Main-Hand Attack Roll
**Result: 16**
```
10 (1d20) + 3 (STR modifier) + 1 (level) + 2 (enchantment)
```

### Enchanted Main-Hand Damage Roll
**Result: 9**
```
4 (1d8) + 3 (STR modifier) + 2 (enchantment)
```

## Technical Implementation

The breakdown system:
1. Calls the existing `mainHandAttackRoll()` / `offHandAttackRoll()` methods to get the total result
2. Works backwards to calculate the individual components
3. Displays each component with clear labels
4. Uses monospace font for easy reading
5. Shows different information for main-hand vs off-hand weapons

This provides full transparency into how combat numbers are calculated while maintaining compatibility with the existing dice system and all future enhancements.