import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AbilityViewer } from '../AbilityViewer'
import { AbilityManager } from '../abilities/AbilityManager'
import { describe, it, expect } from 'vitest'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

// Default props for testing
const defaultProps = {
  abilities: [],
  str: 10,
  dex: 10,
  int: 10,
  level: 1,
  sorcery_points: 0,
  max_sorcery_points: 0,
  combat_maneuvers: 0,
  max_combat_maneuvers: 0,
  finesse_points: 0,
  max_finesse_points: 0,
  abilityManager: new AbilityManager()
}

describe('AbilityViewer', () => {
  it('should render nothing when no abilities of any kind are available', () => {
    render(
      <TestWrapper>
        <AbilityViewer {...defaultProps} />
      </TestWrapper>
    )

    // Component returns null when no abilities, spellcasting, maneuvers, or finesse
    expect(screen.queryByText('Special Abilities')).not.toBeInTheDocument()
  })

  it('should render racial abilities when provided', () => {
    const abilities = ['Treewalk', 'Lucky']
    
    render(
      <TestWrapper>
        <AbilityViewer {...defaultProps} abilities={abilities} />
      </TestWrapper>
    )

    expect(screen.getByText('Special Abilities')).toBeInTheDocument()
    expect(screen.getByText('Treewalk')).toBeInTheDocument()
    expect(screen.getByText('Lucky')).toBeInTheDocument()
    expect(screen.getByText("In the forests, the elves' movements become almost impossible to follow")).toBeInTheDocument()
    expect(screen.getByText('The smallfolk are implausibly capable, always pulling victory from the jaws of defeat')).toBeInTheDocument()
  })

  it('should show spellcasting section when INT is sufficient and abilities are learned', async () => {
    const abilityManager = new AbilityManager()
    abilityManager.learnAbility('Chill', 'spellword')
    abilityManager.learnAbility('Aura', 'metamagic')
    
    render(
      <TestWrapper>
        <AbilityViewer 
          {...defaultProps} 
          int={14} 
          sorcery_points={3}
          max_sorcery_points={4}
          abilityManager={abilityManager}
        />
      </TestWrapper>
    )

    expect(screen.getByText('Special Abilities')).toBeInTheDocument()
    expect(screen.getByText('Spellcasting')).toBeInTheDocument()
    expect(screen.getByText('3/4')).toBeInTheDocument()
    
    // Check learned abilities are shown
    expect(screen.getByText('Chill')).toBeInTheDocument()
    expect(screen.getByText('Aura')).toBeInTheDocument()
  })

  it('should show combat maneuvers when available and learned', async () => {
    const abilityManager = new AbilityManager()
    abilityManager.learnAbility('Blinding', 'combat_maneuver')
    abilityManager.learnAbility('Cleave', 'combat_maneuver')
    
    render(
      <TestWrapper>
        <AbilityViewer 
          {...defaultProps} 
          str={16} 
          combat_maneuvers={2}
          max_combat_maneuvers={3}
          abilityManager={abilityManager}
        />
      </TestWrapper>
    )

    expect(screen.getByText('Combat Maneuvers')).toBeInTheDocument()
    expect(screen.getByText('2/3')).toBeInTheDocument()
    
    // Check learned abilities are shown
    expect(screen.getByText('Blinding')).toBeInTheDocument()
    expect(screen.getByText('Cleave')).toBeInTheDocument()
    expect(screen.getByText('Strike to temporarily blind opponent')).toBeInTheDocument()
  })

  it('should show finesse abilities when available', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <AbilityViewer 
          {...defaultProps} 
          dex={16} 
          finesse_points={0}
          max_finesse_points={1} 
        />
      </TestWrapper>
    )

    expect(screen.getByText('Finesse Abilities')).toBeInTheDocument()
    expect(screen.getByText('0/1')).toBeInTheDocument()
    
    // Click to expand finesse abilities
    const finesseButton = screen.getByText('Finesse Abilities')
    await user.click(finesseButton)
    
    expect(screen.getByText('Sneak Attack')).toBeInTheDocument()
    expect(screen.getByText('Enhanced Hide')).toBeInTheDocument()
  })

  it('should show multiple ability categories simultaneously', () => {
    const abilityManager = new AbilityManager()
    abilityManager.learnAbility('Chill', 'spellword')
    abilityManager.learnAbility('Blinding', 'combat_maneuver')
    
    render(
      <TestWrapper>
        <AbilityViewer 
          {...defaultProps}
          abilities={['Treewalk']}
          int={14}
          str={16}
          dex={16}
          sorcery_points={3}
          max_sorcery_points={5}
          combat_maneuvers={4}
          max_combat_maneuvers={5}
          finesse_points={1}
          max_finesse_points={1}
          abilityManager={abilityManager}
        />
      </TestWrapper>
    )

    expect(screen.getByText('Racial Abilities')).toBeInTheDocument()
    expect(screen.getByText('Spellcasting')).toBeInTheDocument()
    expect(screen.getByText('Combat Maneuvers')).toBeInTheDocument()
    expect(screen.getByText('Finesse Abilities')).toBeInTheDocument()
    
    // Check badges show correct counts
    expect(screen.getByText('1')).toBeInTheDocument() // racial abilities count
    expect(screen.getByText('3/5')).toBeInTheDocument() // sorcery points
    expect(screen.getByText('4/5')).toBeInTheDocument() // combat maneuvers
    expect(screen.getByText('1/1')).toBeInTheDocument() // finesse points
  })

  it('should handle unknown racial abilities gracefully', () => {
    const abilities = ['Unknown Ability']
    
    render(
      <TestWrapper>
        <AbilityViewer {...defaultProps} abilities={abilities} />
      </TestWrapper>
    )

    expect(screen.getByText('Unknown Ability')).toBeInTheDocument()
    expect(screen.getByText('A special racial ability')).toBeInTheDocument()
  })
})