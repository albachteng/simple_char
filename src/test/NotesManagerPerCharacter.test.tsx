import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MantineProvider } from '@mantine/core'
import { NotesManager } from '../NotesManager'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

describe('NotesManager Per-Character Integration', () => {
  let mockOnNotesChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnNotesChange = vi.fn()
  })

  describe('Character Notes Loading', () => {
    it('should load notes from character prop', () => {
      const testNotes = JSON.stringify([
        { id: '1', content: 'Test note 1', timestamp: 1234567890000, createdAt: '1/1/2023' },
        { id: '2', content: 'Test note 2', timestamp: 1234567891000, createdAt: '1/1/2023' }
      ])

      render(
        <TestWrapper>
          <NotesManager notes={testNotes} onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      expect(screen.getByText('Notes')).toBeInTheDocument()
      expect(screen.getByText('(2 notes)')).toBeInTheDocument()
    })

    it('should handle empty notes', () => {
      render(
        <TestWrapper>
          <NotesManager notes="" onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      expect(screen.getByText('Notes')).toBeInTheDocument()
      expect(screen.getByText('(0 notes)')).toBeInTheDocument()
    })

    it('should handle invalid JSON in notes gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      render(
        <TestWrapper>
          <NotesManager notes="invalid json" onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      expect(screen.getByText('Notes')).toBeInTheDocument()
      expect(screen.getByText('(0 notes)')).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse character notes:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Character Notes Saving', () => {
    it('should save notes via callback when adding a note', async () => {
      render(
        <TestWrapper>
          <NotesManager notes="" onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      // Open the notes section and add a note
      const expandButton = screen.getByLabelText('Expand notes')
      fireEvent.click(expandButton)

      const addButton = screen.getByText('+ Add Note')
      fireEvent.click(addButton)

      const textarea = screen.getByPlaceholderText('Write your note here...')
      fireEvent.change(textarea, { target: { value: 'New test note' } })

      const saveButton = screen.getByText('Save Note')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnNotesChange).toHaveBeenCalledTimes(1)
        const calledWith = mockOnNotesChange.mock.calls[0][0]
        const parsedNotes = JSON.parse(calledWith)
        expect(parsedNotes).toHaveLength(1)
        expect(parsedNotes[0].content).toBe('New test note')
      })
    })

    it('should save notes via callback when deleting a note', async () => {
      const testNotes = JSON.stringify([
        { id: '1', content: 'Test note to delete', timestamp: 1234567890000, createdAt: '1/1/2023' }
      ])

      render(
        <TestWrapper>
          <NotesManager notes={testNotes} onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      // Open the notes section
      const expandButton = screen.getByLabelText('Expand notes')
      fireEvent.click(expandButton)

      // Delete the note
      const deleteButton = screen.getByLabelText('Delete note')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockOnNotesChange).toHaveBeenCalledTimes(1)
        const calledWith = mockOnNotesChange.mock.calls[0][0]
        const parsedNotes = JSON.parse(calledWith)
        expect(parsedNotes).toHaveLength(0)
      })
    })
  })

  describe('Character Notes Updates', () => {
    it('should update when notes prop changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <NotesManager notes="" onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      expect(screen.getByText('(0 notes)')).toBeInTheDocument()

      // Update with new notes
      const newNotes = JSON.stringify([
        { id: '1', content: 'New note from character', timestamp: 1234567890000, createdAt: '1/1/2023' }
      ])

      rerender(
        <TestWrapper>
          <NotesManager notes={newNotes} onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('(1 note)')).toBeInTheDocument()
      })
    })

    it('should clear notes when character is reset', async () => {
      const testNotes = JSON.stringify([
        { id: '1', content: 'Test note', timestamp: 1234567890000, createdAt: '1/1/2023' }
      ])

      const { rerender } = render(
        <TestWrapper>
          <NotesManager notes={testNotes} onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      expect(screen.getByText('(1 note)')).toBeInTheDocument()

      // Reset notes (empty string)
      rerender(
        <TestWrapper>
          <NotesManager notes="" onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('(0 notes)')).toBeInTheDocument()
      })
    })
  })

  describe('Character Isolation', () => {
    it('should not interfere with other character notes', () => {
      const character1Notes = JSON.stringify([
        { id: '1', content: 'Character 1 note', timestamp: 1234567890000, createdAt: '1/1/2023' }
      ])

      const character2Notes = JSON.stringify([
        { id: '2', content: 'Character 2 note', timestamp: 1234567891000, createdAt: '1/1/2023' }
      ])

      // Test that each NotesManager instance is independent
      const { rerender } = render(
        <TestWrapper>
          <NotesManager notes={character1Notes} onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      expect(screen.getByText('(1 note)')).toBeInTheDocument()

      // Switch to different character
      rerender(
        <TestWrapper>
          <NotesManager notes={character2Notes} onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      expect(screen.getByText('(1 note)')).toBeInTheDocument()
      
      // Open notes section to verify content is different
      const expandButton = screen.getByLabelText('Expand notes')
      fireEvent.click(expandButton)

      expect(screen.getByText('Character 2 note')).toBeInTheDocument()
      expect(screen.queryByText('Character 1 note')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle serialization errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Mock JSON.stringify to throw an error only for arrays (notes)
      const originalStringify = JSON.stringify
      vi.spyOn(JSON, 'stringify').mockImplementation((value) => {
        if (Array.isArray(value)) {
          throw new Error('Serialization error')
        }
        return originalStringify(value)
      })

      render(
        <TestWrapper>
          <NotesManager notes="" onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      // Try to add a note
      const expandButton = screen.getByLabelText('Expand notes')
      fireEvent.click(expandButton)

      const addButton = screen.getByText('+ Add Note')
      fireEvent.click(addButton)

      const textarea = screen.getByPlaceholderText('Write your note here...')
      fireEvent.change(textarea, { target: { value: 'Test note' } })

      const saveButton = screen.getByText('Save Note')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to serialize notes:', expect.any(Error))
      })

      // Restore original methods
      JSON.stringify = originalStringify
      consoleSpy.mockRestore()
    })
  })

  describe('Integration with Character System', () => {
    it('should work with complex note structures', () => {
      const complexNotes = JSON.stringify([
        { 
          id: '1', 
          content: 'Multi-line note\\nwith line breaks\\nand special characters: !@#$%^&*()', 
          timestamp: 1234567890000, 
          createdAt: '1/1/2023' 
        },
        { 
          id: '2', 
          content: 'Another note with different content', 
          timestamp: 1234567891000, 
          createdAt: '1/1/2023' 
        }
      ])

      render(
        <TestWrapper>
          <NotesManager notes={complexNotes} onNotesChange={mockOnNotesChange} />
        </TestWrapper>
      )

      expect(screen.getByText('(2 notes)')).toBeInTheDocument()

      // Open notes section
      const expandButton = screen.getByLabelText('Expand notes')
      fireEvent.click(expandButton)

      // Verify complex content is displayed
      expect(screen.getByText(/Multi-line note/)).toBeInTheDocument()
      expect(screen.getByText('Another note with different content')).toBeInTheDocument()
    })
  })
})