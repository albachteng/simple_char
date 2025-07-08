import { Button } from '@mantine/core';
import { Stat } from '../../types';

interface StatButtonConfig {
  label: string;
  onClick: () => void;
  variant?: 'filled' | 'outline' | 'light' | 'subtle' | 'transparent' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  style?: React.CSSProperties;
}

interface StatButtonGroupProps {
  layout?: 'vertical' | 'horizontal';
  wrapInHeadings?: boolean;
  buttonConfigs: {
    str: StatButtonConfig;
    dex: StatButtonConfig;
    int: StatButtonConfig;
  };
}

export function StatButtonGroup({ 
  layout = 'vertical', 
  wrapInHeadings = true, 
  buttonConfigs 
}: StatButtonGroupProps) {
  const stats: Stat[] = ['str', 'dex', 'int'];
  
  const renderButton = (stat: Stat) => {
    const config = buttonConfigs[stat];
    return (
      <Button
        key={stat}
        onClick={config.onClick}
        variant={config.variant || 'filled'}
        size={config.size || 'md'}
        disabled={config.disabled || false}
        style={config.style}
      >
        {config.label}
      </Button>
    );
  };

  const buttons = stats.map(stat => {
    const button = renderButton(stat);
    
    if (wrapInHeadings) {
      return (
        <h3 key={stat}>
          {" "}{button}
        </h3>
      );
    }
    
    return button;
  });

  if (layout === 'horizontal') {
    const containerStyle: React.CSSProperties = {
      display: 'flex',
      gap: '8px',
      ...(wrapInHeadings ? {} : { alignItems: 'center' })
    };
    
    return <div style={containerStyle}>{buttons}</div>;
  }

  return <>{buttons}</>;
}

// Convenience function for creating simple stat selection buttons
export function createStatSelectionButtons(
  onStatSelect: (stat: Stat) => void,
  suffix?: string
): StatButtonGroupProps['buttonConfigs'] {
  return {
    str: {
      label: `STR${suffix ? ` ${suffix}` : ''}`,
      onClick: () => onStatSelect('str')
    },
    dex: {
      label: `DEX${suffix ? ` ${suffix}` : ''}`,
      onClick: () => onStatSelect('dex')
    },
    int: {
      label: `INT${suffix ? ` ${suffix}` : ''}`,
      onClick: () => onStatSelect('int')
    }
  };
}

// Convenience function for creating bonus allocation buttons
export function createBonusAllocationButtons(
  onStatSelect: (stat: Stat) => void,
  bonusAmount: number
): StatButtonGroupProps['buttonConfigs'] {
  return {
    str: {
      label: `STR (+${bonusAmount})`,
      onClick: () => onStatSelect('str')
    },
    dex: {
      label: `DEX (+${bonusAmount})`,
      onClick: () => onStatSelect('dex')
    },
    int: {
      label: `INT (+${bonusAmount})`,
      onClick: () => onStatSelect('int')
    }
  };
}

// Convenience function for creating level-up allocation buttons
export function createLevelUpAllocationButtons(
  onStatSelect: (stat: Stat) => void,
  disabled: boolean = false
): StatButtonGroupProps['buttonConfigs'] {
  return {
    str: {
      label: '+1 STR',
      onClick: () => onStatSelect('str'),
      variant: 'outline',
      size: 'sm',
      disabled
    },
    dex: {
      label: '+1 DEX',
      onClick: () => onStatSelect('dex'),
      variant: 'outline',
      size: 'sm',
      disabled
    },
    int: {
      label: '+1 INT',
      onClick: () => onStatSelect('int'),
      variant: 'outline',
      size: 'sm',
      disabled
    }
  };
}