import { describe, it, expect } from 'vitest'
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

  it('should render log viewer with title', () => {
    renderWithMantine(<LogViewer />)
    
    expect(screen.getByText('Debug Log')).toBeInTheDocument()
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

  it('should be expandable/collapsible', async () => {
    const user = userEvent.setup()
    renderWithMantine(<LogViewer />)
    
    // Find the expand button by aria-label
    const collapseButton = screen.getByLabelText('Expand log viewer')
    await user.click(collapseButton)
    
    // The filters should be hidden when collapsed
    expect(screen.queryByLabelText('Level')).not.toBeInTheDocument()
  })

})
