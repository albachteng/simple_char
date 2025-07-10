import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider, Accordion } from '@mantine/core';
import { SpellcastingSection } from '../components/SpellcastingSection';
import { CombatManeuversSection } from '../components/CombatManeuversSection';
import { CombatActions } from '../CombatActions';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

const AccordionTestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <Accordion multiple defaultValue={['spellcasting', 'combat']}>
      {children}
    </Accordion>
  </MantineProvider>
);

// Mock character for CombatActions
const mockChar = {
  inventory: {
    getEquippedWeapons: () => ({
      mainHand: {
        id: '1',
        name: 'Iron Sword',
        weaponType: 'one-hand',
        enchantmentLevel: 0
      },
      offHand: null
    })
  },
  getEffectiveStats: () => ({ str: 16, dex: 14, int: 12 }),
  lvl: 3,
  mainHandAttackRoll: () => 15,
  offHandAttackRoll: () => 12,
  mainHandDamageRoll: () => 8,
  offHandDamageRoll: () => 5,
  getNotes: () => '',
  updateNotes: () => {}
} as any;

describe('SpellcastingSection Resource Consumption', () => {
  it('renders cast spell button when spendSorceryPoint is provided', () => {
    const mockSpendSorceryPoint = vi.fn();
    const mockOnForgetAbility = vi.fn();

    render(
      <AccordionTestWrapper>
        <SpellcastingSection
          int={15}
          sorcery_points={3}
          max_sorcery_points={5}
          learnedSpellwords={[]}
          learnedMetamagic={[]}
          onForgetAbility={mockOnForgetAbility}
          spendSorceryPoint={mockSpendSorceryPoint}
        />
      </AccordionTestWrapper>
    );

    expect(screen.getByText(/Cast a Spell \(Spend 1 Sorcery Point\)/)).toBeInTheDocument();
  });

  it('calls spendSorceryPoint when cast spell button is clicked', () => {
    const mockSpendSorceryPoint = vi.fn().mockReturnValue(true);
    const mockOnForgetAbility = vi.fn();

    render(
      <AccordionTestWrapper>
        <SpellcastingSection
          int={15}
          sorcery_points={3}
          max_sorcery_points={5}
          learnedSpellwords={[]}
          learnedMetamagic={[]}
          onForgetAbility={mockOnForgetAbility}
          spendSorceryPoint={mockSpendSorceryPoint}
        />
      </AccordionTestWrapper>
    );

    const castButton = screen.getByText(/Cast a Spell \(Spend 1 Sorcery Point\)/);
    fireEvent.click(castButton);

    expect(mockSpendSorceryPoint).toHaveBeenCalledTimes(1);
  });

  it('disables cast spell button when no sorcery points available', () => {
    const mockSpendSorceryPoint = vi.fn();
    const mockOnForgetAbility = vi.fn();

    render(
      <AccordionTestWrapper>
        <SpellcastingSection
          int={15}
          sorcery_points={0}
          max_sorcery_points={5}
          learnedSpellwords={[]}
          learnedMetamagic={[]}
          onForgetAbility={mockOnForgetAbility}
          spendSorceryPoint={mockSpendSorceryPoint}
        />
      </AccordionTestWrapper>
    );

    const castButton = screen.getByText(/Cast a Spell \(Spend 1 Sorcery Point\)/).closest('button');
    expect(castButton).toBeDisabled();
  });

  it('does not render cast spell button when spendSorceryPoint is not provided', () => {
    const mockOnForgetAbility = vi.fn();

    render(
      <AccordionTestWrapper>
        <SpellcastingSection
          int={15}
          sorcery_points={3}
          max_sorcery_points={5}
          learnedSpellwords={[]}
          learnedMetamagic={[]}
          onForgetAbility={mockOnForgetAbility}
        />
      </AccordionTestWrapper>
    );

    expect(screen.queryByText(/Cast a Spell/)).not.toBeInTheDocument();
  });
});

describe('CombatManeuversSection Resource Consumption', () => {
  it('renders combat maneuver button when spendCombatManeuverPoint is provided', () => {
    const mockSpendCombatManeuverPoint = vi.fn();
    const mockOnForgetAbility = vi.fn();

    render(
      <AccordionTestWrapper>
        <CombatManeuversSection
          str={16}
          combat_maneuvers={2}
          max_combat_maneuvers={3}
          learnedManeuvers={[]}
          onForgetAbility={mockOnForgetAbility}
          spendCombatManeuverPoint={mockSpendCombatManeuverPoint}
        />
      </AccordionTestWrapper>
    );

    expect(screen.getByText(/Use Combat Maneuver \(Spend 1 Use\)/)).toBeInTheDocument();
  });

  it('calls spendCombatManeuverPoint when button is clicked', () => {
    const mockSpendCombatManeuverPoint = vi.fn().mockReturnValue(true);
    const mockOnForgetAbility = vi.fn();

    render(
      <AccordionTestWrapper>
        <CombatManeuversSection
          str={16}
          combat_maneuvers={2}
          max_combat_maneuvers={3}
          learnedManeuvers={[]}
          onForgetAbility={mockOnForgetAbility}
          spendCombatManeuverPoint={mockSpendCombatManeuverPoint}
        />
      </AccordionTestWrapper>
    );

    const maneuverButton = screen.getByText(/Use Combat Maneuver \(Spend 1 Use\)/);
    fireEvent.click(maneuverButton);

    expect(mockSpendCombatManeuverPoint).toHaveBeenCalledTimes(1);
  });

  it('disables combat maneuver button when no uses available', () => {
    const mockSpendCombatManeuverPoint = vi.fn();
    const mockOnForgetAbility = vi.fn();

    render(
      <AccordionTestWrapper>
        <CombatManeuversSection
          str={16}
          combat_maneuvers={0}
          max_combat_maneuvers={3}
          learnedManeuvers={[]}
          onForgetAbility={mockOnForgetAbility}
          spendCombatManeuverPoint={mockSpendCombatManeuverPoint}
        />
      </AccordionTestWrapper>
    );

    const maneuverButton = screen.getByText(/Use Combat Maneuver \(Spend 1 Use\)/).closest('button');
    expect(maneuverButton).toBeDisabled();
  });

  it('does not render combat maneuver button when spendCombatManeuverPoint is not provided', () => {
    const mockOnForgetAbility = vi.fn();

    render(
      <AccordionTestWrapper>
        <CombatManeuversSection
          str={16}
          combat_maneuvers={2}
          max_combat_maneuvers={3}
          learnedManeuvers={[]}
          onForgetAbility={mockOnForgetAbility}
        />
      </AccordionTestWrapper>
    );

    expect(screen.queryByText(/Use Combat Maneuver/)).not.toBeInTheDocument();
  });
});

