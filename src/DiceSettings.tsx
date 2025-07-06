import { useState } from 'react'
import { Paper, Text, Switch, Group, Collapse, Button } from '@mantine/core'
import { DiceSettings } from './utils/dice'

interface DiceSettingsProps {
  onSettingsChange?: () => void
}

export function DiceSettingsPanel({ onSettingsChange }: DiceSettingsProps) {
  const [useDiceRolls, setUseDiceRolls] = useState(DiceSettings.getUseDiceRolls())
  const [showSettings, setShowSettings] = useState(false)

  const handleDiceToggle = (enabled: boolean) => {
    setUseDiceRolls(enabled)
    DiceSettings.setUseDiceRolls(enabled)
    onSettingsChange?.()
  }

  return (
    <Paper p="md" withBorder style={{ marginTop: '16px' }}>
      <Group justify="space-between">
        <Text size="lg" fw={600}>Settings</Text>
        <Button 
          variant="outline" 
          size="xs" 
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? 'Hide' : 'Show'} Settings
        </Button>
      </Group>

      <Collapse in={showSettings}>
        <div style={{ marginTop: '16px' }}>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={500}>Dice Rolling</Text>
              <Text size="sm" c="dimmed">
                {useDiceRolls 
                  ? 'Uses random dice rolls for combat and HP' 
                  : 'Uses average values for predictable results'
                }
              </Text>
            </div>
            <Switch
              checked={useDiceRolls}
              onChange={(event) => handleDiceToggle(event.currentTarget.checked)}
              label={useDiceRolls ? 'Random' : 'Average'}
            />
          </Group>
        </div>
      </Collapse>
    </Paper>
  )
}