import { Paper, Text, Stack, Group, Badge, Accordion, Divider, ActionIcon } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { LearnedAbility } from '../abilities/AbilityManager'

interface SpellcastingSectionProps {
  int: number
  sorcery_points: number
  max_sorcery_points: number
  learnedSpellwords: LearnedAbility[]
  learnedMetamagic: LearnedAbility[]
  onForgetAbility: (ability: LearnedAbility) => void
}

export function SpellcastingSection({ 
  int, 
  sorcery_points, 
  max_sorcery_points, 
  learnedSpellwords, 
  learnedMetamagic, 
  onForgetAbility 
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