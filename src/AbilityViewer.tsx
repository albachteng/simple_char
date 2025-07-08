import { Paper, Text, Stack, Accordion, Badge, Group, Divider } from '@mantine/core'
import { MIN_SPELLCASTING_INT } from '../constants'
import { AbilityManager } from './abilities/AbilityManager'
import { COLORS, STYLES } from './theme/constants'

interface AbilityViewerProps {
  abilities: string[]
  str: number
  dex: number
  int: number
  level: number
  sorcery_points: number
  max_sorcery_points: number
  combat_maneuvers: number
  max_combat_maneuvers: number
  finesse_points: number
  max_finesse_points: number
  abilityManager: AbilityManager
}

// Ability descriptions for better user understanding
const RACIAL_DESCRIPTIONS: { [key: string]: string } = {
  "Treewalk": "In the forests, the elves' movements become almost impossible to follow",
  "Tinker": "Repairs and alterations, and a willingness to take anything apart",
  "Contract": "A favor or allegiance owed, or perhaps an uncanny gift for negotiating",
  "Stonesense": "Dwarves know the logic of stones, their language and nature",
  "Flametongue": "You know the Flametongue spellword and can cast it for free - a legacy of draconic lineage",
  "Lucky": "The smallfolk are implausibly capable, always pulling victory from the jaws of defeat"
}


export function AbilityViewer({ 
  abilities, 
  str, 
  dex, 
  int, 
  sorcery_points,
  max_sorcery_points,
  combat_maneuvers,
  max_combat_maneuvers, 
  finesse_points,
  max_finesse_points,
  abilityManager
}: AbilityViewerProps) {
  const hasSpellcasting = int >= MIN_SPELLCASTING_INT && max_sorcery_points > 0
  const hasCombatManeuvers = max_combat_maneuvers > 0
  const hasFinesse = max_finesse_points > 0

  // Get learned abilities from the manager
  const learnedMetamagic = abilityManager.getAbilitiesByType('metamagic')
  const learnedSpellwords = abilityManager.getAbilitiesByType('spellword')
  const learnedManeuvers = abilityManager.getAbilitiesByType('combat_maneuver')

  // Only show spellcasting if character has spellcasting AND has learned spells/metamagic
  const showSpellcasting = hasSpellcasting && (learnedMetamagic.length > 0 || learnedSpellwords.length > 0)
  // Only show combat maneuvers if character can use them AND has learned some
  const showCombatManeuvers = hasCombatManeuvers && learnedManeuvers.length > 0

  // Don't render if no abilities of any kind
  if (abilities.length === 0 && !showSpellcasting && !showCombatManeuvers && !hasFinesse) {
    return null
  }

  return (
    <Paper p="md" withBorder style={{ marginTop: '16px' }}>
      <Stack gap="md">
        <Text size="lg" fw={600}>Special Abilities</Text>
        
        <Accordion multiple defaultValue={['racial']}>
          {/* Racial Abilities */}
          {abilities.length > 0 && (
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
          )}

          {/* Spellcasting */}
          {showSpellcasting && (
            <Accordion.Item value="spellcasting">
              <Accordion.Control>
                <Group justify="space-between">
                  <Text fw={500}>Spellcasting</Text>
                  <Badge size="sm" color="purple">{sorcery_points}/{max_sorcery_points}</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <Text size="sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                    INT {int} allows spellcasting. Combine Spellwords with Metamagic to create custom spells.
                  </Text>
                  
                  {learnedSpellwords.length > 0 && (
                    <>
                      <Divider label="Known Spellwords" labelPosition="center" />
                      <Stack gap="xs">
                        {learnedSpellwords.map((ability) => (
                          <Paper key={ability.id} p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
                            <Group justify="space-between">
                              <Text size="sm" fw={500} style={{ color: COLORS.SPELLWORD_ABILITY }}>{ability.name}</Text>
                              {ability.learnedAt && (
                                <Badge size="xs" color="gray" variant="outline">Lv {ability.learnedAt}</Badge>
                              )}
                            </Group>
                            <Text size="xs" style={STYLES.DESCRIPTION_TEXT}>
                              {ability.description}
                            </Text>
                          </Paper>
                        ))}
                      </Stack>
                    </>
                  )}

                  {learnedMetamagic.length > 0 && (
                    <>
                      <Divider label="Known Metamagic" labelPosition="center" />
                      <Stack gap="xs">
                        {learnedMetamagic.map((ability) => (
                          <Paper key={ability.id} p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
                            <Group justify="space-between">
                              <Text size="sm" fw={500} style={{ color: COLORS.METAMAGIC_ABILITY }}>{ability.name}</Text>
                              {ability.learnedAt && (
                                <Badge size="xs" color="gray" variant="outline">Lv {ability.learnedAt}</Badge>
                              )}
                            </Group>
                            <Text size="xs" style={STYLES.DESCRIPTION_TEXT}>
                              {ability.description}
                            </Text>
                          </Paper>
                        ))}
                      </Stack>
                    </>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          )}

          {/* Combat Maneuvers */}
          {showCombatManeuvers && (
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
                  <Stack gap="xs">
                    {learnedManeuvers.map((ability) => (
                      <Paper key={ability.id} p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
                        <Group justify="space-between">
                          <Text size="sm" fw={500} style={{ color: COLORS.COMBAT_ABILITY }}>{ability.name}</Text>
                          {ability.learnedAt && (
                            <Badge size="xs" color="gray" variant="outline">Lv {ability.learnedAt}</Badge>
                          )}
                        </Group>
                        <Text size="xs" style={STYLES.DESCRIPTION_TEXT}>
                          {ability.description}
                        </Text>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          )}

          {/* Finesse Abilities */}
          {hasFinesse && (
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
                      Roll {max_finesse_points}d8 extra damage when attacking with advantage or when target is engaged with an ally. Costs 1 finesse point per use.
                    </Text>
                  </Paper>
                  <Paper p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
                    <Text size="sm" fw={500} style={{ color: COLORS.FINESSE_ABILITY }}>Enhanced Hide</Text>
                    <Text size="xs" style={STYLES.DESCRIPTION_TEXT}>
                      When hiding in light armor or no armor, double your level bonus to stealth rolls
                    </Text>
                  </Paper>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          )}
        </Accordion>
      </Stack>
    </Paper>
  )
}
