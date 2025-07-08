import { useState } from 'react'
import { Paper, Text, Stack, Group, Button, Badge, Modal, ScrollArea } from '@mantine/core'
import type { InventoryItem, ItemType } from '../../types'
import { BASE_ITEMS, createInventoryItem } from '../inventory/InventoryConstants'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAddItem: (item: InventoryItem) => void
}

export function AddItemModal({ isOpen, onClose, onAddItem }: AddItemModalProps) {
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all')

  const filteredItems = selectedType === 'all' 
    ? BASE_ITEMS 
    : BASE_ITEMS.filter(item => item.type === selectedType)

  const handleAddItem = (baseItem: typeof BASE_ITEMS[0]) => {
    const newItem = createInventoryItem(baseItem)
    onAddItem(newItem)
    onClose()
  }

  return (
    <Modal opened={isOpen} onClose={onClose} title="Add Item to Inventory" size="lg">
      <Stack gap="md">
        <Group gap="xs">
          <Button 
            variant={selectedType === 'all' ? 'filled' : 'outline'}
            size="xs"
            onClick={() => setSelectedType('all')}
          >
            All
          </Button>
          <Button 
            variant={selectedType === 'weapon' ? 'filled' : 'outline'}
            size="xs"
            onClick={() => setSelectedType('weapon')}
          >
            Weapons
          </Button>
          <Button 
            variant={selectedType === 'armor' ? 'filled' : 'outline'}
            size="xs"
            onClick={() => setSelectedType('armor')}
          >
            Armor
          </Button>
          <Button 
            variant={selectedType === 'shield' ? 'filled' : 'outline'}
            size="xs"
            onClick={() => setSelectedType('shield')}
          >
            Shields
          </Button>
        </Group>

        <ScrollArea h={400}>
          <Stack gap="xs">
            {filteredItems.map((item, index) => (
              <Paper key={index} p="sm" withBorder>
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group gap="xs">
                      <Text fw={600}>{item.name}</Text>
                      <Badge size="xs" color={
                        item.type === 'weapon' ? 'red' :
                        item.type === 'armor' ? 'blue' :
                        item.type === 'shield' ? 'green' : 'gray'
                      }>
                        {item.type}
                      </Badge>
                    </Group>
                    {item.description && (
                      <Text size="sm" c="dimmed">{item.description}</Text>
                    )}
                  </Stack>
                  <Button size="xs" onClick={() => handleAddItem(item)}>
                    Add
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>
    </Modal>
  )
}