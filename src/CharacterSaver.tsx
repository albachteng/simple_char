import { useState } from 'react'
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
  onSave?: (name: string) => void
}

export function CharacterSaver({ char, high, mid, racialBonuses, onSave }: CharacterSaverProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showOverwriteModal, setShowOverwriteModal] = useState(false)
  const [pendingSaveName, setPendingSaveName] = useState('')

  const characterManager = new CharacterManager(new LocalStorageCharacterStorage())

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
            placeholder="Enter a name for your character"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            error={error}
          />

          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || saving}
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