import { useState } from 'react'
import { TextInput } from '@mantine/core'

interface CharacterNameEditorProps {
  name: string
  onNameChange: (newName: string) => void
  style?: React.CSSProperties
}

export function CharacterNameEditor({ name, onNameChange, style }: CharacterNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(name)

  const handleDoubleClick = () => {
    setIsEditing(true)
    setTempName(name)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveName()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const handleBlur = () => {
    saveName()
  }

  const saveName = () => {
    const trimmedName = tempName.trim()
    if (trimmedName) {
      onNameChange(trimmedName)
    }
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setTempName(name)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <TextInput
        value={tempName}
        onChange={(e) => setTempName(e.currentTarget.value)}
        onKeyDown={handleKeyPress}
        onBlur={handleBlur}
        autoFocus
        size="xl"
        style={{
          ...style,
          fontSize: '2rem',
          fontWeight: 'bold'
        }}
        styles={{
          input: {
            fontSize: '2rem',
            fontWeight: 'bold',
            border: '2px solid #555',
            backgroundColor: '#2a2a2a',
            color: '#e0e0e0'
          }
        }}
      />
    )
  }

  return (
    <h1 
      onDoubleClick={handleDoubleClick}
      style={{
        ...style,
        cursor: 'pointer',
        userSelect: 'none',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#333'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
      title="Double-click to edit name"
    >
      {name || 'Unnamed Character'}
    </h1>
  )
}