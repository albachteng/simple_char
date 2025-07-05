import { Modal, Text, Button, Group, Stack } from '@mantine/core'

interface OverwriteConfirmModalProps {
  isOpen: boolean
  characterName: string
  onConfirm: () => void
  onCancel: () => void
}

export function OverwriteConfirmModal({ isOpen, characterName, onConfirm, onCancel }: OverwriteConfirmModalProps) {

  return (
    <Modal
      opened={isOpen}
      onClose={onCancel}
      title="Character Already Exists"
      centered
    >
      <Stack gap="md">
        <Text>
          A character named <strong>"{characterName}"</strong> already exists. 
          Do you want to overwrite it with the current character?
        </Text>
        
        <Text size="sm" c="dimmed">
          This action cannot be undone. The existing character data will be permanently replaced.
        </Text>

        <Group justify="flex-end" gap="sm" style={{ marginTop: '16px' }}>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={onConfirm}
          >
            Overwrite Character
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}