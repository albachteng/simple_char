import { Paper, Text, Stack, Group, Button, Badge } from '@mantine/core'
import type { InventoryItem } from '../../types'
import { InventoryManager } from '../inventory/InventoryManager'
import { EnchantmentControls } from '../EnchantmentControls'

interface InventoryItemProps {
  item: InventoryItem
  onEquip: (itemId: string) => void
  onUnequip: (itemId: string) => void
  onRemove: (itemId: string) => void
  inventoryManager: InventoryManager
  onInventoryChange?: () => void
}

export function InventoryItemComponent({ item, onEquip, onUnequip, onRemove, inventoryManager, onInventoryChange }: InventoryItemProps) {
  // Get weapon slot information for display
  const getWeaponSlotInfo = () => {
    if (item.type !== 'weapon' || !item.equipped) return null
    
    const equippedWeapons = inventoryManager.getEquippedWeapons()
    if (equippedWeapons.mainHand?.id === item.id) return 'main-hand'
    if (equippedWeapons.offHand?.id === item.id) return 'off-hand'
    return null
  }
  
  const weaponSlot = getWeaponSlotInfo()
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
                <Badge size="xs" color="yellow">
                  {weaponSlot ? `Equipped (${weaponSlot})` : 'Equipped'}
                </Badge>
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
            
            <EnchantmentControls
              item={item}
              inventoryManager={inventoryManager}
              onEnchantmentChange={onInventoryChange}
            />
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