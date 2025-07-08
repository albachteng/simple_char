import { Paper, Text, Stack, Group, Badge, Accordion } from '@mantine/core'

interface FinesseAbilitiesSectionProps {
  dex: number
  finesse_points: number
  max_finesse_points: number
}

export function FinesseAbilitiesSection({ dex, finesse_points, max_finesse_points }: FinesseAbilitiesSectionProps) {
  return (
    <Accordion.Item value="finesse">
      <Accordion.Control>
        <Group justify="space-between">
          <Text fw={500}>Finesse Abilities</Text>
          <Badge size="sm" color="green">{finesse_points}/{max_finesse_points}</Badge>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="sm">
          <Text size="sm" style={{ color: '#bbb' }}>
            DEX {dex} (≥16) grants finesse abilities and sneak attack dice.
          </Text>
          <Paper p="xs" withBorder style={{ backgroundColor: '#2a2a2a' }}>
            <Text size="sm" fw={500} style={{ color: '#51cf66' }}>Sneak Attack</Text>
            <Text size="xs" style={{ color: '#bbb', marginTop: '2px' }}>
              Roll {max_finesse_points}d8 extra damage when attacking with advantage or when target is engaged with an ally. Costs 1 finesse point per use.
            </Text>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#2a2a2a' }}>
            <Text size="sm" fw={500} style={{ color: '#51cf66' }}>Enhanced Hide</Text>
            <Text size="xs" style={{ color: '#bbb', marginTop: '2px' }}>
              When hiding in light armor or no armor, double your level bonus to stealth rolls
            </Text>
          </Paper>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  )
}