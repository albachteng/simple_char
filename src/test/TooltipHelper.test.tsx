import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { TooltipHelper, createCalculationTooltip, createStatProgressionTooltip } from '../components/TooltipHelper';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('TooltipHelper', () => {
  it('renders a question mark icon', () => {
    render(
      <TestWrapper>
        <TooltipHelper content="Test tooltip content" />
      </TestWrapper>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows tooltip content on hover', async () => {
    const tooltipContent = 'This is test tooltip content';
    render(
      <TestWrapper>
        <TooltipHelper content={tooltipContent} />
      </TestWrapper>
    );
    
    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    
    await waitFor(() => {
      expect(screen.getByText(tooltipContent)).toBeInTheDocument();
    });
  });

  it('accepts custom position prop', () => {
    render(
      <TestWrapper>
        <TooltipHelper content="Test" position="bottom" />
      </TestWrapper>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('accepts custom size prop', () => {
    render(
      <TestWrapper>
        <TooltipHelper content="Test" size="lg" />
      </TestWrapper>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('createCalculationTooltip', () => {
  it('creates calculation tooltip with header and breakdown', () => {
    const result = createCalculationTooltip(
      'Finesse Points',
      3,
      5,
      [
        'You gain one finesse point when you reach 16 dexterity',
        '1 (reached 16 Dex at level 1)',
        '+ 1 (Level 3)',
        '+ 1 (Level 5)'
      ]
    );
    
    expect(result).toContain('Finesse Points: 3/5');
    expect(result).toContain('You gain one finesse point when you reach 16 dexterity');
    expect(result).toContain('1 (reached 16 Dex at level 1)');
    expect(result).toContain('+ 1 (Level 3)');
    expect(result).toContain('+ 1 (Level 5)');
  });

  it('handles empty breakdown array', () => {
    const result = createCalculationTooltip('Test', 1, 1, []);
    
    expect(result).toContain('Test: 1/1');
  });
});

describe('createStatProgressionTooltip', () => {
  it('creates stat progression tooltip with no level-ups', () => {
    const result = createStatProgressionTooltip('str', 16, 16, []);
    
    expect(result).toContain('STR: 16');
    expect(result).toContain('Starting value: 16');
    expect(result).toContain('No level-up increases yet.');
  });

  it('creates stat progression tooltip with level-ups', () => {
    const result = createStatProgressionTooltip('str', 20, 16, ['str', 'str']);
    
    expect(result).toContain('STR: 20');
    expect(result).toContain('Starting value: 16');
    expect(result).toContain('Level-up increases: +4 (2 choices × 2 points each)');
  });

  it('handles stat with other bonuses', () => {
    const result = createStatProgressionTooltip('str', 19, 16, ['str']); // 16 + 2 from level-up + 1 from other
    
    expect(result).toContain('STR: 19');
    expect(result).toContain('Starting value: 16');
    expect(result).toContain('Level-up increases: +2 (1 choices × 2 points each)');
    expect(result).toContain('Other bonuses: +1 (racial bonuses, equipment, etc.)');
  });

  it('handles mixed stat choices correctly', () => {
    const levelUpChoices = ['str', 'dex', 'str', 'int'];
    const strChoices = levelUpChoices.filter(choice => choice === 'str');
    const result = createStatProgressionTooltip('str', 20, 16, strChoices);
    
    expect(result).toContain('STR: 20');
    expect(result).toContain('Starting value: 16');
    expect(result).toContain('Level-up increases: +4 (2 choices × 2 points each)');
  });
});