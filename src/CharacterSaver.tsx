import { useState, useEffect } from 'react'
import { Button, TextInput, Paper, Text, Stack } from '@mantine/core'
import { CharacterManager } from './storage/CharacterManager'
import { LocalStorageCharacterStorage } from './storage/LocalStorageCharacterStorage'
import { OverwriteConfirmModal } from './OverwriteConfirmModal'
import { Char } from './useChar'
import { Stat } from '../types'

interface CharacterSaverProps {
  char: Char
  high: Stat
  mid: Stat
  racialBonuses: Stat[]
  characterName: string
  onSave?: (name: string) => void
}

export function CharacterSaver({ char, high, mid, racialBonuses, characterName, onSave }: CharacterSaverProps) {
  // Pre-populate with character name if it's not the default
  const getInitialName = () => {
    return characterName && characterName !== 'Unnamed Character' ? characterName : ''
  }
  
  const [name, setName] = useState(getInitialName())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showOverwriteModal, setShowOverwriteModal] = useState(false)
  const [pendingSaveName, setPendingSaveName] = useState('')

  const characterManager = new CharacterManager(new LocalStorageCharacterStorage())

  // Update name field when character name changes
  useEffect(() => {
    const newName = characterName && characterName !== 'Unnamed Character' ? characterName : ''
    setName(newName)
  }, [characterName])

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a character name')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Check if character already exists
      const exists = await characterManager.characterExists(name.trim())
      if (exists) {
        // Show modal instead of browser confirm
        setPendingSaveName(name.trim())
        setShowOverwriteModal(true)
        setSaving(false)
        return
      }

      await performSave(name.trim())
    } catch (err) {
      setError(`Failed to save character: ${err}`)
      setSaving(false)
    }
  }

  const performSave = async (saveName: string) => {
    try {
      await characterManager.saveCharacter(char, saveName, high, mid, racialBonuses)
      setSuccess(`Character "${saveName}" saved successfully!`)
      setName('')
      onSave?.(saveName)
    } catch (err) {
      setError(`Failed to save character: ${err}`)
    } finally {
      setSaving(false)
    }
  }

  const handleOverwriteConfirm = async () => {
    setShowOverwriteModal(false)
    setSaving(true)
    await performSave(pendingSaveName)
    setPendingSaveName('')
  }

  const handleOverwriteCancel = () => {
    setShowOverwriteModal(false)
    setPendingSaveName('')
  }

  return (
    <>
      <Paper p="md" withBorder style={{ marginTop: '16px' }}>
        <Stack gap="sm">
          <Text size="lg" fw={600}>Save Character</Text>
          
          <TextInput
            label="Character Name"
            placeholder={
              characterName && characterName !== 'Unnamed Character' 
                ? "Change name or leave as is to update existing save"
                : "Enter a name for your character"
            }
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            error={error}
          />

          <Button 
			autoContrast={true}
            onClick={handleSave} 
			color={"red"}
            disabled={saving}
            loading={saving}
            style={{ alignSelf: 'flex-start' }}
          >
            {saving ? 'Saving...' : 'Save Character'}
          </Button>

          {success && (
            <Text c="green" size="sm">{success}</Text>
          )}

          {error && (
            <Text c="red" size="sm">{error}</Text>
          )}

        </Stack>
      </Paper>
      
      <OverwriteConfirmModal
        isOpen={showOverwriteModal}
        characterName={pendingSaveName}
        onConfirm={handleOverwriteConfirm}
        onCancel={handleOverwriteCancel}
      />
    </>
  )
}
