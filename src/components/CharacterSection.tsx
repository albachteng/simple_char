import { Paper, Stack, Title, Text } from '@mantine/core';
import { ReactNode } from 'react';

interface CharacterSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  
  // Layout options
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Visual options  
  withBorder?: boolean;
  withShadow?: boolean;
  
  // Style overrides
  style?: React.CSSProperties;
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  
  // Content alignment
  align?: 'left' | 'center' | 'right';
}

export function CharacterSection({
  title,
  subtitle,
  children,
  spacing = 'sm',
  padding = 'md',
  withBorder = false,
  withShadow = false,
  style,
  titleLevel = 1,
  align = 'center'
}: CharacterSectionProps) {
  const containerStyle: React.CSSProperties = {
    textAlign: align,
    ...style
  };

  return (
    <Paper
      p={padding}
      withBorder={withBorder}
      shadow={withShadow ? 'sm' : undefined}
      style={containerStyle}
    >
      <Stack gap={spacing}>
        {title && (
          <Title order={titleLevel} size={titleLevel === 1 ? 'h1' : titleLevel === 2 ? 'h2' : 'h3'}>
            {title}
          </Title>
        )}
        
        {subtitle && (
          <Text c="dimmed" size="sm">
            {subtitle}
          </Text>
        )}
        
        {children}
      </Stack>
    </Paper>
  );
}

// Convenience components for common use cases
export function PickerSection({ title, subtitle, children, ...props }: Omit<CharacterSectionProps, 'titleLevel'>) {
  return (
    <CharacterSection 
      title={title}
      subtitle={subtitle}
      titleLevel={1}
      align="center"
      padding="lg"
      {...props}
    >
      {children}
    </CharacterSection>
  );
}

export function DisplaySection({ title, subtitle, children, ...props }: Omit<CharacterSectionProps, 'titleLevel' | 'withBorder'>) {
  return (
    <CharacterSection 
      title={title}
      subtitle={subtitle}
      titleLevel={3}
      align="left"
      withBorder={true}
      style={{ marginTop: '16px', ...props.style }}
      {...props}
    >
      {children}
    </CharacterSection>
  );
}

export function CardSection({ children, ...props }: Omit<CharacterSectionProps, 'align' | 'padding'>) {
  return (
    <CharacterSection
      align="center"
      padding="lg" 
      {...props}
    >
      {children}
    </CharacterSection>
  );
}