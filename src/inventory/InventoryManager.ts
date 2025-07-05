import type { InventoryItem, CharacterInventory, ItemType } from '../../types'
import { logger } from '../logger'

export class InventoryManager {
  private inventory: CharacterInventory

  constructor(initialInventory: CharacterInventory = { items: [] }) {
    this.inventory = initialInventory
    logger.equipment('InventoryManager initialized', { itemCount: this.inventory.items.length })
  }

  // Get all items
  getItems(): InventoryItem[] {
    return [...this.inventory.items]
  }

  // Get items by type
  getItemsByType(type: ItemType): InventoryItem[] {
    return this.inventory.items.filter(item => item.type === type)
  }

  // Get equipped items
  getEquippedItems(): InventoryItem[] {
    return this.inventory.items.filter(item => item.equipped)
  }

  // Get equipped item by type (weapons/armor/shield)
  getEquippedItemByType(type: ItemType): InventoryItem | null {
    const equipped = this.inventory.items.find(item => item.type === type && item.equipped)
    return equipped || null
  }

  // Add item to inventory
  addItem(item: InventoryItem): boolean {
    // Check if inventory is full (if maxItems is set)
    if (this.inventory.maxItems && this.inventory.items.length >= this.inventory.maxItems) {
      logger.equipment('Cannot add item: inventory full', { 
        currentItems: this.inventory.items.length,
        maxItems: this.inventory.maxItems 
      })
      return false
    }

    // Check if item already exists (prevent duplicates by ID)
    if (this.inventory.items.some(existingItem => existingItem.id === item.id)) {
      logger.equipment('Cannot add item: already exists', { itemId: item.id, itemName: item.name })
      return false
    }

    this.inventory.items.push(item)
    logger.equipment('Item added to inventory', { 
      itemName: item.name, 
      itemType: item.type,
      totalItems: this.inventory.items.length 
    })
    return true
  }

  // Remove item from inventory
  removeItem(itemId: string): boolean {
    const itemIndex = this.inventory.items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) {
      logger.equipment('Cannot remove item: not found', { itemId })
      return false
    }

    const removedItem = this.inventory.items.splice(itemIndex, 1)[0]
    logger.equipment('Item removed from inventory', { 
      itemName: removedItem.name,
      wasEquipped: removedItem.equipped,
      totalItems: this.inventory.items.length 
    })
    return true
  }

  // Equip an item
  equipItem(itemId: string): boolean {
    const item = this.inventory.items.find(item => item.id === itemId)
    if (!item) {
      logger.equipment('Cannot equip item: not found', { itemId })
      return false
    }

    // Unequip other items of the same type (can only have one weapon, one armor, one shield equipped)
    if (item.type === 'weapon' || item.type === 'armor' || item.type === 'shield') {
      this.inventory.items.forEach(existingItem => {
        if (existingItem.type === item.type && existingItem.equipped) {
          existingItem.equipped = false
          logger.equipment('Unequipped existing item', { 
            itemName: existingItem.name,
            itemType: existingItem.type 
          })
        }
      })
    }

    item.equipped = true
    logger.equipment('Item equipped', { 
      itemName: item.name,
      itemType: item.type,
      enchantmentLevel: item.enchantmentLevel 
    })
    return true
  }

  // Unequip an item
  unequipItem(itemId: string): boolean {
    const item = this.inventory.items.find(item => item.id === itemId)
    if (!item) {
      logger.equipment('Cannot unequip item: not found', { itemId })
      return false
    }

    if (!item.equipped) {
      logger.equipment('Item already unequipped', { itemName: item.name })
      return false
    }

    item.equipped = false
    logger.equipment('Item unequipped', { 
      itemName: item.name,
      itemType: item.type 
    })
    return true
  }

  // Get current inventory state
  getInventory(): CharacterInventory {
    return {
      items: [...this.inventory.items],
      maxItems: this.inventory.maxItems
    }
  }

  // Set entire inventory (for loading saved characters)
  setInventory(inventory: CharacterInventory): void {
    this.inventory = {
      items: [...inventory.items],
      maxItems: inventory.maxItems
    }
    logger.equipment('Inventory loaded', { 
      itemCount: this.inventory.items.length,
      equippedCount: this.inventory.items.filter(item => item.equipped).length 
    })
  }

  // Get inventory summary for logging/debugging
  getInventorySummary(): { total: number, equipped: number, byType: Record<ItemType, number> } {
    const byType: Record<ItemType, number> = {
      weapon: 0,
      armor: 0,
      shield: 0,
      accessory: 0
    }

    this.inventory.items.forEach(item => {
      byType[item.type]++
    })

    return {
      total: this.inventory.items.length,
      equipped: this.inventory.items.filter(item => item.equipped).length,
      byType
    }
  }
}