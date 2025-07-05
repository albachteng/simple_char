import { useState, useEffect } from 'react'
import { Button, Paper, Text, ScrollArea, Group, Stack, Collapse, ActionIcon } from '@mantine/core'
import { logger, type LogEntry, type LogLevel } from './logger'
import { CustomSelect } from './CustomSelect'

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isOpen, setIsOpen] = useState(true)

  const refreshLogs = () => {
    setLogs(logger.getLogs())
  }

  const clearLogs = () => {
    logger.clearLogs()
    setLogs([])
  }

  // Auto-refresh logs every second to catch new entries
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(logger.getLogs())
    }, 1000)

    // Initial load
    setLogs(logger.getLogs())

    return () => clearInterval(interval)
  }, [])

  // Filter logs based on selected level and category
  const filteredLogs = logs.filter(log => {
    const levelMatch = selectedLevel === 'all' || log.level === selectedLevel
    const categoryMatch = selectedCategory === 'all' || log.category === selectedCategory
    return levelMatch && categoryMatch
  })

  // Get unique categories from logs
  const categories = ['all', ...new Set(logs.map(log => log.category))]

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'debug': return '#888'
      case 'info': return '#4a9eff'
      case 'warn': return '#ffb347'
      case 'error': return '#ff6b6b'
      default: return '#888'
    }
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group>
            <Text size="lg" fw={600}>Game Log</Text>
            <Text size="xs" c="dimmed">({filteredLogs.length} entries)</Text>
          </Group>
          <Group>
            <Button size="xs" variant="light" onClick={refreshLogs}>↻</Button>
            <Button size="xs" variant="light" color="red" onClick={clearLogs}>Clear</Button>
            <ActionIcon 
              size="sm" 
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
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
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
                      fontSize: '11px', 
                      fontFamily: 'monospace',
                      padding: '4px 8px',
                      backgroundColor: index % 2 === 0 ? '#333' : '#2a2a2a',
                      borderRadius: '2px',
                      border: '1px solid #444'
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
                        color: '#bbb',
                        minWidth: '80px',
                        display: 'inline-block'
                      }}>
                        {log.category}
                      </span>
                      <span style={{ color: '#e0e0e0' }}>{log.message}</span>
                      {log.data && (
                        <div style={{ 
                          marginLeft: '125px', 
                          color: '#aaa',
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
