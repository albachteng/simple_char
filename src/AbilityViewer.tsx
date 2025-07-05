import { Paper, Text, Stack } from '@mantine/core'

interface AbilityViewerProps {
  abilities: string[]
}

export function AbilityViewer({ abilities }: AbilityViewerProps) {
  if (abilities.length === 0) {
    return null
  }

  return (
    <Paper p="md" withBorder style={{ marginTop: '16px' }}>
      <Stack gap="sm">
        <Text size="lg" fw={600}>Special Abilities</Text>
        {abilities.map((ability, index) => (
          <Paper key={index} p="sm" withBorder style={{ backgroundColor: '#333' }}>
            <Text size="sm" style={{ color: '#e0e0e0' }}>{ability}</Text>
          </Paper>
        ))}
      </Stack>
    </Paper>
  )
}