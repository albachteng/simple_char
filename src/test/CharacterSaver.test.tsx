import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { CharacterSaver } from '../CharacterSaver'
import { Char } from '../useChar'

const renderWithMantine = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  )
}

// Mock the storage modules
vi.mock('../storage/CharacterManager')
vi.mock('../storage/LocalStorageCharacterStorage')

describe('CharacterSaver component', () => {
  const mockChar = new Char('str', 'dex')
  const mockProps = {
    opened: true,
    char: mockChar,
    high: 'str' as const,
    mid: 'dex' as const,
    racialBonuses: [] as any[],
    onSave: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with empty name field for unnamed character', () => {
    renderWithMantine(
      <CharacterSaver 
        {...mockProps}
        characterName="Unnamed Character"
      />
    )
    
    const nameInput = screen.getByLabelText('Character Name')
    expect(nameInput).toHaveValue('')
    expect(screen.getByPlaceholderText('Enter a name for your character')).toBeInTheDocument()
  })

  it('should render with empty name field for empty character name', () => {
    renderWithMantine(
      <CharacterSaver 
        {...mockProps}
        characterName=""
      />
    )
    
    const nameInput = screen.getByLabelText('Character Name')
    expect(nameInput).toHaveValue('')
    expect(screen.getByPlaceholderText('Enter a name for your character')).toBeInTheDocument()
  })

  it('should pre-populate name field for named character', () => {
    renderWithMantine(
      <CharacterSaver 
        {...mockProps}
        characterName="Gandalf the Grey"
      />
    )
    
    const nameInput = screen.getByLabelText('Character Name')
    expect(nameInput).toHaveValue('Gandalf the Grey')
    expect(screen.getByPlaceholderText('Change name or leave as is to update existing save')).toBeInTheDocument()
  })

  it('should update name field when character name prop changes', async () => {
    const { rerender } = renderWithMantine(
      <CharacterSaver 
        {...mockProps}
        characterName="Unnamed Character"
      />
    )
    
    let nameInput = screen.getByLabelText('Character Name')
    expect(nameInput).toHaveValue('')
    
    // Change the character name
    rerender(
      <MantineProvider>
        <CharacterSaver 
          {...mockProps}
          characterName="Aragorn"
        />
      </MantineProvider>
    )
    
    await waitFor(() => {
      nameInput = screen.getByLabelText('Character Name')
      expect(nameInput).toHaveValue('Aragorn')
    })
  })

  it('should allow user to modify the pre-populated name', async () => {
    const user = userEvent.setup()
    renderWithMantine(
      <CharacterSaver 
        {...mockProps}
        characterName="Legolas"
      />
    )
    
    const nameInput = screen.getByLabelText('Character Name')
    expect(nameInput).toHaveValue('Legolas')
    
    // Clear and type new name
    await user.clear(nameInput)
    await user.type(nameInput, 'Gimli')
    
    expect(nameInput).toHaveValue('Gimli')
  })

  it('should show error when trying to save with empty name', async () => {
    const user = userEvent.setup()
    renderWithMantine(
      <CharacterSaver 
        {...mockProps}
        characterName="Unnamed Character"
      />
    )
    
    const saveButton = screen.getByRole('button', { name: 'Save Character' })
    await user.click(saveButton)
    
    expect(screen.getAllByText('Please enter a character name')).toHaveLength(2) // Input error + component error
  })

  it('should reset name field to unnamed when character name changes to default', async () => {
    const { rerender } = renderWithMantine(
      <CharacterSaver 
        {...mockProps}
        characterName="Frodo"
      />
    )
    
    let nameInput = screen.getByLabelText('Character Name')
    expect(nameInput).toHaveValue('Frodo')
    
    // Change back to unnamed
    rerender(
      <MantineProvider>
        <CharacterSaver 
          {...mockProps}
          characterName="Unnamed Character"
        />
      </MantineProvider>
    )
    
    await waitFor(() => {
      nameInput = screen.getByLabelText('Character Name')
      expect(nameInput).toHaveValue('')
    })
  })
})