'use client'

import type { CellState } from '@/types'

interface DataEditorProps {
  value: string
  mode: CellState['dataMode']
  onChange: (value: string, mode: CellState['dataMode']) => void
}

export function DataEditor({ value, mode, onChange }: DataEditorProps) {
  function handleModeSwitch(newMode: CellState['dataMode']) {
    if (newMode === mode) return
    if (newMode === 'hex') {
      if (mode === 'text') {
        const bytes = new TextEncoder().encode(value)
        const hex = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
        onChange(hex, newMode)
      } else if (mode === 'number') {
        const n = BigInt(value || '0')
        const hex = '0x' + n.toString(16)
        onChange(hex, newMode)
      }
    } else if (newMode === 'text') {
      if (mode === 'hex' && value.startsWith('0x')) {
        const hex = value.slice(2)
        const bytes = new Uint8Array(hex.length / 2)
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
        }
        const text = new TextDecoder().decode(bytes)
        onChange(text, newMode)
      } else {
        onChange(value, newMode)
      }
    } else if (newMode === 'number') {
      if (mode === 'hex' && value.startsWith('0x')) {
        const n = BigInt(value)
        onChange(n.toString(), newMode)
      } else {
        onChange(value, newMode)
      }
    }
  }

  return (
    <div className="space-y-1.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value, mode)}
        className="w-full bg-stone-800/50 border border-stone-700/50 rounded-lg px-3 py-1.5 text-xs font-mono text-stone-300 placeholder-stone-600 focus:outline-none focus:border-blue-500/50 focus:bg-stone-800 transition-colors resize-y min-h-[60px] max-h-[160px]"
        placeholder={
          mode === 'hex' ? '0x...' : mode === 'text' ? 'Enter text...' : 'Enter number...'
        }
        spellCheck={false}
      />
      <div className="flex gap-1">
        {(['hex', 'text', 'number'] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeSwitch(m)}
            className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-all active:scale-95 ${
              mode === m
                ? 'bg-blue-600/90 text-white shadow-sm'
                : 'bg-stone-700/50 text-stone-500 hover:text-stone-300 hover:bg-stone-700'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
