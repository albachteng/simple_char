import { describe, it, expect, vi } from 'vitest'
import { Char } from '../useChar'
import { createInventoryItem, BASE_WEAPONS, BASE_ARMOR } from '../inventory/InventoryConstants'

describe('UI Update Integration', () => {
  it('should trigger update event when triggerUpdate is called', () => {
    const char = new Char('str', 'dex')
    const updateHandler = vi.fn()
    
    // Listen for update events
    char.on('update', updateHandler)
    
    // Manually trigger update
    char.triggerUpdate()
    
    // Verify the handler was called
    expect(updateHandler).toHaveBeenCalledTimes(1)
    
    // Clean up
    char.off('update', updateHandler)
  })
  
  it('should sync equipment and trigger update when inventory changes', () => {
    const char = new Char('str', 'dex')
    const updateHandler = vi.fn()
    
    // Listen for update events
    char.on('update', updateHandler)
    
    // Add and equip armor
    const armor = createInventoryItem(BASE_ARMOR[0]) // Plate Armor
    char.inventory.addItem(armor)
    
    // Verify initial state
    expect(char.armor).toBe('none')
    const initialAC = char.ac()
    expect(initialAC).toBe(13) // Base AC without armor (13 base + 0 dex mod)
    
    // Equip the armor
    char.inventory.equipItem(armor.id)
    
    // Sync equipment and trigger update (simulating what the UI callback does)
    char.syncEquipmentFromInventory()
    char.triggerUpdate()
    
    // Verify equipment was synced
    expect(char.armor).toBe('heavy')
    expect(char.ac()).toBeGreaterThan(initialAC) // AC should increase with armor
    
    // Verify update was triggered
    expect(updateHandler).toHaveBeenCalledTimes(1)
    
    // Clean up
    char.off('update', updateHandler)
  })
  
  it('should update AC calculation when enchanted armor is equipped', () => {
    const char = new Char('dex', 'str') // DEX focused for better AC calculation
    const updateHandler = vi.fn()
    
    // Listen for update events
    char.on('update', updateHandler)
    
    // Create enchanted light armor with DEX bonus
    const enchantedArmor = createInventoryItem({
      name: 'Enchanted Leather Armor',
      type: 'armor',
      armorType: 'light',
      enchantmentLevel: 1,
      description: 'Magical leather armor that enhances agility',
      statBonuses: [{ stat: 'dex', bonus: 2 }]
    })
    
    // Record initial AC
    const initialAC = char.ac()
    
    // Add and equip the enchanted armor
    char.inventory.addItem(enchantedArmor)
    char.inventory.equipItem(enchantedArmor.id)
    
    // Sync equipment and trigger update
    char.syncEquipmentFromInventory()
    char.triggerUpdate()
    
    // Verify AC increased due to both armor and stat bonus
    const newAC = char.ac()
    expect(newAC).toBeGreaterThan(initialAC)
    
    // Verify equipment is properly set
    expect(char.armor).toBe('light')
    
    // Verify the stat bonus is being applied in AC calculation
    const equippedBonuses = char.getEquippedStatBonuses()
    expect(equippedBonuses.dex).toBe(2)
    
    // Verify update was triggered
    expect(updateHandler).toHaveBeenCalledTimes(1)
    
    // Clean up
    char.off('update', updateHandler)
  })
})