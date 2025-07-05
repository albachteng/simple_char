import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { CharacterNameEditor } from '../CharacterNameEditor'
import { describe, it, expect, vi } from 'vitest'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

describe('CharacterNameEditor', () => {
  it('should display character name as h1', () => {
    const mockOnNameChange = vi.fn()
    render(
      <TestWrapper>
        <CharacterNameEditor name="Test Hero" onNameChange={mockOnNameChange} />
      </TestWrapper>
    )

    expect(screen.getByText('Test Hero')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('should show "Unnamed Character" when name is empty', () => {
    const mockOnNameChange = vi.fn()
    render(
      <TestWrapper>
        <CharacterNameEditor name="" onNameChange={mockOnNameChange} />
      </TestWrapper>
    )

    expect(screen.getByText('Unnamed Character')).toBeInTheDocument()
  })

  it('should enter edit mode on double click', async () => {
    const user = userEvent.setup()
    const mockOnNameChange = vi.fn()
    render(
      <TestWrapper>
        <CharacterNameEditor name="Test Hero" onNameChange={mockOnNameChange} />
      </TestWrapper>
    )

    const heading = screen.getByText('Test Hero')
    await user.dblClick(heading)

    expect(screen.getByDisplayValue('Test Hero')).toBeInTheDocument()
  })

  it('should save name on Enter key', async () => {
    const user = userEvent.setup()
    const mockOnNameChange = vi.fn()
    render(
      <TestWrapper>
        <CharacterNameEditor name="Old Name" onNameChange={mockOnNameChange} />
      </TestWrapper>
    )

    const heading = screen.getByText('Old Name')
    await user.dblClick(heading)

    const input = screen.getByDisplayValue('Old Name')
    await user.clear(input)
    await user.type(input, 'New Name')
    await user.keyboard('{Enter}')

    expect(mockOnNameChange).toHaveBeenCalledWith('New Name')
  })

  it('should save name on blur', async () => {
    const user = userEvent.setup()
    const mockOnNameChange = vi.fn()
    render(
      <TestWrapper>
        <CharacterNameEditor name="Old Name" onNameChange={mockOnNameChange} />
      </TestWrapper>
    )

    const heading = screen.getByText('Old Name')
    await user.dblClick(heading)

    const input = screen.getByDisplayValue('Old Name')
    await user.clear(input)
    await user.type(input, 'New Name')
    fireEvent.blur(input)

    expect(mockOnNameChange).toHaveBeenCalledWith('New Name')
  })

  it('should cancel edit on Escape key', async () => {
    const user = userEvent.setup()
    const mockOnNameChange = vi.fn()
    render(
      <TestWrapper>
        <CharacterNameEditor name="Original Name" onNameChange={mockOnNameChange} />
      </TestWrapper>
    )

    const heading = screen.getByText('Original Name')
    await user.dblClick(heading)

    const input = screen.getByDisplayValue('Original Name')
    await user.clear(input)
    await user.type(input, 'Changed Name')
    await user.keyboard('{Escape}')

    expect(mockOnNameChange).not.toHaveBeenCalled()
    expect(screen.getByText('Original Name')).toBeInTheDocument()
  })

  it('should not save empty names', async () => {
    const user = userEvent.setup()
    const mockOnNameChange = vi.fn()
    render(
      <TestWrapper>
        <CharacterNameEditor name="Original Name" onNameChange={mockOnNameChange} />
      </TestWrapper>
    )

    const heading = screen.getByText('Original Name')
    await user.dblClick(heading)

    const input = screen.getByDisplayValue('Original Name')
    await user.clear(input)
    await user.keyboard('{Enter}')

    expect(mockOnNameChange).not.toHaveBeenCalled()
  })
})