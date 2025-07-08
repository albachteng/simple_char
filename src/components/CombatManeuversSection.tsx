import { Paper, Text, Stack, Group, Badge, Accordion, ActionIcon } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { LearnedAbility } from '../abilities/AbilityManager'

interface CombatManeuversSectionProps {
  str: number
  combat_maneuvers: number
  max_combat_maneuvers: number
  learnedManeuvers: LearnedAbility[]
  onForgetAbility: (ability: LearnedAbility) => void
}

export function CombatManeuversSection({ 
  str, 
  combat_maneuvers, 
  max_combat_maneuvers, 
  learnedManeuvers, 
  onForgetAbility 
}: CombatManeuversSectionProps) {
  return (
    <Accordion.Item value="combat">
      <Accordion.Control>
        <Group justify="space-between">
          <Text fw={500}>Combat Maneuvers</Text>
          <Badge size="sm" color="red">{combat_maneuvers}/{max_combat_maneuvers}</Badge>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="sm">
          <Text size="sm" style={{ color: '#bbb' }}>
            STR {str} (≥16) grants {max_combat_maneuvers} combat maneuver uses per encounter. Current: {combat_maneuvers} remaining.
          </Text>
          {learnedManeuvers.length > 0 ? (
            <Stack gap="xs">
              {learnedManeuvers.map((ability) => (
                <Paper key={ability.id} p="xs" withBorder style={{ backgroundColor: '#2a2a2a' }}>
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Text size="sm" fw={500} style={{ color: '#ff6b6b' }}>{ability.name}</Text>
                        {ability.learnedAt && (
                          <Badge size="xs" color="gray" variant="outline">Lv {ability.learnedAt}</Badge>
                        )}
                      </Group>
                      <Text size="xs" style={{ color: '#bbb', marginTop: '2px' }}>
                        {ability.description}
                      </Text>
                    </Stack>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => onForgetAbility(ability)}
                      title="Forget this ability"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No combat maneuvers learned yet. Use the "Learn New Ability" section above to add some!
            </Text>
          )}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  )
}