import { createContext, useContext, useState, ReactNode } from 'react'
import { useAuth } from './useAuth'
import type { ICharacterStorage, SavedCharacter } from '../storage/ICharacterStorage'

interface StorageContextType {
  isUsingDatabase: boolean
  saveCharacter: (character: SavedCharacter) => Promise<boolean>
  loadCharacter: (name: string) => Promise<ICharacterStorage | null>
  deleteCharacter: (name: string) => Promise<boolean>
  listCharacters: () => Promise<string[]>
  listCharacterDetails: () => Promise<SavedCharacter[]>
  syncLocalToDatabase: () => Promise<void>
  isLoading: boolean
}

const StorageContext = createContext<StorageContextType | undefined>(undefined)

interface StorageProviderProps {
  children: ReactNode
}

export function StorageProvider({ children }: StorageProviderProps) {
  const { isAuthenticated, token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Storage mode is determined automatically by authentication status
  const isUsingDatabase = isAuthenticated && !!token

  const saveCharacter = async (character: SavedCharacter): Promise<boolean> => {
    setIsLoading(true)
    try {
      if (isUsingDatabase) {
        // Try database first, fallback to local if it fails
        const success = await saveToDatabase(character, token!)
        if (success) {
          return true
        } else {
          console.warn('Database save failed, falling back to local storage')
          return await saveToLocal(character)
        }
      } else {
        // Use local storage when not authenticated
        return await saveToLocal(character)
      }
    } catch (error) {
      console.error('Error saving character:', error)
      // Always fallback to local storage on error
      return await saveToLocal(character)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCharacter = async (name: string): Promise<ICharacterStorage | null> => {
    setIsLoading(true)
    try {
      if (isUsingDatabase) {
        // Try database first, fallback to local if not found
        const character = await loadFromDatabase(name, token!)
        if (character) {
          return character
        } else {
          // Fallback to local storage
          return await loadFromLocal(name)
        }
      } else {
        // Use local storage when not authenticated
        return await loadFromLocal(name)
      }
    } catch (error) {
      console.error('Error loading character:', error)
      // Fallback to local storage on error
      return await loadFromLocal(name)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCharacter = async (name: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      if (isUsingDatabase) {
        // Delete from database and local storage
        const databaseSuccess = await deleteFromDatabase(name, token!)
        const localSuccess = await deleteFromLocal(name)
        return databaseSuccess || localSuccess
      } else {
        // Delete from local storage only
        return await deleteFromLocal(name)
      }
    } catch (error) {
      console.error('Error deleting character:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const listCharacters = async (): Promise<string[]> => {
    setIsLoading(true)
    try {
      if (isUsingDatabase) {
        // Get characters from database, with local as fallback/supplement
        const databaseCharacters = await listFromDatabase(token!)
        const localCharacters = await listFromLocal()
        
        // Combine and deduplicate, prioritizing database
        const allCharacters = [...new Set([...databaseCharacters, ...localCharacters])]
        return allCharacters.sort()
      } else {
        // Use local storage only when not authenticated
        return await listFromLocal()
      }
    } catch (error) {
      console.error('Error listing characters:', error)
      // Fallback to local only
      return await listFromLocal()
    } finally {
      setIsLoading(false)
    }
  }

  const listCharacterDetails = async (): Promise<SavedCharacter[]> => {
    setIsLoading(true)
    try {
      if (isUsingDatabase) {
        // Get detailed characters from database, with local as fallback/supplement
        const databaseCharacters = await listCharacterDetailsFromDatabase(token!)
        const localCharacters = await listCharacterDetailsFromLocal()
        
        // Combine and deduplicate by name, prioritizing database
        const combinedMap = new Map<string, SavedCharacter>()
        
        // Add local characters first
        localCharacters.forEach(char => {
          combinedMap.set(char.name, { ...char, storageType: 'local' })
        })
        
        // Add database characters, overriding local ones
        databaseCharacters.forEach(char => {
          combinedMap.set(char.name, { ...char, storageType: 'database' })
        })
        
        return Array.from(combinedMap.values()).sort((a, b) => b.timestamp - a.timestamp)
      } else {
        // Use local storage only when not authenticated
        const localCharacters = await listCharacterDetailsFromLocal()
        return localCharacters.map(char => ({ ...char, storageType: 'local' }))
      }
    } catch (error) {
      console.error('Error listing character details:', error)
      // Fallback to local only
      const localCharacters = await listCharacterDetailsFromLocal()
      return localCharacters.map(char => ({ ...char, storageType: 'local' }))
    } finally {
      setIsLoading(false)
    }
  }

  const syncLocalToDatabase = async (): Promise<void> => {
    if (!isUsingDatabase) {
      throw new Error('Database not available - user must be logged in')
    }

    setIsLoading(true)
    try {
      const localCharacters = await listCharacterDetailsFromLocal()
      
      for (const character of localCharacters) {
        await saveToDatabase(character, token!)
      }
    } catch (error) {
      console.error('Error syncing to database:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value: StorageContextType = {
    isUsingDatabase,
    saveCharacter,
    loadCharacter,
    deleteCharacter,
    listCharacters,
    listCharacterDetails,
    syncLocalToDatabase,
    isLoading,
  }

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  )
}

export function useStorage() {
  const context = useContext(StorageContext)
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider')
  }
  return context
}

// Local storage functions (existing behavior)
async function saveToLocal(character: SavedCharacter): Promise<boolean> {
  try {
    const { CharacterManager } = await import('../storage/CharacterManager')
    const { LocalStorageCharacterStorage } = await import('../storage/LocalStorageCharacterStorage')
    const characterManager = new CharacterManager(new LocalStorageCharacterStorage())
    await characterManager.saveCharacter(character.name, character)
    return true
  } catch (error) {
    console.error('Local storage save error:', error)
    return false
  }
}

async function loadFromLocal(name: string): Promise<ICharacterStorage | null> {
  try {
    const { CharacterManager } = await import('../storage/CharacterManager')
    const characterManager = new CharacterManager()
    return characterManager.loadCharacter(name)
  } catch (error) {
    console.error('Local storage load error:', error)
    return null
  }
}

async function deleteFromLocal(name: string): Promise<boolean> {
  try {
    const { CharacterManager } = await import('../storage/CharacterManager')
    const characterManager = new CharacterManager()
    characterManager.deleteCharacter(name)
    return true
  } catch (error) {
    console.error('Local storage delete error:', error)
    return false
  }
}

async function listFromLocal(): Promise<string[]> {
  try {
    const { CharacterManager } = await import('../storage/CharacterManager')
    const characterManager = new CharacterManager()
    return characterManager.listCharacters()
  } catch (error) {
    console.error('Local storage list error:', error)
    return []
  }
}

// Database storage functions (API integration)
async function saveToDatabase(character: SavedCharacter, token: string): Promise<boolean> {
  try {
    console.log('Attempting to save character to database:', character.name)
    console.log('Character data:', character)
    
    const response = await fetch('/api/characters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(character),
    })

    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)
    
    if (!data.success) {
      console.error('Server returned error:', data)
    }
    
    return data.success || false
  } catch (error) {
    console.error('Database storage save error:', error)
    return false
  }
}

async function loadFromDatabase(name: string, token: string): Promise<ICharacterStorage | null> {
  try {
    const response = await fetch(`/api/characters/${encodeURIComponent(name)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Database storage load error:', error)
    return null
  }
}

async function deleteFromDatabase(name: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/characters/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return data.success || false
  } catch (error) {
    console.error('Database storage delete error:', error)
    return false
  }
}

async function listFromDatabase(token: string): Promise<string[]> {
  try {
    const response = await fetch('/api/characters', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.success ? data.data.map((char: any) => char.name) : []
  } catch (error) {
    console.error('Database storage list error:', error)
    return []
  }
}

async function listCharacterDetailsFromDatabase(token: string): Promise<SavedCharacter[]> {
  try {
    const response = await fetch('/api/characters', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    console.error('Database storage list details error:', error)
    return []
  }
}

async function listCharacterDetailsFromLocal(): Promise<SavedCharacter[]> {
  try {
    const { CharacterManager } = await import('../storage/CharacterManager')
    const { LocalStorageCharacterStorage } = await import('../storage/LocalStorageCharacterStorage')
    const characterManager = new CharacterManager(new LocalStorageCharacterStorage())
    return await characterManager.listCharacters()
  } catch (error) {
    console.error('Local storage list details error:', error)
    return []
  }
}