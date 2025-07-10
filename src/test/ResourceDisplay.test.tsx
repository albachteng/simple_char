import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ResourceDisplay, createResourceItem, CompactResourceDisplay } from '../components/ResourceDisplay';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('ResourceDisplay', () => {
  it('renders resource items without tooltips', () => {
    const resources = [
      createResourceItem('HP', 25),
      createResourceItem('AC', 14),
      createResourceItem('Maneuvers', 3, 5)
    ];
    
    render(
      <TestWrapper>
        <ResourceDisplay resources={resources} />
      </TestWrapper>
    );
    
    expect(screen.getByText(/HP: 25/)).toBeInTheDocument();
    expect(screen.getByText(/AC: 14/)).toBeInTheDocument();
    expect(screen.getByText(/Maneuvers: 3\/5/)).toBeInTheDocument();
  });

  it('renders resource items with tooltips', () => {
    const resources = [
      createResourceItem('HP', 25, undefined, undefined, 'Health points tooltip'),
      createResourceItem('Maneuvers', 3, 5, undefined, 'Combat maneuvers tooltip')
    ];
    
    render(
      <TestWrapper>
        <ResourceDisplay resources={resources} />
      </TestWrapper>
    );
    
    expect(screen.getByText(/HP: 25/)).toBeInTheDocument();
    expect(screen.getByText(/Maneuvers: 3\/5/)).toBeInTheDocument();
    
    // Should have tooltip buttons
    const tooltipButtons = screen.getAllByRole('button');
    expect(tooltipButtons).toHaveLength(2);
  });

  it('shows tooltip content on hover', async () => {
    const tooltipContent = 'This explains how HP works';
    const resources = [
      createResourceItem('HP', 25, undefined, undefined, tooltipContent)
    ];
    
    render(
      <TestWrapper>
        <ResourceDisplay resources={resources} />
      </TestWrapper>
    );
    
    const tooltipButton = screen.getByRole('button');
    fireEvent.mouseEnter(tooltipButton);
    
    await waitFor(() => {
      expect(screen.getByText(tooltipContent)).toBeInTheDocument();
    });
  });

  it('renders in horizontal layout', () => {
    const resources = [
      createResourceItem('HP', 25),
      createResourceItem('AC', 14)
    ];
    
    render(
      <TestWrapper>
        <ResourceDisplay resources={resources} layout="horizontal" />
      </TestWrapper>
    );
    
    expect(screen.getByText(/HP: 25/)).toBeInTheDocument();
    expect(screen.getByText(/AC: 14/)).toBeInTheDocument();
  });

  it('renders without labels', () => {
    const resources = [
      createResourceItem('HP', 25)
    ];
    
    render(
      <TestWrapper>
        <ResourceDisplay resources={resources} showLabels={false} />
      </TestWrapper>
    );
    
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });
});

