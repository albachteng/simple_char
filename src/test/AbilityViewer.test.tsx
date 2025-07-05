import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { AbilityViewer } from '../AbilityViewer'
import { describe, it, expect } from 'vitest'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

describe('AbilityViewer', () => {
  it('should render nothing when no abilities are provided', () => {
    const { container } = render(
      <TestWrapper>
        <AbilityViewer abilities={[]} />
      </TestWrapper>
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render abilities when provided', () => {
    const abilities = [
      'Dark Vision: See in darkness up to 60 feet',
      'Keen Senses: Advantage on Perception checks'
    ]
    
    render(
      <TestWrapper>
        <AbilityViewer abilities={abilities} />
      </TestWrapper>
    )

    expect(screen.getByText('Special Abilities')).toBeInTheDocument()
    expect(screen.getByText('Dark Vision: See in darkness up to 60 feet')).toBeInTheDocument()
    expect(screen.getByText('Keen Senses: Advantage on Perception checks')).toBeInTheDocument()
  })

  it('should render single ability correctly', () => {
    const abilities = ['Fire Resistance: Resist fire damage']
    
    render(
      <TestWrapper>
        <AbilityViewer abilities={abilities} />
      </TestWrapper>
    )

    expect(screen.getByText('Special Abilities')).toBeInTheDocument()
    expect(screen.getByText('Fire Resistance: Resist fire damage')).toBeInTheDocument()
  })
})