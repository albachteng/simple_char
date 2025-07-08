import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { InventoryViewer } from '../InventoryViewer'
import { InventoryManager } from '../inventory/InventoryManager'
import { Char } from '../useChar'

const renderWithMantine = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  )
}

describe('InventoryViewer Interaction Tests', () => {
  let char: Char
  let inventoryManager: InventoryManager
  let onInventoryChange: any

  beforeEach(() => {
    char = new Char('str', 'dex')
    inventoryManager = new InventoryManager({ items: [] })
    inventoryManager.setCharacterStats({ str: char.str, dex: char.dex, int: char.int })
    onInventoryChange = () => {}
  })

  it('should render without crashing when opening AddItemModal', async () => {
    const user = userEvent.setup()
    
    renderWithMantine(
      <InventoryViewer
        inventoryManager={inventoryManager}
        onInventoryChange={onInventoryChange}
      />
    )

    // Click the "Add Item" button
    const addButton = screen.getByText('Add Item')
    await user.click(addButton)

    // Should open the modal without crashing
    await waitFor(() => {
      expect(screen.getByText('Add Item to Inventory')).toBeInTheDocument()
    })
  })

  it('should add items to inventory without crashing', async () => {
    const user = userEvent.setup()
    
    renderWithMantine(
      <InventoryViewer
        inventoryManager={inventoryManager}
        onInventoryChange={onInventoryChange}
      />
    )

    // Click the "Add Item" button
    const addButton = screen.getByText('Add Item')
    await user.click(addButton)

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Add Item to Inventory')).toBeInTheDocument()
    })

    // Find and click an "Add" button for any item
    const addItemButtons = screen.getAllByText('Add')
    expect(addItemButtons.length).toBeGreaterThan(0)
    
    // Click the first "Add" button
    await user.click(addItemButtons[0])

    // Modal should close and item should be added (no crash)
    await waitFor(() => {
      expect(screen.queryByText('Add Item to Inventory')).not.toBeInTheDocument()
    })

    // Check that inventory shows the item
    expect(inventoryManager.getItems().length).toBe(1)
  })

  it('should handle item equipping without crashing', async () => {
    const user = userEvent.setup()
    
    // Pre-add a weapon to inventory
    inventoryManager.addItem({
      id: 'test-sword',
      name: 'Test Sword',
      type: 'weapon',
      equipped: false,
      enchantmentLevel: 0
    })

    renderWithMantine(
      <InventoryViewer
        inventoryManager={inventoryManager}
        onInventoryChange={onInventoryChange}
      />
    )

    // Should display the sword
    expect(screen.getByText('Test Sword')).toBeInTheDocument()
    
    // Find and click the equip button
    const equipButton = screen.getByText('Equip')
    await user.click(equipButton)

    // Should not crash and should show as equipped
    await waitFor(() => {
      expect(screen.getByText('Unequip')).toBeInTheDocument()
    })
  })

  it('should handle item unequipping without crashing', async () => {
    const user = userEvent.setup()
    
    // Pre-add and equip a weapon
    inventoryManager.addItem({
      id: 'test-sword',
      name: 'Test Sword',
      type: 'weapon',
      equipped: false,
      enchantmentLevel: 0
    })
    inventoryManager.equipItem('test-sword')

    renderWithMantine(
      <InventoryViewer
        inventoryManager={inventoryManager}
        onInventoryChange={onInventoryChange}
      />
    )

    // Should display the equipped sword
    expect(screen.getByText('Test Sword')).toBeInTheDocument()
    expect(screen.getByText('Unequip')).toBeInTheDocument()
    
    // Find and click the unequip button
    const unequipButton = screen.getByText('Unequip')
    await user.click(unequipButton)

    // Should not crash and should show as unequipped
    await waitFor(() => {
      expect(screen.getByText('Equip')).toBeInTheDocument()
    })
  })

  it('should handle item removal without crashing', async () => {
    const user = userEvent.setup()
    
    // Pre-add an item
    inventoryManager.addItem({
      id: 'test-item',
      name: 'Test Item',
      type: 'weapon',
      equipped: false,
      enchantmentLevel: 0
    })

    renderWithMantine(
      <InventoryViewer
        inventoryManager={inventoryManager}
        onInventoryChange={onInventoryChange}
      />
    )

    // Should display the item
    expect(screen.getByText('Test Item')).toBeInTheDocument()
    
    // Find and click the remove button
    const removeButton = screen.getByText('Remove')
    await user.click(removeButton)

    // Should not crash and item should be removed
    await waitFor(() => {
      expect(screen.queryByText('Test Item')).not.toBeInTheDocument()
    })
    
    expect(inventoryManager.getItems().length).toBe(0)
  })

  it('should display items in ScrollArea without crashing', async () => {
    // Pre-add multiple items to test ScrollArea
    for (let i = 0; i < 10; i++) {
      inventoryManager.addItem({
        id: `test-item-${i}`,
        name: `Test Item ${i}`,
        type: 'weapon',
        equipped: false,
        enchantmentLevel: 0
      })
    }

    renderWithMantine(
      <InventoryViewer
        inventoryManager={inventoryManager}
        onInventoryChange={onInventoryChange}
      />
    )

    // Should display all items without crashing
    for (let i = 0; i < 10; i++) {
      expect(screen.getByText(`Test Item ${i}`)).toBeInTheDocument()
    }
    
    // Should show item count
    expect(screen.getByText('Items (10)')).toBeInTheDocument()
  })

  it('should handle loading character with inventory without crashing', async () => {
    // Pre-add items to inventory
    inventoryManager.addItem({
      id: 'loaded-sword',
      name: 'Loaded Sword',
      type: 'weapon',
      equipped: true,
      enchantmentLevel: 1
    })
    
    inventoryManager.addItem({
      id: 'loaded-armor',
      name: 'Loaded Armor',
      type: 'armor',
      equipped: true,
      enchantmentLevel: 0
    })

    renderWithMantine(
      <InventoryViewer
        inventoryManager={inventoryManager}
        onInventoryChange={onInventoryChange}
      />
    )

    // Should display loaded items without crashing
    expect(screen.getByText('Loaded Sword')).toBeInTheDocument()
    expect(screen.getByText('Loaded Armor')).toBeInTheDocument()
    
    // Should show equipped items in equipped section
    expect(screen.getAllByText('Equipped')).toHaveLength(3) // Section header + 2 equipped items
    
    // Should show enchantment level for sword
    expect(screen.getAllByText('+1').length).toBeGreaterThan(0)
  })
})