import { Paper, Text, Stack, Accordion, Badge, Group, Divider } from '@mantine/core'
import { METAMAGIC, SPELLWORDS, COMBAT_MANEUVERS, MIN_SPELLCASTING_INT } from '../constants'

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
}

// Ability descriptions for better user understanding
const RACIAL_DESCRIPTIONS: { [key: string]: string } = {
  "Treewalk": "Move through trees and foliage without penalty, gain advantage on stealth in natural environments",
  "Tinker": "Can repair and modify mechanical devices, create small magical trinkets",
  "Contract": "Can form binding magical agreements with other creatures",
  "Stonesense": "Detect structural weaknesses, secret doors, and traps in stone and earth",
  "Flametongue": "Breathe fire in a cone, dealing fire damage to enemies",
  "Lucky": "Reroll natural 1s on attack rolls, ability checks, and saving throws"
}

const METAMAGIC_DESCRIPTIONS: { [key: string]: string } = {
  "Aura": "Affect all targets within range simultaneously",
  "Cascade": "Spell bounces to additional targets after initial cast",
  "Cloak": "Make spell invisible/undetectable to observers",
  "Distant": "Double the range of the spell",
  "Empowered": "Increase spell damage or effect potency",
  "Glyph": "Place spell as a trap that triggers later",
  "Grasp": "Extend spell duration significantly",
  "Heighten": "Cast spell as if from a higher level",
  "Hypnotic": "Add charm/mesmerizing effect to any spell",
  "Orb": "Shape spell into a floating orb that follows commands",
  "Orbit": "Create multiple smaller versions that circle the target",
  "Precise": "Spell automatically hits or has enhanced accuracy",
  "Quick": "Cast spell as a bonus action instead of full action",
  "Sculpt": "Exclude chosen targets from area effects",
  "Subtle": "Cast without verbal or somatic components",
  "Twin": "Target two creatures with a single-target spell",
  "Wall": "Create a barrier version of any spell effect"
}

const SPELLWORD_DESCRIPTIONS: { [key: string]: string } = {
  "Chill": "Freeze or slow targets, create ice effects",
  "Confound": "Confuse enemies, scramble thoughts or senses",
  "Counterspell": "Cancel or redirect enemy magic",
  "Deafen": "Remove hearing, create zones of silence",
  "Flametongue": "Create and control fire effects",
  "Growth": "Increase size of objects or creatures",
  "Heat": "Create warmth, melt ice, cause fever",
  "Illusion": "Create false images or sounds",
  "Light": "Illuminate areas, create blinding flashes",
  "Mend": "Repair objects, heal minor wounds",
  "Push/Pull": "Move objects or creatures with force",
  "Rain": "Control weather, create water effects",
  "Reflect": "Bounce attacks or spells back at attackers",
  "Shadow": "Manipulate darkness and shadows",
  "Shield": "Create protective barriers",
  "Soothe": "Calm emotions, reduce pain or fear",
  "Spark": "Create electricity, power devices",
  "Thread": "Bind or connect objects and creatures",
  "Vision": "See distant places, reveal hidden things"
}

const MANEUVER_DESCRIPTIONS: { [key: string]: string } = {
  "Blinding": "Strike to temporarily blind opponent",
  "Cleave": "Hit multiple adjacent enemies with one attack",
  "Command": "Force enemy to follow a simple command",
  "Daring": "Gain advantage through risky maneuvers",
  "Disarming": "Remove weapon from enemy's grasp",
  "Enraged": "Enter fury state for increased damage",
  "Goading": "Force enemy to attack you instead of allies",
  "Grappling": "Grab and restrain an opponent",
  "Leaping": "Jump attack for extra damage and mobility",
  "Menace": "Intimidate enemies to reduce their effectiveness",
  "Precision": "Target weak points for extra damage",
  "Preparation": "Set up advantageous position for next attack",
  "Reckless": "All-out attack with increased risk and reward",
  "Riposte": "Counter-attack after successful defense",
  "Stampede": "Charge through multiple enemies",
  "Throw": "Hurl objects or enemies as weapons",
  "Trip": "Knock opponent prone"
}

export function AbilityViewer({ 
  abilities, 
  str, 
  dex, 
  int, 
  level, 
  sorcery_points,
  max_sorcery_points,
  combat_maneuvers,
  max_combat_maneuvers, 
  finesse_points,
  max_finesse_points
}: AbilityViewerProps) {
  const hasSpellcasting = int >= MIN_SPELLCASTING_INT && max_sorcery_points > 0
  const hasCombatManeuvers = max_combat_maneuvers > 0
  const hasFinesse = max_finesse_points > 0

  // Don't render if no abilities of any kind
  if (abilities.length === 0 && !hasSpellcasting && !hasCombatManeuvers && !hasFinesse) {
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
          {hasSpellcasting && (
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
                  
                  <Divider label="Spellwords" labelPosition="center" />
                  <Stack gap="xs">
                    {SPELLWORDS.map((spell, index) => (
                      <Paper key={index} p="xs" withBorder style={{ backgroundColor: '#2a2a2a' }}>
                        <Group justify="space-between">
                          <Text size="sm" fw={500} style={{ color: '#bb86fc' }}>{spell}</Text>
                        </Group>
                        <Text size="xs" style={{ color: '#bbb', marginTop: '2px' }}>
                          {SPELLWORD_DESCRIPTIONS[spell]}
                        </Text>
                      </Paper>
                    ))}
                  </Stack>

                  <Divider label="Metamagic" labelPosition="center" />
                  <Stack gap="xs">
                    {METAMAGIC.map((meta, index) => (
                      <Paper key={index} p="xs" withBorder style={{ backgroundColor: '#2a2a2a' }}>
                        <Group justify="space-between">
                          <Text size="sm" fw={500} style={{ color: '#03dac6' }}>{meta}</Text>
                        </Group>
                        <Text size="xs" style={{ color: '#bbb', marginTop: '2px' }}>
                          {METAMAGIC_DESCRIPTIONS[meta]}
                        </Text>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          )}

          {/* Combat Maneuvers */}
          {hasCombatManeuvers && (
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
                  <Stack gap="xs">
                    {COMBAT_MANEUVERS.map((maneuver, index) => (
                      <Paper key={index} p="xs" withBorder style={{ backgroundColor: '#2a2a2a' }}>
                        <Text size="sm" fw={500} style={{ color: '#ff6b6b' }}>{maneuver}</Text>
                        <Text size="xs" style={{ color: '#bbb', marginTop: '2px' }}>
                          {MANEUVER_DESCRIPTIONS[maneuver]}
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