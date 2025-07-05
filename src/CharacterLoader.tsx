import { useState, useEffect } from 'react'
import { Button, TextInput, Paper, Text, Stack, Group } from '@mantine/core'
import { CharacterManager } from './storage/CharacterManager'
import { LocalStorageCharacterStorage } from './storage/LocalStorageCharacterStorage'
import { SavedCharacter } from './storage/ICharacterStorage'
import { Char } from './useChar'
import { Stat } from '../types'

interface CharacterLoaderProps {
  onLoad?: (char: Char, high: Stat, mid: Stat, racialBonuses: Stat[], name: string) => void
  onCancel?: () => void
}

export function CharacterLoader({ onLoad, onCancel }: CharacterLoaderProps) {
  const [characters, setCharacters] = useState<SavedCharacter[]>([])
  const [hashInput, setHashInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const characterManager = new CharacterManager(new LocalStorageCharacterStorage())

  useEffect(() => {
    loadCharacterList()
  }, [])

  const loadCharacterList = async () => {
    try {
      const chars = await characterManager.listCharacters()
      setCharacters(chars)
    } catch (err) {
      setError(`Failed to load character list: ${err}`)
    }
  }

  const handleLoadByName = async (name: string) => {
    setLoading(true)
    setError('')

    try {
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
      await characterManager.deleteCharacter(name)
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

  return (
    <Paper p="md" withBorder style={{ margin: '16px 0' }}>
      <Stack gap="md">
        <Text size="lg" fw={600}>Load Character</Text>

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
                      <Text fw={500} style={{ color: '#e0e0e0' }}>{char.name}</Text>
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
                        disabled={loading}
                      >
                        Load
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        onClick={() => handleDelete(char.name)}
                        disabled={loading}
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

        {error && (
          <Text c="red" size="sm">{error}</Text>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}