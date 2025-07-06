import type { InventoryItem, CharacterInventory, ItemType, Armor, EquipmentSlot, EnchantmentLevel } from '../../types'
import { logger } from '../logger'
import { ARMOR_STR_REQ } from '../../constants'

export class InventoryManager {
  private inventory: CharacterInventory
  private characterStats: { str: number, dex: number, int: number } | null = null

  constructor(initialInventory: CharacterInventory = { items: [] }) {
    this.inventory = initialInventory
    logger.equipment('InventoryManager initialized', { itemCount: this.inventory.items.length })
  }

  // Set character stats for equipment validation
  setCharacterStats(stats: { str: number, dex: number, int: number }): void {
    this.characterStats = stats
  }

  // Helper function to check if a weapon is two-handed
  private isTwoHandedWeapon(weapon: InventoryItem): boolean {
    return weapon?.weaponType === 'two-hand' || 
           weapon?.weaponType === 'ranged'
  }

  // Validate if character can equip an item
  canEquipItem(item: InventoryItem): { canEquip: boolean, reason?: string } {
    if (!this.characterStats) {
      return { canEquip: true } // If no stats provided, allow equipping
    }

    // Check armor strength requirements
    if (item.type === 'armor' && item.armorType) {
      const requiredStr = ARMOR_STR_REQ[item.armorType as Armor]
      if (this.characterStats.str < requiredStr) {
        return { 
          canEquip: false, 
          reason: `Requires ${requiredStr} STR (you have ${this.characterStats.str})` 
        }
      }
    }

    // Check weapon and shield conflicts for two-handed weapons
    if (item.type === 'weapon' && this.isTwoHandedWeapon(item)) {
      const equippedShield = this.getEquippedItemBySlot('shield')
      const { mainHand, offHand } = this.getEquippedWeapons()
      
      if (equippedShield) {
        return {
          canEquip: false,
          reason: `Cannot equip two-handed weapon while using a shield. Unequip the shield first.`
        }
      }
      
      if (mainHand && offHand) {
        return {
          canEquip: false,
          reason: `Cannot equip two-handed weapon while dual-wielding. Unequip one weapon first.`
        }
      }
    }

    // Check shield conflicts with two-handed weapons
    if (item.type === 'shield') {
      const { mainHand, offHand } = this.getEquippedWeapons()
      
      if ((mainHand && this.isTwoHandedWeapon(mainHand)) || (offHand && this.isTwoHandedWeapon(offHand))) {
        return {
          canEquip: false,
          reason: `Cannot equip shield while wielding a two-handed weapon. Unequip the weapon first.`
        }
      }
    }

    return { canEquip: true }
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

  // Get equipped item by type (weapons/armor/shield) - for backward compatibility
  getEquippedItemByType(type: ItemType): InventoryItem | null {
    const equipped = this.inventory.items.find(item => item.type === type && item.equipped)
    return equipped || null
  }

  // Get equipped item by specific slot
  getEquippedItemBySlot(slot: EquipmentSlot): InventoryItem | null {
    const equipped = this.inventory.items.find(item => item.equipped && item.equipmentSlot === slot)
    return equipped || null
  }

  // Get all equipped weapons (main-hand and off-hand)
  getEquippedWeapons(): { mainHand: InventoryItem | null, offHand: InventoryItem | null } {
    return {
      mainHand: this.getEquippedItemBySlot('main-hand'),
      offHand: this.getEquippedItemBySlot('off-hand')
    }
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
  equipItem(itemId: string): { success: boolean, errorMessage?: string } {
    const item = this.inventory.items.find(item => item.id === itemId)
    if (!item) {
      logger.equipment('Cannot equip item: not found', { itemId })
      return { success: false, errorMessage: 'Item not found' }
    }

    // Validate equipment requirements
    const validation = this.canEquipItem(item)
    if (!validation.canEquip) {
      logger.equipment('Cannot equip item: requirements not met', { 
        itemName: item.name,
        reason: validation.reason 
      })
      return { success: false, errorMessage: validation.reason }
    }

    // Determine which slot to equip the item to and handle conflicts
    let targetSlot: EquipmentSlot
    
    if (item.type === 'weapon') {
      if (this.isTwoHandedWeapon(item)) {
        // Two-handed weapons go to main-hand and unequip both hands
        targetSlot = 'main-hand'
        const { mainHand, offHand } = this.getEquippedWeapons()
        if (mainHand) {
          mainHand.equipped = false
          mainHand.equipmentSlot = undefined
          logger.equipment('Unequipped main-hand weapon for two-handed weapon', { itemName: mainHand.name })
        }
        if (offHand) {
          offHand.equipped = false
          offHand.equipmentSlot = undefined
          logger.equipment('Unequipped off-hand weapon for two-handed weapon', { itemName: offHand.name })
        }
      } else {
        // One-handed weapons: first weapon goes to main-hand, second to off-hand
        const { mainHand, offHand } = this.getEquippedWeapons()
        if (!mainHand) {
          targetSlot = 'main-hand'
        } else if (!offHand) {
          targetSlot = 'off-hand'
        } else {
          // Both slots occupied, replace main-hand
          mainHand.equipped = false
          mainHand.equipmentSlot = undefined
          targetSlot = 'main-hand'
          logger.equipment('Unequipped main-hand weapon to equip new weapon', { itemName: mainHand.name })
        }
      }
    } else if (item.type === 'armor') {
      targetSlot = 'armor'
      // Unequip existing armor
      const existingArmor = this.getEquippedItemBySlot('armor')
      if (existingArmor) {
        existingArmor.equipped = false
        existingArmor.equipmentSlot = undefined
        logger.equipment('Unequipped existing armor', { itemName: existingArmor.name })
      }
    } else if (item.type === 'shield') {
      targetSlot = 'shield'
      // Unequip existing shield
      const existingShield = this.getEquippedItemBySlot('shield')
      if (existingShield) {
        existingShield.equipped = false
        existingShield.equipmentSlot = undefined
        logger.equipment('Unequipped existing shield', { itemName: existingShield.name })
      }
    } else {
      // Other item types (accessories, etc.) - just mark as equipped without slot
      item.equipped = true
      logger.equipment('Item equipped', { 
        itemName: item.name,
        itemType: item.type,
        enchantmentLevel: item.enchantmentLevel 
      })
      return { success: true }
    }

    item.equipped = true
    item.equipmentSlot = targetSlot
    logger.equipment('Item equipped', { 
      itemName: item.name,
      itemType: item.type,
      equipmentSlot: targetSlot,
      enchantmentLevel: item.enchantmentLevel 
    })
    return { success: true }
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
    item.equipmentSlot = undefined
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

  /**
   * Modify the enchantment level of an item
   */
  modifyEnchantment(itemId: string, change: number): { success: boolean, errorMessage?: string } {
    const item = this.inventory.items.find(i => i.id === itemId)
    if (!item) {
      return { success: false, errorMessage: 'Item not found' }
    }

    const newLevel = (item.enchantmentLevel || 0) + change
    
    // Allow enchantment levels from -3 to +3
    if (newLevel < -3) {
      return { success: false, errorMessage: 'Cannot enchant below -3 (maximum curse)' }
    }
    if (newLevel > 3) {
      return { success: false, errorMessage: 'Cannot enchant above +3 (maximum enchantment)' }
    }

    const oldLevel = item.enchantmentLevel || 0
    item.enchantmentLevel = newLevel as EnchantmentLevel

    logger.equipment(`Enchantment modified for ${item.name}`, {
      itemName: item.name,
      itemType: item.type,
      oldLevel,
      newLevel,
      change,
      isEquipped: item.equipped
    })

    return { success: true }
  }

  /**
   * Set the enchantment level of an item directly
   */
  setEnchantment(itemId: string, level: number): { success: boolean, errorMessage?: string } {
    const item = this.inventory.items.find(i => i.id === itemId)
    if (!item) {
      return { success: false, errorMessage: 'Item not found' }
    }

    // Allow enchantment levels from -3 to +3
    if (level < -3 || level > 3) {
      return { success: false, errorMessage: 'Enchantment level must be between -3 and +3' }
    }

    const oldLevel = item.enchantmentLevel || 0
    item.enchantmentLevel = level as EnchantmentLevel

    logger.equipment(`Enchantment set for ${item.name}`, {
      itemName: item.name,
      itemType: item.type,
      oldLevel,
      newLevel: level,
      isEquipped: item.equipped
    })

    return { success: true }
  }

  /**
   * Get enchantment bonus for AC calculation (for armor and shields)
   */
  getEquippedEnchantmentAcBonus(): number {
    let acBonus = 0
    
    for (const item of this.inventory.items) {
      if (item.equipped && (item.type === 'armor' || item.type === 'shield')) {
        const enchantmentLevel = item.enchantmentLevel || 0
        acBonus += enchantmentLevel
      }
    }

    return acBonus
  }
}
