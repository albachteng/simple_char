import { useState, useEffect } from 'react'
import { Button, Paper, Text, ScrollArea, Stack, Collapse, ActionIcon, Textarea, Group } from '@mantine/core'
import { COLORS, STYLES } from './theme/constants'

interface Note {
  id: string
  content: string
  timestamp: number
  createdAt: string
}

interface NotesManagerProps {
  notes: string
  onNotesChange: (notes: string) => void
}

export function NotesManager({ notes: characterNotes, onNotesChange }: NotesManagerProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Load notes from character notes prop on component mount and when characterNotes changes
  useEffect(() => {
    try {
      if (characterNotes && characterNotes.trim() !== '') {
        const parsedNotes = JSON.parse(characterNotes)
        setNotes(parsedNotes)
      } else {
        setNotes([])
      }
    } catch (error) {
      console.warn('Failed to parse character notes:', error)
      setNotes([])
    }
  }, [characterNotes])

  // Save notes to character via callback
  const saveNotes = (updatedNotes: Note[]) => {
    try {
      const notesString = JSON.stringify(updatedNotes)
      onNotesChange(notesString)
    } catch (error) {
      console.warn('Failed to serialize notes:', error)
    }
  }

  const addNote = () => {
    if (!newNoteContent.trim()) return

    const newNote: Note = {
      id: Date.now().toString(),
      content: newNoteContent.trim(),
      timestamp: Date.now(),
      createdAt: new Date().toLocaleString()
    }

    const updatedNotes = [newNote, ...notes] // Add new note to the beginning
    setNotes(updatedNotes)
    saveNotes(updatedNotes)
    setNewNoteContent('')
    setIsAddingNote(false)
    setExpandedNoteId(newNote.id) // Auto-expand the new note
  }

  const deleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId)
    setNotes(updatedNotes)
    saveNotes(updatedNotes)
    if (expandedNoteId === noteId) {
      setExpandedNoteId(null)
    }
  }

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId)
  }

  const getPreviewText = (content: string, maxLines: number = 3) => {
    const lines = content.split('\n')
    if (lines.length <= maxLines) {
      return content
    }
    return lines.slice(0, maxLines).join('\n') + '...'
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group>
            <Text size="lg" fw={600}>Notes</Text>
            <Text size="xs" c="dimmed">({notes.length} {notes.length === 1 ? 'note' : 'notes'})</Text>
          </Group>
          <Group>
            <Button 
              size="xs" 
              variant="light" 
              onClick={() => {
                setIsAddingNote(!isAddingNote)
                if (!isAddingNote) {
                  setIsOpen(true) // Auto-expand notes section when adding a note
                }
              }}
              disabled={isAddingNote}
            >
              + Add Note
            </Button>
            <ActionIcon 
              size="md" 
              variant="light" 
              onClick={() => {
                setIsOpen(!isOpen)
                // If collapsing and there's an empty draft note, abandon it
                if (isOpen && isAddingNote && !newNoteContent.trim()) {
                  setIsAddingNote(false)
                  setNewNoteContent('')
                }
              }}
              style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              aria-label={isOpen ? 'Collapse notes' : 'Expand notes'}
            >
              ▶
            </ActionIcon>
          </Group>
        </Group>
        
        <Collapse in={isOpen}>
          <Stack gap="sm">
            {/* Add new note form */}
            {isAddingNote && (
              <Paper p="sm" withBorder style={STYLES.CARD_BACKGROUND}>
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="blue">New Note</Text>
                  <Textarea
                    placeholder="Write your note here..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    autosize
                    minRows={3}
                    maxRows={10}
                    autoFocus
                  />
                  <Group gap="xs">
                    <Button size="xs" onClick={addNote} disabled={!newNoteContent.trim()}>
                      Save Note
                    </Button>
                    <Button size="xs" variant="outline" onClick={() => {
                      setIsAddingNote(false)
                      setNewNoteContent('')
                    }}>
                      Cancel
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            )}

            {/* Notes list */}
            <ScrollArea h={400}>
              <Stack gap="xs">
                {notes.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="xl">
                    No notes yet. Click "Add Note" to create your first note.
                  </Text>
                ) : (
                  notes.map((note) => {
                    const isExpanded = expandedNoteId === note.id
                    return (
                      <Paper
                        key={note.id}
                        p="sm"
                        withBorder
                        style={{
                          backgroundColor: isExpanded ? COLORS.BACKGROUND_DARKER : COLORS.BACKGROUND_DARK,
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => toggleNoteExpansion(note.id)}
                      >
                        <Stack gap="xs">
                          <Group justify="space-between" align="flex-start">
                            <Text size="xs" c="dimmed">
                              {formatTimestamp(note.timestamp)}
                            </Text>
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="red"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNote(note.id)
                              }}
                              aria-label="Delete note"
                            >
                              ✕
                            </ActionIcon>
                          </Group>
                          
                          <Text
                            size="sm"
                            style={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontFamily: 'inherit'
                            }}
                          >
                            {isExpanded ? note.content : getPreviewText(note.content)}
                          </Text>
                          
                          {!isExpanded && note.content.split('\n').length > 3 && (
                            <Text size="xs" c="blue" style={{ fontStyle: 'italic' }}>
                              Click to expand...
                            </Text>
                          )}
                        </Stack>
                      </Paper>
                    )
                  })
                )}
              </Stack>
            </ScrollArea>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  )
}