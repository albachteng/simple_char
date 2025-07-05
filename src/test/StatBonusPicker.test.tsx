import { render, screen, fireEvent } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { StatBonusPicker } from '../StatBonusPicker'
import { describe, it, expect, vi } from 'vitest'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

describe('StatBonusPicker', () => {
  it('should render bonus selection options', () => {
    const mockSetter = vi.fn()
    render(
      <TestWrapper>
        <StatBonusPicker setter={mockSetter} bonusAmount={2} bonusNumber={1} />
      </TestWrapper>
    )

    expect(screen.getByText('Choose Stat for Bonus #1')).toBeInTheDocument()
    expect(screen.getByText('Apply +2 to which stat?')).toBeInTheDocument()
    expect(screen.getByText('STR (+2)')).toBeInTheDocument()
    expect(screen.getByText('DEX (+2)')).toBeInTheDocument()
    expect(screen.getByText('INT (+2)')).toBeInTheDocument()
  })

  it('should call setter when stat is selected', () => {
    const mockSetter = vi.fn()
    render(
      <TestWrapper>
        <StatBonusPicker setter={mockSetter} bonusAmount={1} bonusNumber={2} />
      </TestWrapper>
    )

    fireEvent.click(screen.getByText('STR (+1)'))
    expect(mockSetter).toHaveBeenCalledWith('str')

    fireEvent.click(screen.getByText('DEX (+1)'))
    expect(mockSetter).toHaveBeenCalledWith('dex')

    fireEvent.click(screen.getByText('INT (+1)'))
    expect(mockSetter).toHaveBeenCalledWith('int')
  })

  it('should display correct bonus number', () => {
    const mockSetter = vi.fn()
    render(
      <TestWrapper>
        <StatBonusPicker setter={mockSetter} bonusAmount={3} bonusNumber={3} />
      </TestWrapper>
    )

    expect(screen.getByText('Choose Stat for Bonus #3')).toBeInTheDocument()
    expect(screen.getByText('Apply +3 to which stat?')).toBeInTheDocument()
  })
})