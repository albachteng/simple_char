import { Paper, Text, Stack, Group, Badge, Accordion } from '@mantine/core'
import { COLORS, STYLES } from '../theme/constants'

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
          <Text size="sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            DEX {dex} (≥16) grants finesse abilities and sneak attack dice.
          </Text>
          <Paper p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
            <Text size="sm" fw={500} style={{ color: COLORS.FINESSE_ABILITY }}>Sneak Attack</Text>
            <Text size="xs" style={STYLES.DESCRIPTION_TEXT}>
              Roll {finesse_points}d8 extra damage when attacking with advantage or when target is engaged with an ally. Costs 1 finesse point per use.
            </Text>
          </Paper>
          <Paper p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
            <Text size="sm" fw={500} style={{ color: COLORS.FINESSE_ABILITY }}>Assassination</Text>
            <Text size="xs" style={STYLES.DESCRIPTION_TEXT}>
              Roll {finesse_points}d8 extra damage when attacking an unaware enemy who has taken no turns in combat. Automatically hits critically if the attack roll succeeds. Costs no finesse points.
            </Text>
          </Paper>
          <Paper p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
            <Text size="sm" fw={500} style={{ color: COLORS.FINESSE_ABILITY }}>Enhanced Hide</Text>
            <Text size="xs" style={STYLES.DESCRIPTION_TEXT}>
              When hiding, double your level bonus to stealth rolls.
            </Text>
          </Paper>
          <Paper p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
            <Text size="sm" fw={500} style={{ color: COLORS.FINESSE_ABILITY }}>Sleight of Hand</Text>
            <Text size="xs" style={STYLES.DESCRIPTION_TEXT}>
			  Double the your level bonus when performing a sleight-of-hand check. 
            </Text>
          </Paper>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  )
}
