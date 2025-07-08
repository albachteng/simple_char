import { useState, useEffect } from 'react'
import { Button, Paper, Text, ScrollArea, Group, Stack, Collapse, ActionIcon } from '@mantine/core'
import { logger, type LogEntry, type LogLevel } from './logger'
import { characterLogManager } from './logging/CharacterLogManager'
import { CustomSelect } from './CustomSelect'
import { COLORS } from './theme/constants'

interface LogViewerProps {
  characterName?: string
  showCharacterSelector?: boolean
}

export function LogViewer({ characterName, showCharacterSelector = false }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCharacter, setSelectedCharacter] = useState<string>('all')
  const [availableCharacters, setAvailableCharacters] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const refreshLogs = () => {
    if (characterName) {
      // If we have a specific character, show only their logs
      setLogs(characterLogManager.getCharacterLogs(characterName))
    } else if (selectedCharacter !== 'all') {
      // If character is selected from dropdown, show their logs
      setLogs(characterLogManager.getCharacterLogs(selectedCharacter))
    } else {
      // Show global logs (backward compatibility)
      setLogs(logger.getLogs())
    }
    
    // Update available characters
    setAvailableCharacters(characterLogManager.getCharacterNames())
  }

  // Auto-refresh logs every second to catch new entries
  useEffect(() => {
    const interval = setInterval(() => {
      refreshLogs()
    }, 1000)

    // Initial load
    refreshLogs()

    return () => clearInterval(interval)
  }, [characterName, selectedCharacter])

  // Filter logs based on selected level and category
  const filteredLogs = logs.filter(log => {
    const levelMatch = selectedLevel === 'all' || log.level === selectedLevel
    const categoryMatch = selectedCategory === 'all' || log.category === selectedCategory
    return levelMatch && categoryMatch
  })

  // Get unique categories from logs
  const categories = ['all', ...new Set(logs.map(log => log.category))]
  
  // Get current character display name
  const currentCharacterDisplay = characterName || (selectedCharacter === 'all' ? 'Global' : selectedCharacter)

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'debug': return COLORS.TEXT_MUTED
      case 'info': return COLORS.INFO
      case 'warn': return COLORS.WARNING
      case 'error': return COLORS.ERROR
      default: return COLORS.TEXT_MUTED
    }
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group>
            <Text size="lg" fw={600}>Debug Log</Text>
            <Text size="xs" c="dimmed">({filteredLogs.length} entries)</Text>
            {currentCharacterDisplay !== 'Global' && (
              <Text size="xs" c="blue" fw={500}>
                [{currentCharacterDisplay}]
              </Text>
            )}
          </Group>
          <Group>
            <Button size="xs" variant="light" onClick={refreshLogs}>↻</Button>
            <ActionIcon 
              size="md" 
              variant="light" 
              onClick={() => setIsOpen(!isOpen)}
              style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              aria-label={isOpen ? 'Collapse log viewer' : 'Expand log viewer'}
            >
              ▶
            </ActionIcon>
          </Group>
        </Group>
        
        <Collapse in={isOpen}>
          <Stack gap="sm">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
              {(showCharacterSelector && !characterName) && (
                <CustomSelect
                  label="Character"
                  value={selectedCharacter}
                  onChange={(value) => setSelectedCharacter(value || 'all')}
                  options={[
                    { value: 'all', label: 'Global' },
                    ...availableCharacters.map(char => ({ value: char, label: char }))
                  ]}
                  size="xs"
                  width={140}
                />
              )}
              
              <CustomSelect
                label="Level"
                value={selectedLevel}
                onChange={(value) => setSelectedLevel(value as LogLevel | 'all')}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'debug', label: 'Debug' },
                  { value: 'info', label: 'Info' },
                  { value: 'warn', label: 'Warn' },
                  { value: 'error', label: 'Error' }
                ]}
                size="xs"
                width={100}
              />
              
              <CustomSelect
                label="Category"
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value || 'all')}
                options={categories.map(cat => ({ value: cat, label: cat }))}
                size="xs"
                width={120}
              />
            </div>

            <ScrollArea h={300}>
              <Stack gap={2}>
                {filteredLogs.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="xl">
                    {logs.length === 0 ? 'No logs generated yet' : 'No logs match current filters'}
                  </Text>
                ) : (
                  filteredLogs.slice(-50).map((log, index) => (
                    <div key={index} style={{ 
					  textAlign: "left",
                      fontSize: '11px', 
                      fontFamily: 'monospace',
                      padding: '4px 8px',
                      backgroundColor: index % 2 === 0 ? COLORS.BACKGROUND_DARKER : COLORS.BACKGROUND_DARK,
                      borderRadius: '2px',
                      border: `1px solid ${COLORS.BORDER_LIGHT}`
                    }}>
                      <span style={{ 
                        color: getLevelColor(log.level),
                        fontWeight: 'bold',
                        minWidth: '45px',
                        display: 'inline-block'
                      }}>
                        {log.level.toUpperCase()}
                      </span>
                      <span style={{ 
                        color: COLORS.TEXT_SECONDARY,
                        minWidth: '80px',
                        display: 'inline-block'
                      }}>
                        {log.category}
                      </span>
                      <span style={{ color: COLORS.TEXT_PRIMARY }}>{log.message}</span>
                      {log.data && (
                        <div style={{ 
                          marginLeft: '125px', 
                          color: COLORS.TEXT_MUTED,
                          fontSize: '10px'
                        }}>
                          {JSON.stringify(log.data, null, 0)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </Stack>
            </ScrollArea>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  )
}
