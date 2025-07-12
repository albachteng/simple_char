import React from 'react'
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { AuthProvider } from '../hooks/useAuth'

// Mock authentication context for testing
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  token: null,
  login: async () => ({ success: true, message: '', user: null }),
  register: async () => ({ success: true, message: '', user: null }),
  logout: () => {},
  loading: false
}

interface TestProvidersProps {
  children: React.ReactNode
  authValues?: Partial<typeof mockAuthContext>
}

export function TestProviders({ children, authValues }: TestProvidersProps) {
  const contextValue = { ...mockAuthContext, ...authValues }
  
  return (
    <MantineProvider>
      <AuthProvider value={contextValue as any}>
        {children}
      </AuthProvider>
    </MantineProvider>
  )
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    authValues?: Partial<typeof mockAuthContext>
  }
) {
  return render(
    <TestProviders authValues={options?.authValues}>
      {ui}
    </TestProviders>
  )
}