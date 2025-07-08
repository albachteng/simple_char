import { Paper, Text, Stack, Group, Badge, Accordion } from '@mantine/core'
import { COLORS, STYLES } from '../theme/constants'

interface RacialAbilitiesSectionProps {
  abilities: string[]
}

// Racial ability descriptions
const RACIAL_DESCRIPTIONS: { [key: string]: string } = {
  "Treewalk": "In the forests, the elves' movements become almost impossible to follow",
  "Tinker": "Repairs and alterations, and a willingness to take anything apart",
  "Contract": "A favor or allegiance owed, or perhaps an uncanny gift for negotiating",
  "Stonesense": "Dwarves know the logic of stones, their language and nature",
  "Flametongue": "You know the Flametongue spellword and can cast it for free - a legacy of draconic lineage",
  "Lucky": "The smallfolk are implausibly capable, always pulling victory from the jaws of defeat"
}

export function RacialAbilitiesSection({ abilities }: RacialAbilitiesSectionProps) {
  if (abilities.length === 0) {
    return null
  }

  return (
    <Accordion.Item value="racial">
      <Accordion.Control>
        <Group justify="space-between">
          <Text fw={500}>Racial Abilities</Text>
          <Badge size="sm" color="blue">{abilities.length}</Badge>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="xs">
          {abilities.map((ability, index) => (
            <Paper key={index} p="sm" withBorder style={STYLES.CARD_BACKGROUND}>
              <Text size="sm" fw={500} style={{ color: COLORS.RACIAL_ABILITY }}>{ability}</Text>
              <Text size="xs" style={STYLES.DESCRIPTION_TEXT}>
                {RACIAL_DESCRIPTIONS[ability] || "A special racial ability"}
              </Text>
            </Paper>
          ))}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  )
}