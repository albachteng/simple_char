/**
 * Equipment Selector Component
 * UI for selecting equipment from database templates
 */

import { useState, useEffect } from 'react';
import { Modal, Stack, Group, Button, Text, Badge, Loader, Alert, ScrollArea, Card, Title } from '@mantine/core';
import { IconSword, IconShield, IconShirt, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { equipmentService, EquipmentTemplate } from '../services/equipmentService';
import { logger } from '../logger';

interface EquipmentSelectorProps {
  opened: boolean;
  onClose: () => void;
  equipmentType: 'weapon' | 'armor' | 'shield';
  onSelect: (template: EquipmentTemplate) => void;
  characterStats?: {
    str: number;
    dex: number;
    int: number;
  };
}

export function EquipmentSelector({ 
  opened, 
  onClose, 
  equipmentType, 
  onSelect,
  characterStats 
}: EquipmentSelectorProps) {
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      fetchEquipmentTemplates();
    }
  }, [opened, equipmentType]);

  const fetchEquipmentTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      logger.info('Fetching equipment templates', { type: equipmentType });
      
      const result = await equipmentService.getEquipmentTemplatesByType(equipmentType);
      setTemplates(result.templates);
      
      logger.info('Equipment templates loaded successfully', { 
        type: equipmentType, 
        count: result.count 
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load equipment';
      setError(errorMessage);
      logger.error('Failed to fetch equipment templates', { error: errorMessage, type: equipmentType });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (equipmentType) {
      case 'weapon': return <IconSword size="1rem" />;
      case 'armor': return <IconShirt size="1rem" />;
      case 'shield': return <IconShield size="1rem" />;
      default: return null;
    }
  };

  const getTypeColor = () => {
    switch (equipmentType) {
      case 'weapon': return 'red';
      case 'armor': return 'blue';
      case 'shield': return 'green';
      default: return 'gray';
    }
  };

  const canUseEquipment = (template: EquipmentTemplate): boolean => {
    if (!characterStats) return true;
    
    return characterStats.str >= template.str_requirement &&
           characterStats.dex >= template.dex_requirement &&
           characterStats.int >= template.int_requirement;
  };

  const handleSelectTemplate = (template: EquipmentTemplate) => {
    logger.info('Equipment template selected', { 
      name: template.name, 
      type: template.type,
      id: template.id 
    });
    
    onSelect(template);
    onClose();
  };

  const getRequirementText = (template: EquipmentTemplate): string[] => {
    const requirements: string[] = [];
    if (template.str_requirement > 0) requirements.push(`STR ${template.str_requirement}`);
    if (template.dex_requirement > 0) requirements.push(`DEX ${template.dex_requirement}`);
    if (template.int_requirement > 0) requirements.push(`INT ${template.int_requirement}`);
    return requirements;
  };

  const getStatText = (template: EquipmentTemplate): string[] => {
    const stats: string[] = [];
    if (template.base_ac_bonus > 0) stats.push(`+${template.base_ac_bonus} AC`);
    if (template.base_attack_bonus > 0) stats.push(`+${template.base_attack_bonus} Attack`);
    if (template.base_damage_dice) stats.push(`${template.base_damage_dice} damage`);
    return stats;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          {getTypeIcon()}
          <Text fw={500}>Select {equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)}</Text>
        </Group>
      }
      size="lg"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {loading && (
          <Group justify="center" py="xl">
            <Loader size="md" />
            <Text c="dimmed">Loading {equipmentType} templates...</Text>
          </Group>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} color="red" variant="filled">
            <Text fw={500}>Failed to load equipment</Text>
            <Text size="sm">{error}</Text>
            <Button size="xs" variant="white" mt="xs" onClick={fetchEquipmentTemplates}>
              Try Again
            </Button>
          </Alert>
        )}

        {!loading && !error && templates.length === 0 && (
          <Alert icon={<IconAlertCircle size="1rem" />} color="yellow">
            No {equipmentType} templates found
          </Alert>
        )}

        {!loading && !error && templates.length > 0 && (
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Found {templates.length} {equipmentType}{templates.length !== 1 ? 's' : ''} available
            </Text>
            
            {templates.map((template) => {
              const canUse = canUseEquipment(template);
              const requirements = getRequirementText(template);
              const stats = getStatText(template);
              
              return (
                <Card 
                  key={template.id} 
                  withBorder 
                  radius="sm"
                  style={{
                    opacity: canUse ? 1 : 0.6,
                    cursor: canUse ? 'pointer' : 'not-allowed'
                  }}
                  onClick={() => canUse && handleSelectTemplate(template)}
                >
                  <Stack gap="xs">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Group gap="xs" align="center">
                          <Text fw={500}>{template.name}</Text>
                          <Badge 
                            size="xs" 
                            color={getTypeColor()} 
                            variant="light"
                          >
                            {template.subtype}
                          </Badge>
                          {canUse && (
                            <Badge size="xs" color="green" variant="light">
                              <IconCheck size="0.75rem" />
                            </Badge>
                          )}
                        </Group>
                        <Text size="sm" c="dimmed" mt={2}>
                          {template.description}
                        </Text>
                      </div>
                    </Group>

                    {(stats.length > 0 || requirements.length > 0) && (
                      <Group gap="md">
                        {stats.length > 0 && (
                          <Group gap="xs">
                            <Text size="xs" fw={500} c="blue">Stats:</Text>
                            <Text size="xs">{stats.join(', ')}</Text>
                          </Group>
                        )}
                        
                        {requirements.length > 0 && (
                          <Group gap="xs">
                            <Text 
                              size="xs" 
                              fw={500} 
                              c={canUse ? "dimmed" : "red"}
                            >
                              Requires:
                            </Text>
                            <Text 
                              size="xs" 
                              c={canUse ? "dimmed" : "red"}
                            >
                              {requirements.join(', ')}
                            </Text>
                          </Group>
                        )}
                      </Group>
                    )}

                    {!canUse && characterStats && (
                      <Text size="xs" c="red">
                        Character doesn't meet requirements
                      </Text>
                    )}
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}