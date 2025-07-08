import { useState, useEffect } from 'react'
import { Paper, Text, Stack, Group, Button, Alert, ScrollArea } from '@mantine/core'
import type { InventoryItem } from '../types'
import { InventoryManager } from './inventory/InventoryManager'
import { AddItemModal } from './components/AddItemModal'
import { InventoryItemComponent } from './components/InventoryItemComponent'

interface InventoryViewerProps {
  inventoryManager: InventoryManager
  onInventoryChange?: () => void
}


export function InventoryViewer({ inventoryManager, onInventoryChange }: InventoryViewerProps) {
  const [items, setItems] = useState<InventoryItem[]>(inventoryManager.getItems())
  const [showAddModal, setShowAddModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Refresh items when inventoryManager changes (e.g., on character reset)
  useEffect(() => {
    setItems(inventoryManager.getItems())
    setErrorMessage(null) // Clear any error messages when inventory resets
  }, [inventoryManager])

  const refreshItems = () => {
    setItems(inventoryManager.getItems())
    onInventoryChange?.()
  }

  const handleEquip = (itemId: string) => {
    const result = inventoryManager.equipItem(itemId)
    if (result.success) {
      setErrorMessage(null)
      refreshItems()
    } else {
      setErrorMessage(result.errorMessage || 'Cannot equip item')
    }
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

          {errorMessage && (
            <Alert color="red" onClose={() => setErrorMessage(null)} withCloseButton>
              {errorMessage}
            </Alert>
          )}

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
                  inventoryManager={inventoryManager}
                  onInventoryChange={refreshItems}
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
                      inventoryManager={inventoryManager}
                      onInventoryChange={refreshItems}
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