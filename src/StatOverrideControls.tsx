import { useState } from 'react'
import { Button, Group, NumberInput, Text, Box, Stack } from '@mantine/core'
import type { Stat } from '../types'

interface StatOverrideControlsProps {
  isUsingOverrides: boolean
  originalStr: number
  originalDex: number
  originalInt: number
  onToggleOverrides: () => void
  onSetStatOverride: (stat: Stat, value: number) => void
  getStatOverride: (stat: Stat) => number
}

export function StatOverrideControls({
  isUsingOverrides,
  originalStr,
  originalDex,
  originalInt,
  onToggleOverrides,
  onSetStatOverride,
  getStatOverride
}: StatOverrideControlsProps) {
  const [pendingValues, setPendingValues] = useState({
    str: getStatOverride('str'),
    dex: getStatOverride('dex'),
    int: getStatOverride('int')
  })

  const handleValueChange = (stat: Stat, value: number | string) => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) || 1 : value
    setPendingValues(prev => ({ ...prev, [stat]: numValue }))
    onSetStatOverride(stat, numValue)
  }


  return (
    <Box>
      <Group mb="md">
        <Button 
          onClick={onToggleOverrides}
          variant={isUsingOverrides ? "filled" : "outline"}
          size="sm"
        >
          {isUsingOverrides ? "Disable" : "Enable"} Stat Overrides
        </Button>
        {isUsingOverrides && (
          <Text size="sm" c="dimmed">
            Override mode enabled - showing modified stats
          </Text>
        )}
      </Group>

      {isUsingOverrides && (
        <Stack gap="xs" mb="md">
          <Group>
            <Text w={80} size="sm">STR Override:</Text>
            <NumberInput
              value={pendingValues.str}
              onChange={(value) => handleValueChange('str', value)}
              min={1}
              max={30}
              size="sm"
              w={80}
            />
            <Text size="sm" c="dimmed">
              (Original: {originalStr})
            </Text>
          </Group>

          <Group>
            <Text w={80} size="sm">DEX Override:</Text>
            <NumberInput
              value={pendingValues.dex}
              onChange={(value) => handleValueChange('dex', value)}
              min={1}
              max={30}
              size="sm"
              w={80}
            />
            <Text size="sm" c="dimmed">
              (Original: {originalDex})
            </Text>
          </Group>

          <Group>
            <Text w={80} size="sm">INT Override:</Text>
            <NumberInput
              value={pendingValues.int}
              onChange={(value) => handleValueChange('int', value)}
              min={1}
              max={30}
              size="sm"
              w={80}
            />
            <Text size="sm" c="dimmed">
              (Original: {originalInt})
            </Text>
          </Group>
        </Stack>
      )}
    </Box>
  )
}