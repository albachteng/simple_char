import { Group, Stack, Text, Title } from '@mantine/core';
import { TooltipHelper } from './TooltipHelper';

interface ResourceItem {
  label: string;
  value: string | number;
  maxValue?: string | number;
  color?: string;
  tooltip?: string;
}

interface ResourceDisplayProps {
  resources: ResourceItem[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabels?: boolean;
  style?: React.CSSProperties;
}

export function ResourceDisplay({
  resources,
  layout = 'vertical',
  size = 'md',
  spacing = 'sm',
  showLabels = true,
  style
}: ResourceDisplayProps) {
  const renderResource = (resource: ResourceItem, index: number) => {
    const displayValue = resource.maxValue 
      ? `${resource.value}/${resource.maxValue}`
      : resource.value;

    const titleSize = size === 'xs' ? 'h6' : size === 'sm' ? 'h5' : size === 'md' ? 'h4' : size === 'lg' ? 'h3' : 'h2';
    
    if (showLabels) {
      return (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Title order={3} size={titleSize} c={resource.color}>
            {resource.label}: {displayValue}
          </Title>
          {resource.tooltip && <TooltipHelper content={resource.tooltip} />}
        </div>
      );
    }

    return (
      <div key={index} style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <Text size="xs" c="dimmed" mb={2}>
            {resource.label}
          </Text>
          {resource.tooltip && <TooltipHelper content={resource.tooltip} size="xs" />}
        </div>
        <Title order={2} size={titleSize} c={resource.color}>
          {displayValue}
        </Title>
      </div>
    );
  };

  const resourceElements = resources.map(renderResource);

  if (layout === 'horizontal') {
    return (
      <Group justify="center" gap={spacing} style={style}>
        {resourceElements}
      </Group>
    );
  }

  if (layout === 'grid') {
    const gridStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(resources.length, 3)}, 1fr)`,
      gap: '16px',
      justifyItems: 'center',
      ...style
    };

    return (
      <div style={gridStyle}>
        {resourceElements}
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <Stack gap={spacing} style={style}>
      {resourceElements}
    </Stack>
  );
}

// Convenience function for creating basic resource items
export function createResourceItem(
  label: string, 
  value: string | number, 
  maxValue?: string | number,
  color?: string,
  tooltip?: string
): ResourceItem {
  return { label, value, maxValue, color, tooltip };
}

// Convenience function for creating character resources
export function createCharacterResources(
  hp: number,
  ac: number,
  combat_maneuvers: number,
  finesse_points: number,
  sorcery_points: number,
  max_combat_maneuvers?: number,
  max_finesse_points?: number,
  max_sorcery_points?: number
): ResourceItem[] {
  return [
    createResourceItem('HP', hp),
    createResourceItem('AC', ac),
    createResourceItem('Maneuvers', combat_maneuvers, max_combat_maneuvers),
    createResourceItem('Finesse', finesse_points, max_finesse_points),
    createResourceItem('Sorcery', sorcery_points, max_sorcery_points)
  ];
}

// More compact resource display for character stats
export function CompactResourceDisplay({
  hp,
  ac,
  combat_maneuvers,
  finesse_points,
  sorcery_points,
  max_combat_maneuvers,
  max_finesse_points,
  max_sorcery_points,
  // Optional tooltip data
  level,
  str,
  dex,
  int,
  finesseThresholdLevel,
  sorceryThresholdLevel,
  doubleSorceryThresholdLevel,
  ...props
}: {
  hp: number;
  ac: number;
  combat_maneuvers: number;
  finesse_points: number;
  sorcery_points: number;
  max_combat_maneuvers?: number;
  max_finesse_points?: number;
  max_sorcery_points?: number;
  // Optional tooltip data
  level?: number;
  str?: number;
  dex?: number;
  int?: number;
  finesseThresholdLevel?: number | null;
  sorceryThresholdLevel?: number | null;
  doubleSorceryThresholdLevel?: number | null;
} & Omit<ResourceDisplayProps, 'resources'>) {
  
  // Create tooltip content for finesse points
  const createFinesseTooltip = () => {
    if (!level || !dex || finesseThresholdLevel === undefined) return undefined;
    
    if (finesseThresholdLevel === null) {
      return "You need 16 Dexterity to gain finesse points. Finesse points are used for Sneak Attacks and Assassinations.";
    }
    
    const breakdown = [
      "You gain one finesse point when you reach 16 dexterity, and an additional point for each odd-numbered level after that.",
      "Finesse points are used for Sneak Attacks and Assassinations.",
      "",
      "Calculation:"
    ];
    
    breakdown.push(`1 (reached 16 Dex at level ${finesseThresholdLevel})`);
    
    // Add points for odd levels after threshold
    for (let lvl = finesseThresholdLevel + 1; lvl <= level; lvl++) {
      if (lvl % 2 === 1) {
        breakdown.push(`+ 1 (Level ${lvl})`);
      }
    }
    
    return breakdown.join('\n');
  };
  
  // Create tooltip content for sorcery points
  const createSorceryTooltip = () => {
    if (!level || !int || sorceryThresholdLevel === undefined) return undefined;
    
    if (sorceryThresholdLevel === null) {
      return "You need at least 11 Intelligence to gain sorcery points. Sorcery points are used for spellcasting.";
    }
    
    const breakdown = [
      "Sorcery points are first gained when you have at least 11 intelligence and start at 3, gaining one point for each level thereafter.",
      "You gain an additional point for each level that your intelligence is higher than 14.",
      "",
      "Calculation:"
    ];
    
    const levelsAfterThreshold = Math.max(0, level - sorceryThresholdLevel);
    breakdown.push(`3 (base at ${sorceryThresholdLevel} INT)`);
    
    if (levelsAfterThreshold > 0) {
      breakdown.push(`+ ${levelsAfterThreshold} (levels after reaching 11 INT)`);
    }
    
    if (doubleSorceryThresholdLevel !== null && doubleSorceryThresholdLevel !== undefined) {
      const levelsAfterDoubleThreshold = Math.max(0, level - doubleSorceryThresholdLevel);
      if (levelsAfterDoubleThreshold > 0) {
        breakdown.push(`+ ${levelsAfterDoubleThreshold} (levels after reaching 15 INT)`);
      }
    }
    
    return breakdown.join('\n');
  };
  
  // Create tooltip content for combat maneuvers
  const createCombatTooltip = () => {
    if (!level || !str) return undefined;
    
    if (str < 16) {
      return "You need at least 16 Strength to gain combat maneuvers. Combat maneuvers equal your current level when you have 16+ Strength.";
    }
    
    return `Combat maneuvers equal your current level as long as you have at least 16 strength.\n\nCurrent: ${level} maneuvers (Level ${level} with ${str} STR)`;
  };
  
  const resources = [
    createResourceItem('HP', hp),
    createResourceItem('AC', ac),
    createResourceItem('Maneuvers', combat_maneuvers, max_combat_maneuvers, undefined, createCombatTooltip()),
    createResourceItem('Finesse', finesse_points, max_finesse_points, undefined, createFinesseTooltip()),
    createResourceItem('Sorcery', sorcery_points, max_sorcery_points, undefined, createSorceryTooltip())
  ];

  return <ResourceDisplay resources={resources} {...props} />;
}