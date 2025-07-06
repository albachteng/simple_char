import { useState, useEffect, useRef } from 'react'
import { Box } from '@mantine/core'

interface CustomNumberInputProps {
  value: number
  onChange: (value: number | string) => void
  min?: number
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  w?: number | string
  placeholder?: string
  disabled?: boolean
  allowNegative?: boolean
}

export function CustomNumberInput({
  value,
  onChange,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  size = 'sm',
  w = 80,
  placeholder,
  disabled = false,
  allowNegative = false
}: CustomNumberInputProps) {
  const [inputValue, setInputValue] = useState(value.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Allow empty string temporarily for better UX
    if (newValue === '') {
      return
    }

    // Handle negative sign for negative values
    if (allowNegative && newValue === '-') {
      return
    }

    const numValue = parseInt(newValue, 10)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue))
      onChange(clampedValue)
    }
  }

  const handleBlur = () => {
    // On blur, ensure we have a valid number
    const numValue = parseInt(inputValue, 10)
    if (isNaN(numValue) || inputValue === '') {
      const defaultValue = Math.max(min, Math.min(max, value))
      setInputValue(defaultValue.toString())
      onChange(defaultValue)
    } else {
      const clampedValue = Math.max(min, Math.min(max, numValue))
      setInputValue(clampedValue.toString())
      if (clampedValue !== numValue) {
        onChange(clampedValue)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const currentValue = parseInt(inputValue, 10) || 0
      const newValue = Math.min(max, currentValue + 1)
      setInputValue(newValue.toString())
      onChange(newValue)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const currentValue = parseInt(inputValue, 10) || 0
      const newValue = Math.max(min, currentValue - 1)
      setInputValue(newValue.toString())
      onChange(newValue)
    }
  }

  const sizeStyles = {
    xs: { fontSize: '12px', padding: '4px 8px', height: '24px' },
    sm: { fontSize: '14px', padding: '6px 10px', height: '28px' },
    md: { fontSize: '16px', padding: '8px 12px', height: '32px' },
    lg: { fontSize: '18px', padding: '10px 14px', height: '36px' },
    xl: { fontSize: '20px', padding: '12px 16px', height: '40px' }
  }

  const inputStyle = {
    width: typeof w === 'number' ? `${w}px` : w,
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    ...sizeStyles[size],
    textAlign: 'center' as const,
    fontFamily: 'inherit',
    backgroundColor: disabled ? '#f8f9fa' : '#ffffff',
    color: disabled ? '#6c757d' : '#000000',
    cursor: disabled ? 'not-allowed' : 'text',
    outline: 'none',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    '&:focus': {
      borderColor: '#339af0',
      boxShadow: '0 0 0 2px rgba(51, 154, 240, 0.25)'
    },
    '&:hover': disabled ? {} : {
      borderColor: '#adb5bd'
    }
  }

  return (
    <Box>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern={allowNegative ? "-?[0-9]*" : "[0-9]*"}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={inputStyle}
        onFocus={(e) => {
          if (!disabled) {
            const target = e.target as HTMLInputElement
            target.style.borderColor = '#339af0'
            target.style.boxShadow = '0 0 0 2px rgba(51, 154, 240, 0.25)'
          }
        }}
        onBlurCapture={(e) => {
          const target = e.target as HTMLInputElement
          target.style.borderColor = '#dee2e6'
          target.style.boxShadow = 'none'
        }}
        onMouseEnter={(e) => {
          if (!disabled && document.activeElement !== e.target) {
            const target = e.target as HTMLInputElement
            target.style.borderColor = '#adb5bd'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && document.activeElement !== e.target) {
            const target = e.target as HTMLInputElement
            target.style.borderColor = '#dee2e6'
          }
        }}
      />
    </Box>
  )
}