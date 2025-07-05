import { useState } from 'react'
import { Paper, Text, Stack, Group, Button, Badge, Modal, ScrollArea } from '@mantine/core'
import type { InventoryItem, ItemType } from '../types'
import { InventoryManager } from './inventory/InventoryManager'
import { BASE_ITEMS, createInventoryItem } from './inventory/InventoryConstants'

interface InventoryViewerProps {
  inventoryManager: InventoryManager
  onInventoryChange?: () => void
}

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAddItem: (item: InventoryItem) => void
}

function AddItemModal({ isOpen, onClose, onAddItem }: AddItemModalProps) {
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

interface InventoryItemProps {
  item: InventoryItem
  onEquip: (itemId: string) => void
  onUnequip: (itemId: string) => void
  onRemove: (itemId: string) => void
}

function InventoryItemComponent({ item, onEquip, onUnequip, onRemove }: InventoryItemProps) {
  return (
    <Paper p="sm" withBorder>
      <Stack gap="xs">
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
              {item.equipped && (
                <Badge size="xs" color="yellow">Equipped</Badge>
              )}
              {item.enchantmentLevel > 0 && (
                <Badge size="xs" color="purple">+{item.enchantmentLevel}</Badge>
              )}
            </Group>
            {item.description && (
              <Text size="sm" c="dimmed">{item.description}</Text>
            )}
            {item.statBonuses && item.statBonuses.length > 0 && (
              <Group gap="xs">
                <Text size="sm" fw={500}>Bonuses:</Text>
                {item.statBonuses.map((bonus, index) => (
                  <Badge key={index} size="xs" variant="outline">
                    +{bonus.bonus} {bonus.stat.toUpperCase()}
                  </Badge>
                ))}
              </Group>
            )}
            {item.abilities && item.abilities.length > 0 && (
              <Group gap="xs">
                <Text size="sm" fw={500}>Abilities:</Text>
                {item.abilities.map((ability, index) => (
                  <Badge key={index} size="xs" variant="outline" color="cyan">
                    {ability}
                  </Badge>
                ))}
              </Group>
            )}
          </Stack>
          <Stack gap="xs">
            {item.equipped ? (
              <Button size="xs" variant="outline" onClick={() => onUnequip(item.id)}>
                Unequip
              </Button>
            ) : (
              <Button size="xs" onClick={() => onEquip(item.id)}>
                Equip
              </Button>
            )}
            <Button size="xs" color="red" variant="outline" onClick={() => onRemove(item.id)}>
              Remove
            </Button>
          </Stack>
        </Group>
      </Stack>
    </Paper>
  )
}

export function InventoryViewer({ inventoryManager, onInventoryChange }: InventoryViewerProps) {
  const [items, setItems] = useState<InventoryItem[]>(inventoryManager.getItems())
  const [showAddModal, setShowAddModal] = useState(false)

  const refreshItems = () => {
    setItems(inventoryManager.getItems())
    onInventoryChange?.()
  }

  const handleEquip = (itemId: string) => {
    inventoryManager.equipItem(itemId)
    refreshItems()
  }

  const handleUnequip = (itemId: string) => {
    inventoryManager.unequipItem(itemId)
    refreshItems()
  }

  const handleRemove = (itemId: string) => {
    inventoryManager.removeItem(itemId)
    refreshItems()
  }

  const handleAddItem = (item: InventoryItem) => {
    inventoryManager.addItem(item)
    refreshItems()
  }

  const equippedItems = items.filter(item => item.equipped)
  const unequippedItems = items.filter(item => !item.equipped)

  return (
    <>
      <Paper p="md" withBorder style={{ marginTop: '16px' }}>
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="lg" fw={600}>Inventory</Text>
            <Button onClick={() => setShowAddModal(true)}>Add Item</Button>
          </Group>

          {equippedItems.length > 0 && (
            <Stack gap="sm">
              <Text size="md" fw={500}>Equipped</Text>
              {equippedItems.map(item => (
                <InventoryItemComponent
                  key={item.id}
                  item={item}
                  onEquip={handleEquip}
                  onUnequip={handleUnequip}
                  onRemove={handleRemove}
                />
              ))}
            </Stack>
          )}

          {unequippedItems.length > 0 && (
            <Stack gap="sm">
              <Text size="md" fw={500}>Items ({unequippedItems.length})</Text>
              <ScrollArea h={300}>
                <Stack gap="sm">
                  {unequippedItems.map(item => (
                    <InventoryItemComponent
                      key={item.id}
                      item={item}
                      onEquip={handleEquip}
                      onUnequip={handleUnequip}
                      onRemove={handleRemove}
                    />
                  ))}
                </Stack>
              </ScrollArea>
            </Stack>
          )}

          {items.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              No items in inventory. Click "Add Item" to get started.
            </Text>
          )}
        </Stack>
      </Paper>

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddItem={handleAddItem}
      />
    </>
  )
}