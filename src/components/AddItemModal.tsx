import { useState, useEffect } from 'react'
import { Paper, Text, Stack, Group, Button, Badge, Modal, ScrollArea, Tabs, Alert, Loader } from '@mantine/core'
import { IconCloudOff, IconCloud, IconSword, IconShield, IconShirt, IconAlertCircle } from '@tabler/icons-react'
import type { InventoryItem, ItemType } from '../../types'
import { BASE_ITEMS, createInventoryItem } from '../inventory/InventoryConstants'
import { equipmentService, EquipmentTemplate } from '../services/equipmentService'
import { useAuth } from '../hooks/useAuth'
import { logger } from '../logger'
import { COLORS, SPACING } from '../theme/constants'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAddItem: (item: InventoryItem) => void
  characterStats?: {
    str: number
    dex: number
    int: number
  }
}

export function AddItemModal({ isOpen, onClose, onAddItem, characterStats }: AddItemModalProps) {
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all')
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('local')
  
  const { isAuthenticated } = useAuth()

  const filteredItems = selectedType === 'all' 
    ? BASE_ITEMS 
    : BASE_ITEMS.filter(item => item.type === selectedType)

  useEffect(() => {
    if (isOpen && activeTab === 'database' && isAuthenticated) {
      fetchDatabaseTemplates()
    }
  }, [isOpen, activeTab, isAuthenticated, selectedType])

  const fetchDatabaseTemplates = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = selectedType === 'all' 
        ? await equipmentService.getEquipmentTemplates()
        : await equipmentService.getEquipmentTemplatesByType(selectedType)
      
      setTemplates(result.templates)
      logger.info('Database templates loaded', { count: result.templates.length, type: selectedType })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load database templates'
      setError(errorMessage)
      logger.error('Failed to fetch database templates', { error: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleAddLocalItem = (baseItem: typeof BASE_ITEMS[0]) => {
    const newItem = createInventoryItem(baseItem)
    onAddItem(newItem)
    onClose()
  }

  const handleAddDatabaseItem = (template: EquipmentTemplate) => {
    // Convert database template to inventory item
    const newItem: InventoryItem = {
      id: `template_${template.id}_${Date.now()}`,
      name: template.name,
      type: template.type as ItemType,
      subtype: template.subtype,
      description: template.description,
      equipped: false,
      enchantmentLevel: 0,
      enchantment: 0,
      ac_bonus: template.base_ac_bonus,
      attack_bonus: template.base_attack_bonus,
      damage_dice: template.base_damage_dice || undefined,
      str_bonus: 0,
      dex_bonus: 0,
      int_bonus: 0,
      str_requirement: template.str_requirement,
      dex_requirement: template.dex_requirement,
      int_requirement: template.int_requirement,
      valid_slots: template.valid_slots,
      conflicts_with: template.conflicts_with,
      source: 'database',
      template_id: template.id,
      // Map template type to existing weapon/armor types for compatibility
      weaponType: template.type === 'weapon' ? template.subtype as any : undefined,
      armorType: template.type === 'armor' ? template.subtype as any : undefined,
      isShield: template.type === 'shield'
    }
    
    logger.info('Adding database template as inventory item', { 
      templateId: template.id, 
      name: template.name,
      type: template.type
    })
    
    onAddItem(newItem)
    onClose()
  }

  const canUseTemplate = (template: EquipmentTemplate): boolean => {
    if (!characterStats) return true
    
    return characterStats.str >= template.str_requirement &&
           characterStats.dex >= template.dex_requirement &&
           characterStats.int >= template.int_requirement
  }

  const getRequirementText = (template: EquipmentTemplate): string[] => {
    const requirements: string[] = []
    if (template.str_requirement > 0) requirements.push(`STR ${template.str_requirement}`)
    if (template.dex_requirement > 0) requirements.push(`DEX ${template.dex_requirement}`)
    if (template.int_requirement > 0) requirements.push(`INT ${template.int_requirement}`)
    return requirements
  }

  const getStatText = (template: EquipmentTemplate): string[] => {
    const stats: string[] = []
    if (template.base_ac_bonus > 0) stats.push(`+${template.base_ac_bonus} AC`)
    if (template.base_attack_bonus > 0) stats.push(`+${template.base_attack_bonus} Attack`)
    if (template.base_damage_dice) stats.push(`${template.base_damage_dice} damage`)
    return stats
  }

  return (
    <Modal opened={isOpen} onClose={onClose} title="Add Item to Inventory" size="lg">
      <Stack gap="md">
        {/* Equipment Type Filter */}
        <Group gap="xs">
          <Button 
            variant={selectedType === 'all' ? 'filled' : 'outline'}
            size="xs"
            onClick={() => setSelectedType('all')}
          >
            All
          </Button>
          <Button 
            variant={selectedType === 'weapon' ? 'filled' : 'outline'}
            size="xs"
            onClick={() => setSelectedType('weapon')}
          >
            Weapons
          </Button>
          <Button 
            variant={selectedType === 'armor' ? 'filled' : 'outline'}
            size="xs"
            onClick={() => setSelectedType('armor')}
          >
            Armor
          </Button>
          <Button 
            variant={selectedType === 'shield' ? 'filled' : 'outline'}
            size="xs"
            onClick={() => setSelectedType('shield')}
          >
            Shields
          </Button>
        </Group>

        {/* Source Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="local" leftSection={<IconCloudOff size="0.8rem" />}>
              Local Items
            </Tabs.Tab>
            {isAuthenticated && (
              <Tabs.Tab value="database" leftSection={<IconCloud size="0.8rem" />}>
                Database Templates
              </Tabs.Tab>
            )}
          </Tabs.List>

          {/* Local Items Tab */}
          <Tabs.Panel value="local" pt="md">
            <ScrollArea h={400}>
              <Stack gap="xs">
                {filteredItems.map((item, index) => (
                  <Paper 
                    key={index} 
                    p={SPACING.SM} 
                    withBorder
                    style={{ 
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_LIGHT
                    }}
                  >
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Text fw={600} c={COLORS.TEXT_PRIMARY}>{item.name}</Text>
                          <Badge size="xs" color={
                            item.type === 'weapon' ? 'red' :
                            item.type === 'armor' ? 'blue' :
                            item.type === 'shield' ? 'green' : 'gray'
                          }>
                            {item.type}
                          </Badge>
                          <Badge size="xs" variant="outline" color="gray">
                            Local
                          </Badge>
                        </Group>
                        {item.description && (
                          <Text size="sm" c={COLORS.TEXT_SECONDARY}>{item.description}</Text>
                        )}
                      </Stack>
                      <Button size="xs" onClick={() => handleAddLocalItem(item)}>
                        Add
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Tabs.Panel>

          {/* Database Templates Tab */}
          {isAuthenticated && (
            <Tabs.Panel value="database" pt="md">
              {loading && (
                <Group justify="center" py="xl">
                  <Loader size="md" />
                  <Text c="dimmed">Loading database templates...</Text>
                </Group>
              )}

              {error && (
                <Alert icon={<IconAlertCircle size="1rem" />} color="red" mb="md">
                  <Text fw={500}>Failed to load templates</Text>
                  <Text size="sm">{error}</Text>
                  <Button size="xs" variant="white" mt="xs" onClick={fetchDatabaseTemplates}>
                    Try Again
                  </Button>
                </Alert>
              )}

              {!loading && !error && (
                <ScrollArea h={400}>
                  <Stack gap="xs">
                    {templates.length === 0 ? (
                      <Text c="dimmed" ta="center" py="xl">
                        No database templates found for {selectedType === 'all' ? 'any type' : selectedType}
                      </Text>
                    ) : (
                      templates.map((template) => {
                        const canUse = canUseTemplate(template)
                        const requirements = getRequirementText(template)
                        const stats = getStatText(template)
                        
                        return (
                          <Paper 
                            key={template.id} 
                            p={SPACING.SM} 
                            withBorder
                            style={{
                              opacity: canUse ? 1 : 0.6,
                              backgroundColor: COLORS.BACKGROUND_DARK,
                              borderColor: COLORS.BORDER_LIGHT
                            }}
                          >
                            <Group justify="space-between" align="flex-start">
                              <Stack gap="xs" style={{ flex: 1 }}>
                                <Group gap="xs">
                                  <Text fw={600} c={COLORS.TEXT_PRIMARY}>{template.name}</Text>
                                  <Badge size="xs" color={
                                    template.type === 'weapon' ? 'red' :
                                    template.type === 'armor' ? 'blue' :
                                    template.type === 'shield' ? 'green' : 'gray'
                                  }>
                                    {template.subtype}
                                  </Badge>
                                  <Badge size="xs" variant="outline" color="blue">
                                    Database
                                  </Badge>
                                </Group>
                                
                                <Text size="sm" c={COLORS.TEXT_SECONDARY}>
                                  {template.description}
                                </Text>

                                {(stats.length > 0 || requirements.length > 0) && (
                                  <Group gap="md">
                                    {stats.length > 0 && (
                                      <Group gap="xs">
                                        <Text size="xs" fw={500} c={COLORS.INFO}>Stats:</Text>
                                        <Text size="xs" c={COLORS.TEXT_SECONDARY}>{stats.join(', ')}</Text>
                                      </Group>
                                    )}
                                    
                                    {requirements.length > 0 && (
                                      <Group gap="xs">
                                        <Text size="xs" fw={500} c={canUse ? COLORS.TEXT_MUTED : COLORS.ERROR}>
                                          Requires:
                                        </Text>
                                        <Text size="xs" c={canUse ? COLORS.TEXT_MUTED : COLORS.ERROR}>
                                          {requirements.join(', ')}
                                        </Text>
                                      </Group>
                                    )}
                                  </Group>
                                )}

                                {!canUse && characterStats && (
                                  <Text size="xs" c={COLORS.ERROR}>
                                    Character doesn't meet requirements
                                  </Text>
                                )}
                              </Stack>
                              
                              <Button 
                                size="xs" 
                                onClick={() => handleAddDatabaseItem(template)}
                                disabled={!canUse}
                              >
                                Add
                              </Button>
                            </Group>
                          </Paper>
                        )
                      })
                    )}
                  </Stack>
                </ScrollArea>
              )}
            </Tabs.Panel>
          )}
        </Tabs>

        {!isAuthenticated && (
          <Alert icon={<IconAlertCircle size="1rem" />} color="blue" variant="light">
            <Text fw={500}>Database Templates Available</Text>
            <Text size="sm">Sign in to access enhanced equipment templates from the database with detailed stats and requirements.</Text>
          </Alert>
        )}
      </Stack>
    </Modal>
  )
}