import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataEditor } from '../DataEditor'

describe('DataEditor', () => {
  it('renders textarea with current value', () => {
    render(<DataEditor value="0xdeadbeef" mode="hex" onChange={vi.fn()} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('0xdeadbeef')
  })

  it('calls onChange when textarea value changes', () => {
    const onChange = vi.fn()
    render(<DataEditor value="0x" mode="hex" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0xabcd' } })
    expect(onChange).toHaveBeenCalledWith('0xabcd', 'hex')
  })

  describe('mode switching', () => {
    it('converts hex to text when switching to text mode', () => {
      const onChange = vi.fn()
      render(<DataEditor value="0x48656c6c6f" mode="hex" onChange={onChange} />)
      fireEvent.click(screen.getByText('text'))
      expect(onChange).toHaveBeenCalledWith('Hello', 'text')
    })

    it('converts hex to number when switching to number mode', () => {
      const onChange = vi.fn()
      render(<DataEditor value="0x1a" mode="hex" onChange={onChange} />)
      fireEvent.click(screen.getByText('number'))
      expect(onChange).toHaveBeenCalledWith('26', 'number')
    })

    it('converts text to hex when switching to hex mode', () => {
      const onChange = vi.fn()
      render(<DataEditor value="Hello" mode="text" onChange={onChange} />)
      fireEvent.click(screen.getByText('hex'))
      expect(onChange).toHaveBeenCalledWith('0x48656c6c6f', 'hex')
    })

    it('converts number to hex when switching to hex mode', () => {
      const onChange = vi.fn()
      render(<DataEditor value="26" mode="number" onChange={onChange} />)
      fireEvent.click(screen.getByText('hex'))
      expect(onChange).toHaveBeenCalledWith('0x1a', 'hex')
    })

    it('passes text value through when switching to number mode (no conversion)', () => {
      const onChange = vi.fn()
      render(<DataEditor value="Hello" mode="text" onChange={onChange} />)
      fireEvent.click(screen.getByText('number'))
      // The component does not chain text→hex→number; it passes the value as-is
      expect(onChange).toHaveBeenCalledWith('Hello', 'number')
    })
  })

  it('shows correct placeholder based on mode', () => {
    const { rerender } = render(<DataEditor value="" mode="hex" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()

    rerender(<DataEditor value="" mode="text" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()

    rerender(<DataEditor value="" mode="number" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('Enter number...')).toBeInTheDocument()
  })

  it('highlights the active mode button', () => {
    render(<DataEditor value="0x" mode="hex" onChange={vi.fn()} />)
    const hexBtn = screen.getByText('hex')
    expect(hexBtn.className).toContain('bg-blue')
  })
})
