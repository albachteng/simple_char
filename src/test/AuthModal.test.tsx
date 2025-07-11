import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
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

  afterEach(() => {
    cleanup()
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
    expect(screen.getByPlaceholderText('Enter your email or username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('should switch to registration mode', () => {
    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    // Find and click the "Create Account" link button
    const createAccountButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(createAccountButton)

    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument()
  })

  it('should validate form in registration mode', async () => {
    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    // Switch to registration
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    // Wait for the form to change to registration mode
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
    })

    // Try to submit without filling fields - find the main Create Account button
    const submitButtons = screen.getAllByRole('button', { name: 'Create Account' })
    const submitButton = submitButtons.find(button => 
      button.closest('form') || button.type === 'submit' || !button.getAttribute('variant')
    ) || submitButtons[0]
    
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument()
    })
  })

  it('should handle successful form submission', async () => {
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

    // Fill login form using placeholders
    fireEvent.change(screen.getByPlaceholderText('Enter your email or username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } })

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

  it('should handle network errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    renderWithProviders(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    // Fill login form
    fireEvent.change(screen.getByPlaceholderText('Enter your email or username'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Network error. Please check your connection.')).toBeInTheDocument()
    })
  })

  it('should not render when closed', () => {
    renderWithProviders(
      <AuthModal
        isOpen={false}
        onClose={mockOnClose}
        onAuthSuccess={mockOnAuthSuccess}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})