import { useState } from 'react'
import { Paper, Text, Stack, Button, Select, Group, Accordion, Badge, ActionIcon, Divider } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { AbilityManager, AbilityType, LearnedAbility } from './abilities/AbilityManager'

interface AbilityManagerViewerProps {
  abilityManager: AbilityManager
  abilities: string[] // racial abilities
  hasSpellcasting: boolean
  hasCombatManeuvers: boolean
  hasFinesse: boolean
  str: number
  dex: number
  int: number
  sorcery_points: number
  max_sorcery_points: number
  combat_maneuvers: number
  max_combat_maneuvers: number
  finesse_points: number
  max_finesse_points: number
  onAbilityChange: () => void
}

const ABILITY_TYPE_LABELS: Record<AbilityType, string> = {
  'metamagic': 'Metamagic',
  'spellword': 'Spellwords', 
  'combat_maneuver': 'Combat Maneuvers'
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

export function AbilityManagerViewer({ 
  abilityManager,
  abilities,
  hasSpellcasting, 
  hasCombatManeuvers,
  hasFinesse,
  str,
  dex,
  int,
  sorcery_points,
  max_sorcery_points,
  combat_maneuvers,
  max_combat_maneuvers,
  finesse_points,
  max_finesse_points,
  onAbilityChange 
}: AbilityManagerViewerProps) {
  const [selectedType, setSelectedType] = useState<AbilityType | null>(null)
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null)
  
  // Determine which ability types are available
  const availableTypes: AbilityType[] = []
  if (hasSpellcasting) {
    availableTypes.push('metamagic', 'spellword')
  }
  if (hasCombatManeuvers) {
    availableTypes.push('combat_maneuver')
  }

  // Get learned abilities from the manager
  const learnedMetamagic = abilityManager.getAbilitiesByType('metamagic')
  const learnedSpellwords = abilityManager.getAbilitiesByType('spellword')
  const learnedManeuvers = abilityManager.getAbilitiesByType('combat_maneuver')

  // Show spellcasting if character has spellcasting capability
  const showSpellcasting = hasSpellcasting
  // Show combat maneuvers if character can use them
  const showCombatManeuvers = hasCombatManeuvers

  // Don't render if no abilities of any kind
  if (abilities.length === 0 && !showSpellcasting && !showCombatManeuvers && !hasFinesse && availableTypes.length === 0) {
    return null
  }

  const handleLearnAbility = () => {
    if (selectedType && selectedAbility) {
      const success = abilityManager.learnAbility(selectedAbility, selectedType)
      if (success) {
        setSelectedAbility(null)
        onAbilityChange()
      }
    }
  }

  const handleForgetAbility = (ability: LearnedAbility) => {
    const success = abilityManager.forgetAbility(ability.name, ability.type)
    if (success) {
      onAbilityChange()
    }
  }

  const getAvailableAbilities = (type: AbilityType): string[] => {
    return abilityManager.getAvailableAbilities(type)
  }

  const typeSelectData = availableTypes.map(type => ({
    value: type,
    label: ABILITY_TYPE_LABELS[type]
  }))

  const abilitySelectData = selectedType 
    ? getAvailableAbilities(selectedType).map(name => ({
        value: name,
        label: name
      }))
    : []

  return (
    <Paper p="md" withBorder style={{ marginTop: '16px' }}>
      <Stack gap="md">
        <Text size="lg" fw={600}>Special Abilities</Text>
        
        {/* Add New Ability Section */}
        {availableTypes.length > 0 && (
          <Paper p="sm" withBorder style={{ backgroundColor: '#2a2a2a' }}>
            <Stack gap="sm">
              <Text size="sm" fw={500}>Learn New Ability</Text>
              <Group>
                <Select
                  placeholder="Select ability type"
                  data={typeSelectData}
                  value={selectedType}
                  onChange={(value) => {
                    setSelectedType(value as AbilityType)
                    setSelectedAbility(null)
                  }}
                  style={{ flex: 1 }}
                  size="sm"
                />
                <Select
                  placeholder="Select ability"
                  data={abilitySelectData}
                  value={selectedAbility}
                  onChange={setSelectedAbility}
                  disabled={!selectedType || abilitySelectData.length === 0}
                  style={{ flex: 2 }}
                  size="sm"
                />
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleLearnAbility}
                  disabled={!selectedType || !selectedAbility}
                  size="sm"
                >
                  Learn
                </Button>
              </Group>
              {selectedType && abilitySelectData.length === 0 && (
                <Text size="xs" c="dimmed">
                  No more {ABILITY_TYPE_LABELS[selectedType].toLowerCase()} available to learn
                </Text>
              )}
            </Stack>
          </Paper>
        )}
        
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
                    <Paper key={index} p="sm" withBorder style={{ backgroundColor: '#2a2a2a' }}>
                      <Text size="sm" fw={500} style={{ color: '#ffb347' }}>{ability}</Text>
                      <Text size="xs" style={{ color: '#bbb', marginTop: '4px' }}>
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
                  <Text size="sm" style={{ color: '#bbb' }}>
                    INT {int} allows spellcasting. Combine Spellwords with Metamagic to create custom spells.
                  </Text>
                  
                  {learnedSpellwords.length > 0 ? (
                    <>
                      <Divider label="Known Spellwords" labelPosition="center" />
                      <Stack gap="xs">
                        {learnedSpellwords.map((ability) => (
                          <Paper key={ability.id} p="xs" withBorder style={{ backgroundColor: '#2a2a2a' }}>
                            <Group justify="space-between" align="flex-start">
                              <Stack gap={2} style={{ flex: 1 }}>
                                <Group gap="xs">
                                  <Text size="sm" fw={500} style={{ color: '#bb86fc' }}>{ability.name}</Text>
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
                                onClick={() => handleForgetAbility(ability)}
                                title="Forget this ability"
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Divider label="Known Spellwords" labelPosition="center" />
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        No spellwords learned yet. Use the "Learn New Ability" section above to add some!
                      </Text>
                    </>
                  )}

                  {learnedMetamagic.length > 0 ? (
                    <>
                      <Divider label="Known Metamagic" labelPosition="center" />
                      <Stack gap="xs">
                        {learnedMetamagic.map((ability) => (
                          <Paper key={ability.id} p="xs" withBorder style={{ backgroundColor: '#2a2a2a' }}>
                            <Group justify="space-between" align="flex-start">
                              <Stack gap={2} style={{ flex: 1 }}>
                                <Group gap="xs">
                                  <Text size="sm" fw={500} style={{ color: '#03dac6' }}>{ability.name}</Text>
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
                                onClick={() => handleForgetAbility(ability)}
                                title="Forget this ability"
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Divider label="Known Metamagic" labelPosition="center" />
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        No metamagic learned yet. Use the "Learn New Ability" section above to add some!
                      </Text>
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
                              onClick={() => handleForgetAbility(ability)}
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
          )}
        </Accordion>
      </Stack>
    </Paper>
  )
}