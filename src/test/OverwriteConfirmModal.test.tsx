import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { OverwriteConfirmModal } from '../OverwriteConfirmModal'
import { describe, it, expect, vi } from 'vitest'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

describe('OverwriteConfirmModal', () => {
  it('should not render when closed', () => {
    const mockOnConfirm = vi.fn()
    const mockOnCancel = vi.fn()
    
    render(
      <TestWrapper>
        <OverwriteConfirmModal
          isOpen={false}
          characterName="Test Character"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    )

    expect(screen.queryByText('Character Already Exists')).not.toBeInTheDocument()
  })

  it('should render when open with character name', () => {
    const mockOnConfirm = vi.fn()
    const mockOnCancel = vi.fn()
    
    render(
      <TestWrapper>
        <OverwriteConfirmModal
          isOpen={true}
          characterName="Test Character"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    )

    expect(screen.getByText('Character Already Exists')).toBeInTheDocument()
    expect(screen.getByText(/"Test Character"/)).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Overwrite Character')).toBeInTheDocument()
  })

  it('should call onConfirm when overwrite button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnConfirm = vi.fn()
    const mockOnCancel = vi.fn()
    
    render(
      <TestWrapper>
        <OverwriteConfirmModal
          isOpen={true}
          characterName="Test Character"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    )

    const overwriteButton = screen.getByText('Overwrite Character')
    await user.click(overwriteButton)

    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnConfirm = vi.fn()
    const mockOnCancel = vi.fn()
    
    render(
      <TestWrapper>
        <OverwriteConfirmModal
          isOpen={true}
          characterName="Test Character"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    )

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should display warning about permanent replacement', () => {
    const mockOnConfirm = vi.fn()
    const mockOnCancel = vi.fn()
    
    render(
      <TestWrapper>
        <OverwriteConfirmModal
          isOpen={true}
          characterName="Test Character"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    )

    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument()
    expect(screen.getByText(/permanently replaced/)).toBeInTheDocument()
  })
})