describe('CombatActions Resource Consumption', () => {
  const defaultProps = {
    char: mockChar,
    sneakAttackMainHand: vi.fn(() => ({ result: 10, breakdown: 'test' })),
    sneakAttackOffHand: vi.fn(() => ({ result: 8, breakdown: 'test' })),
    assassinationMainHand: vi.fn(() => ({ result: 20, breakdown: 'test' })),
    assassinationOffHand: vi.fn(() => ({ result: 16, breakdown: 'test' })),
    canPerformFinesseAttacks: vi.fn(() => true),
    rest: vi.fn(),
    finesse_points: 2
  };

  it('renders sorcery point consumption button when provided', () => {
    const mockSpendSorceryPoint = vi.fn();

    render(
      <TestWrapper>
        <CombatActions
          {...defaultProps}
          spendSorceryPoint={mockSpendSorceryPoint}
          sorcery_points={3}
          max_sorcery_points={5}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Cast Spell \(3\/5\)/)).toBeInTheDocument();
  });

  it('renders combat maneuver consumption button when provided', () => {
    const mockSpendCombatManeuverPoint = vi.fn();

    render(
      <TestWrapper>
        <CombatActions
          {...defaultProps}
          spendCombatManeuverPoint={mockSpendCombatManeuverPoint}
          combat_maneuvers={2}
          max_combat_maneuvers={3}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Combat Maneuver \(2\/3\)/)).toBeInTheDocument();
  });

  it('calls spendSorceryPoint when cast spell button is clicked', () => {
    const mockSpendSorceryPoint = vi.fn().mockReturnValue(true);

    render(
      <TestWrapper>
        <CombatActions
          {...defaultProps}
          spendSorceryPoint={mockSpendSorceryPoint}
          sorcery_points={3}
          max_sorcery_points={5}
        />
      </TestWrapper>
    );

    const castButton = screen.getByText(/Cast Spell \(3\/5\)/);
    fireEvent.click(castButton);

    expect(mockSpendSorceryPoint).toHaveBeenCalledTimes(1);
  });

  it('calls spendCombatManeuverPoint when combat maneuver button is clicked', () => {
    const mockSpendCombatManeuverPoint = vi.fn().mockReturnValue(true);

    render(
      <TestWrapper>
        <CombatActions
          {...defaultProps}
          spendCombatManeuverPoint={mockSpendCombatManeuverPoint}
          combat_maneuvers={2}
          max_combat_maneuvers={3}
        />
      </TestWrapper>
    );

    const maneuverButton = screen.getByText(/Combat Maneuver \(2\/3\)/);
    fireEvent.click(maneuverButton);

    expect(mockSpendCombatManeuverPoint).toHaveBeenCalledTimes(1);
  });

  it('disables resource buttons when no points available', () => {
    const mockSpendSorceryPoint = vi.fn();
    const mockSpendCombatManeuverPoint = vi.fn();

    render(
      <TestWrapper>
        <CombatActions
          {...defaultProps}
          spendSorceryPoint={mockSpendSorceryPoint}
          spendCombatManeuverPoint={mockSpendCombatManeuverPoint}
          sorcery_points={0}
          combat_maneuvers={0}
          max_sorcery_points={5}
          max_combat_maneuvers={3}
        />
      </TestWrapper>
    );

    const castButton = screen.getByText(/Cast Spell \(0\/5\)/).closest('button');
    const maneuverButton = screen.getByText(/Combat Maneuver \(0\/3\)/).closest('button');

    expect(castButton).toBeDisabled();
    expect(maneuverButton).toBeDisabled();
  });

  it('does not render resource buttons when max values are 0', () => {
    const mockSpendSorceryPoint = vi.fn();
    const mockSpendCombatManeuverPoint = vi.fn();

    render(
      <TestWrapper>
        <CombatActions
          {...defaultProps}
          spendSorceryPoint={mockSpendSorceryPoint}
          spendCombatManeuverPoint={mockSpendCombatManeuverPoint}
          sorcery_points={0}
          combat_maneuvers={0}
          max_sorcery_points={0}
          max_combat_maneuvers={0}
        />
      </TestWrapper>
    );

    expect(screen.queryByText(/Cast Spell/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Combat Maneuver/)).not.toBeInTheDocument();
  });

  it('always renders rest button', () => {
    render(
      <TestWrapper>
        <CombatActions {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Rest \(Restore All Resources\)/)).toBeInTheDocument();
  });
});