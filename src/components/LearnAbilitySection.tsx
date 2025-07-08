import { useState } from 'react'
import { Paper, Text, Stack, Button, Select, Group } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { AbilityType } from '../abilities/AbilityManager'

interface LearnAbilitySectionProps {
  availableTypes: AbilityType[]
  onLearnAbility: (type: AbilityType, ability: string) => void
  getAvailableAbilities: (type: AbilityType) => string[]
}

const ABILITY_TYPE_LABELS: Record<AbilityType, string> = {
  'metamagic': 'Metamagic',
  'spellword': 'Spellwords', 
  'combat_maneuver': 'Combat Maneuvers'
}

export function LearnAbilitySection({ availableTypes, onLearnAbility, getAvailableAbilities }: LearnAbilitySectionProps) {
  const [selectedType, setSelectedType] = useState<AbilityType | null>(null)
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null)

  const handleLearnAbility = () => {
    if (selectedType && selectedAbility) {
      onLearnAbility(selectedType, selectedAbility)
      setSelectedAbility(null)
    }
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

  if (availableTypes.length === 0) {
    return null
  }

  return (
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
  )
}