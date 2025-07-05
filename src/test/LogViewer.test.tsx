import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { LogViewer } from '../LogViewer'
import { logger } from '../logger'

const renderWithMantine = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  )
}

describe('LogViewer component', () => {
  beforeEach(() => {
    logger.clearLogs()
  })

  it('should render log viewer with title', () => {
    renderWithMantine(<LogViewer />)
    
    expect(screen.getByText('Game Log')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('should show no logs message initially', () => {
    renderWithMantine(<LogViewer />)
    
    expect(screen.getByText('No logs generated yet')).toBeInTheDocument()
  })

  it('should display logs when they exist', async () => {
    logger.debug('Test debug message')
    logger.info('Test info message')
    
    renderWithMantine(<LogViewer />)
    
    // Wait for auto-refresh
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    expect(screen.getByText('Test debug message')).toBeInTheDocument()
    expect(screen.getByText('Test info message')).toBeInTheDocument()
  })

  it('should be collapsible', async () => {
    const user = userEvent.setup()
    renderWithMantine(<LogViewer />)
    
    // Find the collapse button by aria-label
    const collapseButton = screen.getByLabelText('Collapse log viewer')
    await user.click(collapseButton)
    
    // The filters should be hidden when collapsed
    expect(screen.queryByLabelText('Level')).not.toBeInTheDocument()
  })

  it('should clear logs when clear button is clicked', async () => {
    logger.debug('Test message')
    
    const user = userEvent.setup()
    renderWithMantine(<LogViewer />)
    
    // Wait for logs to load
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    const clearButton = screen.getByText('Clear')
    await user.click(clearButton)
    
    expect(screen.getByText('No logs generated yet')).toBeInTheDocument()
  })
})