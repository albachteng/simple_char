import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { Picker } from '../Picker'

const renderWithMantine = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  )
}

describe('Picker component', () => {
  it('should render high stat picker with correct text', () => {
    const mockSetter = vi.fn()
    
    renderWithMantine(<Picker setter={mockSetter} value="high" />)
    
    expect(screen.getByText('Pick your primary stat')).toBeInTheDocument()
    expect(screen.getByText('primary score is 16 or +3')).toBeInTheDocument()
    expect(screen.getByText('STR primary?')).toBeInTheDocument()
    expect(screen.getByText('DEX primary?')).toBeInTheDocument()
    expect(screen.getByText('INT primary?')).toBeInTheDocument()
  })

  it('should render mid stat picker with correct text', () => {
    const mockSetter = vi.fn()
    
    renderWithMantine(<Picker setter={mockSetter} value="mid" />)
    
    expect(screen.getByText('Pick your secondary stat')).toBeInTheDocument()
    expect(screen.getByText('secondary score is 10 or +0')).toBeInTheDocument()
    expect(screen.getByText('STR secondary?')).toBeInTheDocument()
    expect(screen.getByText('DEX secondary?')).toBeInTheDocument()
    expect(screen.getByText('INT secondary?')).toBeInTheDocument()
  })

  it('should call setter when button is clicked', async () => {
    const mockSetter = vi.fn()
    const user = userEvent.setup()
    
    renderWithMantine(<Picker setter={mockSetter} value="high" />)
    
    await user.click(screen.getByText('STR primary?'))
    
    expect(mockSetter).toHaveBeenCalledWith('str')
  })
})