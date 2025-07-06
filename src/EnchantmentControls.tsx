import { useState } from 'react'
import { Group, Button, Text, Badge, Modal, Stack } from '@mantine/core'
import type { InventoryItem } from '../types'
import { InventoryManager } from './inventory/InventoryManager'

interface EnchantmentControlsProps {
  item: InventoryItem
  inventoryManager: InventoryManager
  onEnchantmentChange?: () => void
}

export function EnchantmentControls({ item, inventoryManager, onEnchantmentChange }: EnchantmentControlsProps) {
  const [showModal, setShowModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentLevel = item.enchantmentLevel || 0

  const handleEnchantmentChange = (change: number) => {
    const result = inventoryManager.modifyEnchantment(item.id, change)
    if (result.success) {
      setErrorMessage(null)
      onEnchantmentChange?.()
    } else {
      setErrorMessage(result.errorMessage || 'Unknown error')
    }
  }

  const getEnchantmentDisplay = (level: number) => {
    if (level > 0) return `+${level}`
    if (level < 0) return `${level}` // negative sign is already included
    return '0'
  }

  const getEnchantmentColor = (level: number) => {
    if (level > 0) return 'blue'
    if (level < 0) return 'red'
    return 'gray'
  }

  const getEnchantmentDescription = (level: number) => {
    if (level === 0) return 'No enchantment'
    if (level > 0) {
      const benefits = []
      if (item.type === 'weapon') {
        benefits.push(`+${level} to attack and damage rolls`)
      }
      if (item.type === 'armor' || item.type === 'shield') {
        benefits.push(`+${level} to AC`)
      }
      return benefits.join(', ')
    } else {
      const penalties = []
      if (item.type === 'weapon') {
        penalties.push(`${level} to attack and damage rolls`)
      }
      if (item.type === 'armor' || item.type === 'shield') {
        penalties.push(`${level} to AC`)
      }
      return `Cursed: ${penalties.join(', ')}`
    }
  }

  return (
    <>
      <Group gap="xs" align="center">
        <Text size="sm" fw={500}>Enchantment:</Text>
        <Badge
          size="sm"
          color={getEnchantmentColor(currentLevel)}
          style={{ cursor: 'pointer' }}
          onClick={() => setShowModal(true)}
        >
          {getEnchantmentDisplay(currentLevel)}
        </Badge>
        <Button
          size="xs"
          variant="outline"
          onClick={() => setShowModal(true)}
        >
          Modify
        </Button>
      </Group>

      <Modal 
        opened={showModal} 
        onClose={() => {
          setShowModal(false)
          setErrorMessage(null)
        }} 
        title={`Enchant ${item.name}`}
        size="md"
      >
        <Stack gap="md">
          <Group justify="center" align="center">
            <Text fw={600}>Current Level:</Text>
            <Badge size="lg" color={getEnchantmentColor(currentLevel)}>
              {getEnchantmentDisplay(currentLevel)}
            </Badge>
          </Group>

          <Text size="sm" c="dimmed" ta="center">
            {getEnchantmentDescription(currentLevel)}
          </Text>

          {errorMessage && (
            <Text size="sm" c="red" ta="center">
              {errorMessage}
            </Text>
          )}

          <Group justify="center" gap="xs">
            <Button
              variant="outline"
              color="red"
              onClick={() => handleEnchantmentChange(-1)}
              disabled={currentLevel <= -3}
            >
              -1 (Curse)
            </Button>
            <Button
              variant="outline"
              color="gray"
              onClick={() => inventoryManager.setEnchantment(item.id, 0)}
              disabled={currentLevel === 0}
            >
              Reset to 0
            </Button>
            <Button
              variant="outline"
              color="blue"
              onClick={() => handleEnchantmentChange(1)}
              disabled={currentLevel >= 3}
            >
              +1 (Enchant)
            </Button>
          </Group>

          <Stack gap="xs" style={{ marginTop: '16px' }}>
            <Text size="sm" fw={600}>Enchantment Effects:</Text>
            <Text size="xs" c="dimmed">
              • <strong>Weapons:</strong> Each +1 adds +1 to attack rolls and damage rolls (both main-hand and off-hand)
            </Text>
            <Text size="xs" c="dimmed">
              • <strong>Armor/Shields:</strong> Each +1 adds +1 to AC
            </Text>
            <Text size="xs" c="dimmed">
              • <strong>Cursed items:</strong> Negative levels impose penalties instead of bonuses
            </Text>
            <Text size="xs" c="dimmed">
              • <strong>Range:</strong> -3 (maximum curse) to +3 (maximum enchantment)
            </Text>
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}