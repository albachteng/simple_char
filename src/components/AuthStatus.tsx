import { useState } from 'react'
import { Group, Button, Text, Menu, Avatar } from '@mantine/core'
import { IconUser, IconLogout, IconLogin } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { AuthModal } from './AuthModal'

export function AuthStatus() {
  const { user, isAuthenticated, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleAuthSuccess = (userData: any, token: string) => {
    // This will be handled by the AuthModal calling useAuth().login
  }

  if (isAuthenticated && user) {
    return (
      <Group gap="sm" align="center">
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button 
              variant="subtle" 
              leftSection={<Avatar size="sm" radius="xl" color="blue">{user.username.charAt(0).toUpperCase()}</Avatar>}
            >
              {user.username}
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item leftSection={<IconUser size={14} />}>
              {user.email}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              leftSection={<IconLogout size={14} />} 
              color="red"
              onClick={logout}
            >
              Sign Out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    )
  }

  return (
    <>
      <Button 
        leftSection={<IconLogin size="1rem" />}
        variant="outline"
        onClick={() => setShowAuthModal(true)}
      >
        Sign In
      </Button>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  )
}