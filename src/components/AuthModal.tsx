import { useState } from 'react'
import { Modal, Text, Button, Group, Stack, TextInput, PasswordInput, Alert, LoadingOverlay } from '@mantine/core'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess?: (user: any, token: string) => void
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', confirmPassword: '' })
    setError(null)
    setSuccess(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    resetForm()
  }

  const validateForm = () => {
    if (mode === 'register') {
      if (!formData.username.trim()) {
        setError('Username is required')
        return false
      }
      if (formData.username.length < 3) {
        setError('Username must be at least 3 characters long')
        return false
      }
      if (!formData.email.trim()) {
        setError('Email is required')
        return false
      }
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }
    
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    
    if (mode === 'register' && formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const body = mode === 'register' 
        ? { username: formData.username, email: formData.email, password: formData.password }
        : { emailOrUsername: formData.username || formData.email, password: formData.password }

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(mode === 'register' ? 'Account created successfully!' : 'Login successful!')
        login(data.data.user, data.data.token)
        if (onAuthSuccess) {
          onAuthSuccess(data.data.user, data.data.token)
        }
        setTimeout(() => {
          handleClose()
        }, 1000)
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch (err) {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title={mode === 'register' ? 'Create Account' : 'Sign In'}
      centered
      size="sm"
    >
      <Stack gap="md" pos="relative">
        <LoadingOverlay visible={loading} />
        
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} color="red" title="Error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert icon={<IconCheck size="1rem" />} color="green" title="Success">
            {success}
          </Alert>
        )}

        <Stack gap="sm">
          {mode === 'register' && (
            <TextInput
              label="Username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              onKeyPress={handleKeyPress}
              disabled={loading}
              required
            />
          )}

          <TextInput
            label={mode === 'register' ? 'Email' : 'Email or Username'}
            placeholder={mode === 'register' ? 'Enter your email' : 'Enter your email or username'}
            value={mode === 'register' ? formData.email : formData.username}
            onChange={(e) => setFormData(prev => 
              mode === 'register' 
                ? ({ ...prev, email: e.target.value })
                : ({ ...prev, username: e.target.value })
            )}
            onKeyPress={handleKeyPress}
            disabled={loading}
            required
          />

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            onKeyPress={handleKeyPress}
            disabled={loading}
            required
          />

          {mode === 'register' && (
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              onKeyPress={handleKeyPress}
              disabled={loading}
              required
            />
          )}
        </Stack>

        {mode === 'register' && (
          <Text size="xs" c="dimmed">
            Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.
          </Text>
        )}

        <Stack gap="sm">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          >
            {mode === 'register' ? 'Create Account' : 'Sign In'}
          </Button>

          <Group justify="center">
            <Text size="sm" c="dimmed">
              {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <Button variant="subtle" size="sm" onClick={switchMode} disabled={loading}>
              {mode === 'register' ? 'Sign In' : 'Create Account'}
            </Button>
          </Group>
        </Stack>
      </Stack>
    </Modal>
  )
}