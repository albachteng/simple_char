import { useState, useEffect } from 'react'
import { Button, TextInput, Paper, Text, Stack, Group, Modal, Badge } from '@mantine/core'
import { SavedCharacter } from './storage/ICharacterStorage'
import { Char } from './useChar'
import { Stat } from '../types'
import { useStorage } from './hooks/useStorage'
import { useAuth } from './hooks/useAuth'
import { CharacterManager } from './storage/CharacterManager'
import { HybridCharacterStorage } from './storage/HybridCharacterStorage'

interface CharacterLoaderProps {
  opened: boolean
  onLoad?: (char: Char, high: Stat, mid: Stat, racialBonuses: Stat[], name: string) => void
  onCancel?: () => void
}

export function CharacterLoader({ opened, onLoad, onCancel }: CharacterLoaderProps) {
  const [characters, setCharacters] = useState<SavedCharacter[]>([])
  const [hashInput, setHashInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { listCharacterDetails, loadCharacter, deleteCharacter, isUsingDatabase, isLoading, syncLocalToDatabase, saveCharacter } = useStorage()
  const { token } = useAuth()
  
  // Hybrid character manager that can load from both database and localStorage
  const characterManager = new CharacterManager(new HybridCharacterStorage(token || undefined))

  useEffect(() => {
    loadCharacterList()
  }, [opened])

  const loadCharacterList = async () => {
    try {
      const chars = await listCharacterDetails()
      setCharacters(chars)
    } catch (err) {
      setError(`Failed to load character list: ${err}`)
    }
  }

  const handleLoadByName = async (name: string) => {
    setLoading(true)
    setError('')

    try {
      // Use the hybrid character manager which handles both database and localStorage
      const result = await characterManager.loadCharacter(name)
      if (result) {
        onLoad?.(result.char, result.high, result.mid, result.racialBonuses, result.name)
      } else {
        setError(`Character "${name}" not found`)
      }
    } catch (err) {
      setError(`Failed to load character: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadByHash = async () => {
    if (!hashInput.trim()) {
      setError('Please enter a character hash')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await characterManager.loadCharacterByHash(hashInput.trim())
      if (result) {
        onLoad?.(result.char, result.high, result.mid, result.racialBonuses, result.name)
      } else {
        setError('Character not found with that hash')
      }
    } catch (err) {
      setError(`Failed to load character: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (name: string) => {
    const confirmed = confirm(`Are you sure you want to delete "${name}"?`)
    if (!confirmed) return

    try {
      await deleteCharacter(name)
      await loadCharacterList()
    } catch (err) {
      setError(`Failed to delete character: ${err}`)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleUploadToDatabase = async (character: SavedCharacter) => {
    if (!isUsingDatabase) {
      setError('You must be logged in to upload characters to the database')
      return
    }

    try {
      await saveCharacter(character)
      await loadCharacterList()
    } catch (err) {
      setError(`Failed to upload character: ${err}`)
    }
  }

  const handleSyncAll = async () => {
    if (!isUsingDatabase) {
      setError('You must be logged in to sync characters to the database')
      return
    }

    try {
      await syncLocalToDatabase()
      await loadCharacterList()
    } catch (err) {
      setError(`Failed to sync characters: ${err}`)
    }
  }

  // Filter characters to show local-only ones for upload
  const localOnlyCharacters = characters.filter(char => char.storageType === 'local')

  return (
    <Modal 
      opened={opened} 
      onClose={() => onCancel?.()} 
      title="Load Character"
      size="lg"
      centered
    >
      <Stack gap="md">

        {/* Load by Hash */}
        <div>
          <Text size="sm" fw={500} style={{ marginBottom: '8px' }}>Load by Hash</Text>
          <Group gap="sm">
            <TextInput
              placeholder="Enter character hash"
              value={hashInput}
              onChange={(e) => setHashInput(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button onClick={handleLoadByHash} disabled={loading}>
              Load
            </Button>
          </Group>
          <Text size="xs" c="dimmed" style={{ marginTop: '4px' }}>
            Use this to recover characters after clearing browser data
          </Text>
        </div>

        {/* Saved Characters */}
        <div>
          <Text size="sm" fw={500} style={{ marginBottom: '8px' }}>Saved Characters</Text>
          
          {characters.length === 0 ? (
            <Text c="dimmed" size="sm">No saved characters found</Text>
          ) : (
            <Stack gap="xs">
              {characters.map((char) => (
                <Paper key={char.name} p="sm" withBorder style={{ backgroundColor: '#333' }}>
                  <Group justify="space-between">
                    <div>
                      <Group gap="xs" align="center">
                        <Text fw={500} style={{ color: '#e0e0e0' }}>{char.name}</Text>
                        <Badge 
                          size="xs" 
                          color={char.storageType === 'database' ? 'blue' : 'gray'}
                          variant="light"
                        >
                          {char.storageType === 'database' ? 'Database' : 'Local'}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {char.data.race ? `${char.data.race} - ` : ''}Level {char.data.level} - {formatDate(char.timestamp)}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                        Hash: {char.hash}
                      </Text>
                    </div>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        onClick={() => handleLoadByName(char.name)}
                        disabled={loading || isLoading}
                      >
                        Load
                      </Button>
                      {char.storageType === 'local' && isUsingDatabase && (
                        <Button
                          size="xs"
                          color="green"
                          onClick={() => handleUploadToDatabase(char)}
                          disabled={loading || isLoading}
                        >
                          Upload
                        </Button>
                      )}
                      <Button
                        size="xs"
                        color="red"
                        onClick={() => handleDelete(char.name)}
                        disabled={loading || isLoading}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </div>

        {/* Bulk Upload Section */}
        {localOnlyCharacters.length > 0 && isUsingDatabase && (
          <div>
            <Text size="sm" fw={500} style={{ marginBottom: '8px' }}>Upload Local Characters</Text>
            <Paper p="sm" withBorder style={{ backgroundColor: '#333' }}>
              <Group justify="space-between">
                <Text size="sm" style={{ color: '#e0e0e0' }}>
                  {localOnlyCharacters.length} local character{localOnlyCharacters.length > 1 ? 's' : ''} can be uploaded to the database
                </Text>
                <Button
                  size="xs"
                  color="green"
                  onClick={handleSyncAll}
                  disabled={loading || isLoading}
                >
                  Upload All
                </Button>
              </Group>
            </Paper>
          </div>
        )}

        {error && (
          <Text c="red" size="sm">{error}</Text>
        )}
      </Stack>
    </Modal>
  )
}