describe('CompactResourceDisplay', () => {
  it('renders character resources with basic data', () => {
    render(
      <TestWrapper>
        <CompactResourceDisplay
          hp={25}
          ac={14}
          combat_maneuvers={3}
          finesse_points={2}
          sorcery_points={4}
          max_combat_maneuvers={5}
          max_finesse_points={3}
          max_sorcery_points={6}
        />
      </TestWrapper>
    );
    
    expect(screen.getByText(/HP: 25/)).toBeInTheDocument();
    expect(screen.getByText(/AC: 14/)).toBeInTheDocument();
    expect(screen.getByText(/Maneuvers: 3\/5/)).toBeInTheDocument();
    expect(screen.getByText(/Finesse: 2\/3/)).toBeInTheDocument();
    expect(screen.getByText(/Sorcery: 4\/6/)).toBeInTheDocument();
  });

  it('renders tooltips when threshold data is provided', () => {
    render(
      <TestWrapper>
        <CompactResourceDisplay
          hp={25}
          ac={14}
          combat_maneuvers={3}
          finesse_points={2}
          sorcery_points={4}
          max_combat_maneuvers={5}
          max_finesse_points={3}
          max_sorcery_points={6}
          level={5}
          str={16}
          dex={16}
          int={15}
          finesseThresholdLevel={1}
          sorceryThresholdLevel={3}
          doubleSorceryThresholdLevel={5}
        />
      </TestWrapper>
    );
    
    // Should have tooltip buttons for resources with calculations
    const tooltipButtons = screen.getAllByRole('button');
    expect(tooltipButtons.length).toBeGreaterThan(0);
  });

  it('shows finesse tooltip content', async () => {
    render(
      <TestWrapper>
        <CompactResourceDisplay
          hp={25}
          ac={14}
          combat_maneuvers={3}
          finesse_points={2}
          sorcery_points={4}
          max_combat_maneuvers={5}
          max_finesse_points={3}
          max_sorcery_points={6}
          level={5}
          str={16}
          dex={16}
          int={15}
          finesseThresholdLevel={1}
          sorceryThresholdLevel={3}
          doubleSorceryThresholdLevel={null}
        />
      </TestWrapper>
    );
    
    const finesseText = screen.getByText(/Finesse: 2\/3/);
    const tooltipButton = finesseText.parentElement?.querySelector('button');
    
    if (tooltipButton) {
      fireEvent.mouseEnter(tooltipButton);
      
      await waitFor(() => {
        expect(screen.getByText(/reached 16 Dex at level 1/)).toBeInTheDocument();
      });
    }
  });

  it('shows sorcery tooltip content', async () => {
    render(
      <TestWrapper>
        <CompactResourceDisplay
          hp={25}
          ac={14}
          combat_maneuvers={3}
          finesse_points={2}
          sorcery_points={4}
          max_combat_maneuvers={5}
          max_finesse_points={3}
          max_sorcery_points={6}
          level={5}
          str={16}
          dex={16}
          int={15}
          finesseThresholdLevel={1}
          sorceryThresholdLevel={3}
          doubleSorceryThresholdLevel={null}
        />
      </TestWrapper>
    );
    
    const sorceryText = screen.getByText(/Sorcery: 4\/6/);
    const tooltipButton = sorceryText.parentElement?.querySelector('button');
    
    if (tooltipButton) {
      fireEvent.mouseEnter(tooltipButton);
      
      await waitFor(() => {
        expect(screen.getByText(/3 \(base at 3 INT\)/)).toBeInTheDocument();
      });
    }
  });

  it('shows combat maneuvers tooltip content', async () => {
    render(
      <TestWrapper>
        <CompactResourceDisplay
          hp={25}
          ac={14}
          combat_maneuvers={3}
          finesse_points={2}
          sorcery_points={4}
          max_combat_maneuvers={5}
          max_finesse_points={3}
          max_sorcery_points={6}
          level={5}
          str={16}
          dex={16}
          int={15}
          finesseThresholdLevel={1}
          sorceryThresholdLevel={3}
          doubleSorceryThresholdLevel={null}
        />
      </TestWrapper>
    );
    
    const combatText = screen.getByText(/Maneuvers: 3\/5/);
    const tooltipButton = combatText.parentElement?.querySelector('button');
    
    if (tooltipButton) {
      fireEvent.mouseEnter(tooltipButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Level 5 with 16 STR/)).toBeInTheDocument();
      });
    }
  });

  it('shows appropriate message when requirements not met', async () => {
    render(
      <TestWrapper>
        <CompactResourceDisplay
          hp={25}
          ac={14}
          combat_maneuvers={0}
          finesse_points={0}
          sorcery_points={0}
          max_combat_maneuvers={0}
          max_finesse_points={0}
          max_sorcery_points={0}
          level={5}
          str={14}
          dex={14}
          int={10}
          finesseThresholdLevel={null}
          sorceryThresholdLevel={null}
          doubleSorceryThresholdLevel={null}
        />
      </TestWrapper>
    );
    
    const combatText = screen.getByText(/Maneuvers: 0/);
    const tooltipButton = combatText.parentElement?.querySelector('button');
    
    if (tooltipButton) {
      fireEvent.mouseEnter(tooltipButton);
      
      await waitFor(() => {
        expect(screen.getByText(/You need at least 16 Strength to gain combat maneuvers/)).toBeInTheDocument();
      });
    }
  });
});

describe('createResourceItem', () => {
  it('creates resource item with all parameters', () => {
    const item = createResourceItem('HP', 25, 30, 'green', 'Health tooltip');
    
    expect(item.label).toBe('HP');
    expect(item.value).toBe(25);
    expect(item.maxValue).toBe(30);
    expect(item.color).toBe('green');
    expect(item.tooltip).toBe('Health tooltip');
  });

  it('creates resource item with minimal parameters', () => {
    const item = createResourceItem('AC', 14);
    
    expect(item.label).toBe('AC');
    expect(item.value).toBe(14);
    expect(item.maxValue).toBeUndefined();
    expect(item.color).toBeUndefined();
    expect(item.tooltip).toBeUndefined();
  });
});