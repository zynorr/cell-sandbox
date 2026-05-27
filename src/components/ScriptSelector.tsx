'use client'

import { useState } from 'react'
import type { ScriptState } from '@/types'
import { KNOWN_SCRIPTS } from '@/lib/script'

interface ScriptSelectorProps {
  script: ScriptState
  onChange: (script: ScriptState) => void
}

export function ScriptSelector({ script, onChange }: ScriptSelectorProps) {
  const [showKnown, setShowKnown] = useState(false)

  const selectedKnown = KNOWN_SCRIPTS.find(
    (s) => s.codeHash === script.codeHash
  )

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => setShowKnown(!showKnown)}
          className="text-xs font-medium bg-stone-700 hover:bg-stone-600 text-stone-200 px-2.5 py-1 rounded-lg transition-all whitespace-nowrap active:scale-95"
        >
          {selectedKnown ? selectedKnown.name : 'Select Script'}
        </button>
        <input
          type="text"
          value={script.args}
          onChange={(e) => onChange({ ...script, args: e.target.value })}
          className="flex-1 bg-stone-800/50 border border-stone-700/50 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-300 placeholder-stone-600 focus:outline-none focus:border-blue-500/50 focus:bg-stone-800 transition-colors"
          placeholder="Args (hex)"
        />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={script.codeHash}
          onChange={(e) => onChange({ ...script, codeHash: e.target.value })}
          className="flex-1 bg-stone-800/50 border border-stone-700/50 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-300 placeholder-stone-600 focus:outline-none focus:border-blue-500/50 focus:bg-stone-800 transition-colors"
          placeholder="code_hash (hex)"
        />
        <select
          value={script.hashType}
          onChange={(e) =>
            onChange({ ...script, hashType: e.target.value as ScriptState['hashType'] })
          }
          className="bg-stone-800/50 border border-stone-700/50 rounded-lg px-2.5 py-1 text-xs text-stone-300 focus:outline-none focus:border-blue-500/50 transition-colors"
        >
          <option value="type">type</option>
          <option value="data">data</option>
          <option value="data1">data1</option>
          <option value="data2">data2</option>
        </select>
      </div>

      {showKnown && (
        <div className="border border-stone-700/50 rounded-lg overflow-hidden animate-fade-in">
          <div className="max-h-48 overflow-y-auto divide-y divide-stone-700/30">
            {KNOWN_SCRIPTS.map((s) => (
              <button
                key={s.name}
                onClick={() => {
                  onChange({
                    codeHash: s.codeHash,
                    hashType: s.hashType as ScriptState['hashType'],
                    args: script.args,
                  })
                  setShowKnown(false)
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  s.codeHash === script.codeHash
                    ? 'bg-blue-900/20 text-blue-300'
                    : 'text-stone-300 hover:bg-stone-700/50'
                }`}
              >
                <div className="font-medium">{s.name}</div>
                <div className="text-stone-500 truncate mt-0.5">{s.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
