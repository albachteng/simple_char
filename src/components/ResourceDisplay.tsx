import { Group, Stack, Text, Title } from '@mantine/core';

interface ResourceItem {
  label: string;
  value: string | number;
  maxValue?: string | number;
  color?: string;
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
        <Title key={index} order={3} size={titleSize} c={resource.color}>
          {resource.label}: {displayValue}
        </Title>
      );
    }

    return (
      <div key={index} style={{ textAlign: 'center' }}>
        <Text size="xs" c="dimmed" mb={2}>
          {resource.label}
        </Text>
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
  color?: string
): ResourceItem {
  return { label, value, maxValue, color };
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
} & Omit<ResourceDisplayProps, 'resources'>) {
  const resources = createCharacterResources(
    hp,
    ac,
    combat_maneuvers,
    finesse_points,
    sorcery_points,
    max_combat_maneuvers,
    max_finesse_points,
    max_sorcery_points
  );

  return <ResourceDisplay resources={resources} {...props} />;
}