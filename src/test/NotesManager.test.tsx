import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { NotesManager } from '../NotesManager'

const renderWithMantine = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  )
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('NotesManager component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should render notes manager with title', () => {
    renderWithMantine(<NotesManager />)
    
    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(screen.getByText('+ Add Note')).toBeInTheDocument()
  })

  it('should show no notes message initially', async () => {
    const user = userEvent.setup()
    renderWithMantine(<NotesManager />)
    
    // Click to expand notes section
    const expandButton = screen.getByLabelText('Expand notes')
    await user.click(expandButton)
    
    expect(screen.getByText('No notes yet. Click "Add Note" to create your first note.')).toBeInTheDocument()
  })

  it('should allow adding a new note', async () => {
    const user = userEvent.setup()
    const onNotesChange = vi.fn()
    renderWithMantine(<NotesManager onNotesChange={onNotesChange} />)
    
    // Expand notes section
    const expandButton = screen.getByLabelText('Expand notes')
    await user.click(expandButton)
    
    // Click Add Note button
    const addButton = screen.getByText('+ Add Note')
    await user.click(addButton)
    
    // Fill in note content
    const textarea = screen.getByPlaceholderText('Write your note here...')
    await user.type(textarea, 'This is my first note')
    
    // Save the note
    const saveButton = screen.getByText('Save Note')
    await user.click(saveButton)
    
    // Check that note was added
    expect(screen.getByText('This is my first note')).toBeInTheDocument()
    expect(localStorageMock.setItem).toHaveBeenCalled()
    expect(onNotesChange).toHaveBeenCalled()
  })

  it('should show note preview when collapsed', async () => {
    const user = userEvent.setup()
    
    // Mock localStorage with existing note
    const mockNote = {
      id: '1',
      content: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5',
      timestamp: Date.now(),
      createdAt: new Date().toLocaleString()
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockNote]))
    
    renderWithMantine(<NotesManager />)
    
    // Expand notes section
    const expandButton = screen.getByLabelText('Expand notes')
    await user.click(expandButton)
    
    // Should show preview text (with newlines preserved)
    expect(screen.getByText((_, element) => {
      return element?.textContent === 'Line 1\nLine 2\nLine 3...'
    })).toBeInTheDocument()
    expect(screen.getByText('Click to expand...')).toBeInTheDocument()
  })

  it('should expand and collapse notes on click', async () => {
    const user = userEvent.setup()
    
    // Mock localStorage with existing note
    const mockNote = {
      id: '1',
      content: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5',
      timestamp: Date.now(),
      createdAt: new Date().toLocaleString()
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockNote]))
    
    renderWithMantine(<NotesManager />)
    
    // Expand notes section
    const expandButton = screen.getByLabelText('Expand notes')
    await user.click(expandButton)
    
    // Click on the note to expand it
    const noteCard = screen.getByText((_, element) => {
      return element?.textContent === 'Line 1\nLine 2\nLine 3...'
    })
    await user.click(noteCard)
    
    // Should show full content
    expect(screen.getByText((_, element) => {
      return element?.textContent === 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
    })).toBeInTheDocument()
    expect(screen.queryByText('Click to expand...')).not.toBeInTheDocument()
  })

  it('should delete notes when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onNotesChange = vi.fn()
    
    // Mock localStorage with existing note
    const mockNote = {
      id: '1',
      content: 'Note to delete',
      timestamp: Date.now(),
      createdAt: new Date().toLocaleString()
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockNote]))
    
    renderWithMantine(<NotesManager onNotesChange={onNotesChange} />)
    
    // Expand notes section
    const expandButton = screen.getByLabelText('Expand notes')
    await user.click(expandButton)
    
    // Click delete button
    const deleteButton = screen.getByLabelText('Delete note')
    await user.click(deleteButton)
    
    // Note should be removed
    expect(screen.queryByText('Note to delete')).not.toBeInTheDocument()
    expect(localStorageMock.setItem).toHaveBeenCalledWith('character_generator_notes', '[]')
    expect(onNotesChange).toHaveBeenCalled()
  })

  it('should format timestamps correctly', async () => {
    const user = userEvent.setup()
    
    // Mock note with specific timestamp (1 hour ago)
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const mockNote = {
      id: '1',
      content: 'Timestamped note',
      timestamp: oneHourAgo,
      createdAt: new Date(oneHourAgo).toLocaleString()
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockNote]))
    
    renderWithMantine(<NotesManager />)
    
    // Expand notes section
    const expandButton = screen.getByLabelText('Expand notes')
    await user.click(expandButton)
    
    // Should show "1h ago" timestamp
    expect(screen.getByText('1h ago')).toBeInTheDocument()
  })

  it('should cancel note creation', async () => {
    const user = userEvent.setup()
    renderWithMantine(<NotesManager />)
    
    // Expand notes section
    const expandButton = screen.getByLabelText('Expand notes')
    await user.click(expandButton)
    
    // Click Add Note button
    const addButton = screen.getByText('+ Add Note')
    await user.click(addButton)
    
    // Fill in some content
    const textarea = screen.getByPlaceholderText('Write your note here...')
    await user.type(textarea, 'Draft note')
    
    // Cancel
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    // Should not save the note
    expect(screen.queryByText('Draft note')).not.toBeInTheDocument()
    expect(localStorageMock.setItem).not.toHaveBeenCalled()
  })

  it('should disable save button when note is empty', async () => {
    const user = userEvent.setup()
    renderWithMantine(<NotesManager />)
    
    // Expand notes section
    const expandButton = screen.getByLabelText('Expand notes')
    await user.click(expandButton)
    
    // Click Add Note button
    const addButton = screen.getByText('+ Add Note')
    await user.click(addButton)
    
    // Save button should be disabled when textarea is empty
    const saveButton = screen.getByText('Save Note')
    expect(saveButton.closest('button')).toBeDisabled()
  })

  it('should auto-expand notes section when clicking Add Note while collapsed', async () => {
    const user = userEvent.setup()
    renderWithMantine(<NotesManager />)
    
    // Notes section should start collapsed
    expect(screen.queryByPlaceholderText('Write your note here...')).not.toBeInTheDocument()
    
    // Click Add Note button while section is collapsed
    const addButton = screen.getByText('+ Add Note')
    await user.click(addButton)
    
    // Should now see the textarea (notes section auto-expanded)
    expect(screen.getByPlaceholderText('Write your note here...')).toBeInTheDocument()
    
    // The expand button should now show "Collapse notes"
    expect(screen.getByLabelText('Collapse notes')).toBeInTheDocument()
  })

  it('should abandon empty draft when collapsing notes section', async () => {
    const user = userEvent.setup()
    renderWithMantine(<NotesManager />)
    
    // Start adding a note (auto-expands)
    const addButton = screen.getByText('+ Add Note')
    await user.click(addButton)
    
    // Verify we're in add mode
    expect(screen.getByPlaceholderText('Write your note here...')).toBeInTheDocument()
    const addButtonInMode = screen.getByText('+ Add Note')
    expect(addButtonInMode.closest('button')).toBeDisabled()
    
    // Collapse notes section while draft is empty
    const collapseButton = screen.getByLabelText('Collapse notes')
    await user.click(collapseButton)
    
    // Expand again
    const expandButton = screen.getByLabelText('Expand notes')
    await user.click(expandButton)
    
    // Should no longer be in add mode
    expect(screen.queryByPlaceholderText('Write your note here...')).not.toBeInTheDocument()
    const addButtonAfter = screen.getByText('+ Add Note')
    expect(addButtonAfter.closest('button')).not.toBeDisabled()
  })

  it('should preserve draft with content when collapsing notes section', async () => {
    const user = userEvent.setup()
    renderWithMantine(<NotesManager />)
    
    // Start adding a note
    const addButton = screen.getByText('+ Add Note')
    await user.click(addButton)
    
    // Add some content
    const textarea = screen.getByPlaceholderText('Write your note here...')
    await user.type(textarea, 'Draft content')
    
    // Collapse notes section
    const collapseButton = screen.getByLabelText('Collapse notes')
    await user.click(collapseButton)
    
    // Expand again
    const expandButton = screen.getByLabelText('Expand notes')
    await user.click(expandButton)
    
    // Should still be in add mode with content preserved
    expect(screen.getByPlaceholderText('Write your note here...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Draft content')).toBeInTheDocument()
  })
})