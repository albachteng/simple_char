import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { AuthModal } from '../components/AuthModal'
import { AuthProvider } from '../hooks/useAuth'

// Mock fetch globally
global.fetch = vi.fn()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <AuthProvider>
        {component}
      </AuthProvider>
    </MantineProvider>
  )
}

describe('AuthModal', () => {
  const mockOnClose = vi.fn()
  const mockOnAuthSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockClear()
  })

  it('should render login form by default', () => {
    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Email or Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })

  it('should switch to registration mode', () => {
    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })

  it('should validate form fields in registration mode', async () => {
    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    // Switch to registration
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    // Try to submit without filling fields
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument()
    })
  })

  it('should handle password mismatch in registration', async () => {
    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    // Switch to registration
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    // Fill form with mismatched passwords
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'differentpassword' } })

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('should handle successful registration', async () => {
    const mockResponse = {
      success: true,
      data: {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        token: 'mock-token'
      }
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
      ok: true
    } as Response)

    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    // Switch to registration
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    // Fill valid form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'TestPassword123@' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'TestPassword123@' } })

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(screen.getByText('Account created successfully!')).toBeInTheDocument()
    })

    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123@'
      })
    })
  })

  it('should handle login', async () => {
    const mockResponse = {
      success: true,
      data: {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        token: 'mock-token'
      }
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
      ok: true
    } as Response)

    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    // Fill login form
    fireEvent.change(screen.getByLabelText('Email or Username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Login successful!')).toBeInTheDocument()
    })

    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: 'testuser',
        password: 'password123'
      })
    })
  })

  it('should handle authentication errors', async () => {
    const mockResponse = {
      success: false,
      error: 'Invalid credentials'
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
      ok: false
    } as Response)

    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    // Fill login form
    fireEvent.change(screen.getByLabelText('Email or Username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } })

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    // Fill login form
    fireEvent.change(screen.getByLabelText('Email or Username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Network error. Please check your connection.')).toBeInTheDocument()
    })
  })
})