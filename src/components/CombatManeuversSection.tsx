import { Paper, Text, Stack, Group, Badge, Accordion, ActionIcon, Button } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { LearnedAbility } from '../abilities/AbilityManager'
import { COLORS, STYLES } from '../theme/constants'

interface CombatManeuversSectionProps {
  str: number
  combat_maneuvers: number
  max_combat_maneuvers: number
  learnedManeuvers: LearnedAbility[]
  onForgetAbility: (ability: LearnedAbility) => void
  spendCombatManeuverPoint?: () => boolean
}

export function CombatManeuversSection({ 
  str, 
  combat_maneuvers, 
  max_combat_maneuvers, 
  learnedManeuvers, 
  onForgetAbility,
  spendCombatManeuverPoint
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
          <Text size="sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            STR {str} (≥16) grants {max_combat_maneuvers} combat maneuver uses per encounter. Current: {combat_maneuvers} remaining.
          </Text>
          
          {spendCombatManeuverPoint && (
            <Group justify="center">
              <Button 
                size="sm" 
                variant="outline" 
                color="red"
                onClick={() => spendCombatManeuverPoint()}
                disabled={combat_maneuvers <= 0}
              >
                Use Combat Maneuver (Spend 1 Use)
              </Button>
            </Group>
          )}
          {learnedManeuvers.length > 0 ? (
            <Stack gap="xs">
              {learnedManeuvers.map((ability) => (
                <Paper key={ability.id} p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Text size="sm" fw={500} style={{ color: COLORS.COMBAT_ABILITY }}>{ability.name}</Text>
                        {ability.learnedAt && (
                          <Badge size="xs" color="gray" variant="outline">Lv {ability.learnedAt}</Badge>
                        )}
                      </Group>
                      <Text size="xs" style={STYLES.DESCRIPTION_TEXT}>
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