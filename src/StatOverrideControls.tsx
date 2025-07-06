import { useState } from 'react'
import { Button, Group, Text, Box, Stack } from '@mantine/core'
import type { Stat } from '../types'
import { CustomNumberInput } from './components/CustomNumberInput'

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
    const numValue = typeof value === 'string' ? parseInt(value, 10) || 0 : value
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
            Stat modifier mode enabled - add/subtract from base stats
          </Text>
        )}
      </Group>

      {isUsingOverrides && (
        <Stack style={{display: 'flex', flexDirection: 'row'}}gap="xs" mb="md">
          <Group>
            <Text w={80} size="sm">STR Modifier:</Text>
            <CustomNumberInput
              value={pendingValues.str}
              onChange={(value) => handleValueChange('str', value)}
              min={-originalStr}
              max={30 - originalStr}
              size="sm"
              w={80}
              allowNegative={true}
            />
            <Text size="sm" c="dimmed">
              (Base: {originalStr} → {originalStr + pendingValues.str})
            </Text>
          </Group>

          <Group>
            <Text w={80} size="sm">DEX Modifier:</Text>
            <CustomNumberInput
              value={pendingValues.dex}
              onChange={(value) => handleValueChange('dex', value)}
              min={-originalDex}
              max={30 - originalDex}
              size="sm"
              w={80}
              allowNegative={true}
            />
            <Text size="sm" c="dimmed">
              (Base: {originalDex} → {originalDex + pendingValues.dex})
            </Text>
          </Group>

          <Group>
            <Text w={80} size="sm">INT Modifier:</Text>
            <CustomNumberInput
              value={pendingValues.int}
              onChange={(value) => handleValueChange('int', value)}
              min={-originalInt}
              max={30 - originalInt}
              size="sm"
              w={80}
              allowNegative={true}
            />
            <Text size="sm" c="dimmed">
              (Base: {originalInt} → {originalInt + pendingValues.int})
            </Text>
          </Group>
        </Stack>
      )}
    </Box>
  )
}
