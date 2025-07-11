import { useState } from 'react'
import { Group, Button, Text, Badge, Modal, Stack, Alert } from '@mantine/core'
import { IconCloud, IconDeviceDesktop, IconCloudUpload, IconInfoCircle } from '@tabler/icons-react'
import { useStorage } from '../hooks/useStorage'
import { useAuth } from '../hooks/useAuth'

export function StorageStatus() {
  const { isUsingDatabase, syncLocalToDatabase, isLoading } = useStorage()
  const { isAuthenticated } = useAuth()
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')

  const handleSyncToDatabase = async () => {
    setSyncStatus('syncing')
    try {
      await syncLocalToDatabase()
      setSyncStatus('success')
      setTimeout(() => {
        setSyncStatus('idle')
        setShowSyncModal(false)
      }, 2000)
    } catch (error) {
      setSyncStatus('error')
    }
  }

  return (
    <>
      <Group gap="xs" align="center">
        <Text size="sm" c="dimmed">Storage:</Text>
        
        <Badge
          variant="light"
          color={isUsingDatabase ? 'blue' : 'gray'}
          leftSection={isUsingDatabase ? <IconCloud size="0.75rem" /> : <IconDeviceDesktop size="0.75rem" />}
        >
          {isUsingDatabase ? 'Database' : 'Local Only'}
        </Badge>

        {!isUsingDatabase && isAuthenticated && (
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconCloudUpload size="0.875rem" />}
            onClick={() => setShowSyncModal(true)}
            disabled={isLoading}
          >
            Sync to Database
          </Button>
        )}
      </Group>

      <Modal
        opened={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        title="Sync Characters to Database"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            This will upload all your local characters to the database. 
            Your local characters will remain as backups.
          </Alert>

          {syncStatus === 'success' && (
            <Alert color="green">
              ✅ Characters synced successfully!
            </Alert>
          )}

          {syncStatus === 'error' && (
            <Alert color="red">
              ❌ Sync failed. Please try again.
            </Alert>
          )}

          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setShowSyncModal(false)}
              disabled={syncStatus === 'syncing'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSyncToDatabase}
              loading={syncStatus === 'syncing'}
              disabled={syncStatus === 'success'}
            >
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Characters'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}