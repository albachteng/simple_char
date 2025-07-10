import { Paper, Text, Stack, Group, Badge, Accordion, Divider, ActionIcon, Button } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { LearnedAbility } from '../abilities/AbilityManager'
import { COLORS, STYLES } from '../theme/constants'

interface SpellcastingSectionProps {
  int: number
  sorcery_points: number
  max_sorcery_points: number
  learnedSpellwords: LearnedAbility[]
  learnedMetamagic: LearnedAbility[]
  onForgetAbility: (ability: LearnedAbility) => void
  spendSorceryPoint?: () => boolean
}

export function SpellcastingSection({ 
  int, 
  sorcery_points, 
  max_sorcery_points, 
  learnedSpellwords, 
  learnedMetamagic, 
  onForgetAbility,
  spendSorceryPoint
}: SpellcastingSectionProps) {
  return (
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
          
          {spendSorceryPoint && (
            <Group justify="center">
              <Button 
                size="sm" 
                variant="outline" 
                color="purple"
                onClick={() => spendSorceryPoint()}
                disabled={sorcery_points <= 0}
              >
                Cast a Spell (Spend 1 Sorcery Point)
              </Button>
            </Group>
          )}
          
          {learnedSpellwords.length > 0 ? (
            <>
              <Divider label="Known Spellwords" labelPosition="center" />
              <Stack gap="xs">
                {learnedSpellwords.map((ability) => (
                  <Paper key={ability.id} p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Text size="sm" fw={500} style={{ color: COLORS.SPELLWORD_ABILITY }}>{ability.name}</Text>
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
                  <Paper key={ability.id} p="xs" withBorder style={STYLES.CARD_BACKGROUND}>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Text size="sm" fw={500} style={{ color: COLORS.METAMAGIC_ABILITY }}>{ability.name}</Text>
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
  )
}