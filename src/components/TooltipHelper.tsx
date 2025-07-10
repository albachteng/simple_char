import { Tooltip, ActionIcon } from '@mantine/core';
import { IconQuestionMark } from '@tabler/icons-react';
import { COLORS } from '../theme/constants';

interface TooltipHelperProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
  multiline?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function TooltipHelper({ 
  content, 
  position = 'top', 
  maxWidth = 300,
  multiline = true,
  size = 'xs'
}: TooltipHelperProps) {
  return (
    <Tooltip
      label={content}
      position={position}
      multiline={multiline}
      maw={maxWidth}
      withArrow
      transitionProps={{ duration: 200 }}
      styles={{
        tooltip: {
          backgroundColor: COLORS.BACKGROUND_DARK,
          color: COLORS.TEXT_PRIMARY,
          border: `1px solid ${COLORS.TEXT_SECONDARY}`,
          fontSize: '13px',
          lineHeight: '1.4',
        },
        arrow: {
          borderColor: COLORS.TEXT_SECONDARY,
        },
      }}
    >
      <ActionIcon
        variant="transparent"
        size={size}
        style={{
          color: COLORS.TEXT_SECONDARY,
          cursor: 'help',
        }}
      >
        <IconQuestionMark size={size === 'xs' ? 12 : 14} />
      </ActionIcon>
    </Tooltip>
  );
}

// Utility function to create calculation explanations
export function createCalculationTooltip(
  calculationName: string,
  current: number,
  max: number,
  breakdown: string[]
): string {
  const header = `${calculationName}: ${current}/${max}`;
  const explanation = breakdown.join('\n');
  return `${header}\n\n${explanation}`;
}

// Utility function to create stat progression explanations
export function createStatProgressionTooltip(
  statName: string,
  currentValue: number,
  originalValue: number,
  levelUpChoices: string[]
): string {
  const header = `${statName.toUpperCase()}: ${currentValue}`;
  const starting = `Starting value: ${originalValue}`;
  
  if (levelUpChoices.length === 0) {
    return `${header}\n\n${starting}\nNo level-up increases yet.`;
  }
  
  // Count how many times this stat was chosen
  const statBonus = levelUpChoices.length * 2;
  const totalIncrease = currentValue - originalValue;
  
  const breakdown = [`${header}\n\n${starting}`];
  
  if (statBonus > 0) {
    breakdown.push(`Level-up increases: +${statBonus} (${levelUpChoices.length} choices × 2 points each)`);
  }
  
  if (totalIncrease > statBonus) {
    const otherBonus = totalIncrease - statBonus;
    breakdown.push(`Other bonuses: +${otherBonus} (racial bonuses, equipment, etc.)`);
  }
  
  return breakdown.join('\n');
}