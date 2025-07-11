import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { AuthProvider } from '../hooks/useAuth'
import { StorageProvider, useStorage } from '../hooks/useStorage'
import { StorageStatus } from '../components/StorageModeSelector'

// Mock fetch globally
global.fetch = vi.fn()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <AuthProvider>
        <StorageProvider>
          {component}
        </StorageProvider>
      </AuthProvider>
    </MantineProvider>
  )
}

// Test component to access storage hooks
function TestStorageComponent() {
  const { isUsingDatabase } = useStorage()
  return (
    <div>
      <span data-testid="storage-mode">
        {isUsingDatabase ? 'database' : 'local'}
      </span>
      <StorageStatus />
    </div>
  )
}

describe('Storage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockClear()
    // Clear any existing auth tokens
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  })

  afterEach(() => {
    cleanup()
  })

  it('should use local storage when not authenticated', () => {
    renderWithProviders(<TestStorageComponent />)

    expect(screen.getByTestId('storage-mode')).toHaveTextContent('local')
    expect(screen.getByText('Local Only')).toBeInTheDocument()
  })

  it('should show storage status component', () => {
    renderWithProviders(<TestStorageComponent />)

    expect(screen.getByText('Storage:')).toBeInTheDocument()
    expect(screen.getByText('Local Only')).toBeInTheDocument()
  })

  it('should render storage status without authentication', () => {
    renderWithProviders(<StorageStatus />)

    // Should render without errors and show local storage status
    expect(screen.getByText('Storage:')).toBeInTheDocument()
    expect(screen.getByText('Local Only')).toBeInTheDocument()
  })
})