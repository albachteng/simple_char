import { render, screen, fireEvent } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { RacePicker } from '../RacePicker'
import { describe, it, expect, vi } from 'vitest'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

describe('RacePicker', () => {
  it('should render all race options', () => {
    const mockSetter = vi.fn()
    render(
      <TestWrapper>
        <RacePicker setter={mockSetter} />
      </TestWrapper>
    )

    expect(screen.getByText('Choose Your Race')).toBeInTheDocument()
    expect(screen.getByText('Elf')).toBeInTheDocument()
    expect(screen.getByText('Gnome')).toBeInTheDocument()
    expect(screen.getByText('Human')).toBeInTheDocument()
    expect(screen.getByText('Dwarf')).toBeInTheDocument()
    expect(screen.getByText('Dragonborn')).toBeInTheDocument()
    expect(screen.getByText('Halfling')).toBeInTheDocument()
  })

  it('should display race bonuses and abilities', () => {
    const mockSetter = vi.fn()
    render(
      <TestWrapper>
        <RacePicker setter={mockSetter} />
      </TestWrapper>
    )

    // Check that bonus descriptions are shown
    expect(screen.getByText(/Bonuses:/)).toBeInTheDocument()
    expect(screen.getByText(/Ability:/)).toBeInTheDocument()
  })

  it('should call setter when race is selected', () => {
    const mockSetter = vi.fn()
    render(
      <TestWrapper>
        <RacePicker setter={mockSetter} />
      </TestWrapper>
    )

    fireEvent.click(screen.getByText('Elf'))
    expect(mockSetter).toHaveBeenCalledWith('elf')
  })
})