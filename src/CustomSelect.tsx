import { useState, useRef, useEffect } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  size?: 'xs' | 'sm' | 'md'
  width?: number
}

export function CustomSelect({ label, value, onChange, options, size = 'sm', width = 120 }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const sizeStyles = {
    xs: { fontSize: '12px', padding: '4px 8px', height: '24px' },
    sm: { fontSize: '14px', padding: '6px 12px', height: '32px' },
    md: { fontSize: '16px', padding: '8px 16px', height: '40px' }
  }

  const currentSize = sizeStyles[size]
  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div style={{ position: 'relative', width: `${width}px` }} ref={selectRef}>
      {/* Label */}
      <label style={{
        display: 'block',
        fontSize: currentSize.fontSize,
        marginBottom: '4px',
        fontWeight: '500',
        color: '#e0e0e0'
      }}>
        {label}
      </label>

      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: currentSize.height,
          padding: currentSize.padding,
          fontSize: currentSize.fontSize,
          border: '1px solid #555',
          borderRadius: '4px',
          backgroundColor: '#2a2a2a',
          color: '#e0e0e0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          outline: 'none'
        }}
        onFocus={(e) => e.target.style.borderColor = '#646cff'}
        onBlur={(e) => e.target.style.borderColor = '#555'}
      >
        <span style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption?.label || 'Select...'}
        </span>
        <span style={{ 
          fontSize: '10px', 
          marginLeft: '8px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                padding: currentSize.padding,
                fontSize: currentSize.fontSize,
                border: 'none',
                backgroundColor: option.value === value ? '#404040' : '#2a2a2a',
                color: '#e0e0e0',
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.backgroundColor = '#404040'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.backgroundColor = option.value === value ? '#404040' : '#2a2a2a'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}