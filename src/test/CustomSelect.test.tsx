import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomSelect } from '../CustomSelect'

describe('CustomSelect component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ]

  it('should render with label and initial value', () => {
    render(
      <CustomSelect
        label="Test Label"
        value="option1"
        onChange={() => {}}
        options={mockOptions}
      />
    )
    
    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('should show dropdown when clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <CustomSelect
        label="Test Label"
        value="option1"
        onChange={() => {}}
        options={mockOptions}
      />
    )
    
    const selectButton = screen.getByRole('button')
    await user.click(selectButton)
    
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })

  it('should call onChange when option is selected', async () => {
    const mockOnChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <CustomSelect
        label="Test Label"
        value="option1"
        onChange={mockOnChange}
        options={mockOptions}
      />
    )
    
    const selectButton = screen.getByRole('button')
    await user.click(selectButton)
    
    const option2 = screen.getByText('Option 2')
    await user.click(option2)
    
    expect(mockOnChange).toHaveBeenCalledWith('option2')
  })

  it('should close dropdown after selection', async () => {
    const user = userEvent.setup()
    
    render(
      <CustomSelect
        label="Test Label"
        value="option1"
        onChange={() => {}}
        options={mockOptions}
      />
    )
    
    const selectButton = screen.getByRole('button')
    await user.click(selectButton)
    
    const option2 = screen.getByText('Option 2')
    await user.click(option2)
    
    // Option 2 and Option 3 should no longer be visible (dropdown closed)
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Option 3')).not.toBeInTheDocument()
  })

  it('should show correct arrow rotation when open/closed', async () => {
    const user = userEvent.setup()
    
    render(
      <CustomSelect
        label="Test Label"
        value="option1"
        onChange={() => {}}
        options={mockOptions}
      />
    )
    
    const selectButton = screen.getByRole('button')
    const arrow = selectButton.querySelector('span:last-child')
    
    expect(arrow).toHaveStyle('transform: rotate(0deg)')
    
    await user.click(selectButton)
    
    expect(arrow).toHaveStyle('transform: rotate(180deg)')
  })
})