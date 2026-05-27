'use client'

import { useSandbox } from '@/store/sandbox'
import { ScriptSelector } from './ScriptSelector'
import { DataEditor } from './DataEditor'
import { DataPreview } from './DataPreview'

export function CellEditor() {
  const cells = useSandbox((s) => s.cells)
  const selectedIndex = useSandbox((s) => s.selectedIndex)
  const updateCell = useSandbox((s) => s.updateCell)
  const removeCell = useSandbox((s) => s.removeCell)

  if (selectedIndex === null || !cells[selectedIndex]) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-500 text-sm gap-2 p-4">
        <svg className="w-6 h-6 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h4M9 12h6M12 9v6" />
        </svg>
        <span>Select a cell to inspect</span>
      </div>
    )
  }

  const cell = cells[selectedIndex]

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-300">
          Cell #{selectedIndex}
        </h3>
        <button
          onClick={() => removeCell(selectedIndex)}
          className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
        >
          Remove
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-400">Capacity</label>
        <input
          type="text"
          value={cell.capacity}
          onChange={(e) => updateCell(selectedIndex, { capacity: e.target.value })}
          className="w-full bg-stone-800/50 border border-stone-700/50 rounded-lg px-3 py-1.5 text-sm text-stone-200 font-mono focus:outline-none focus:border-blue-500/50 focus:bg-stone-800 transition-colors"
          placeholder="10000000000"
        />
        <p className="text-[11px] text-stone-500 font-mono">
          {Number(cell.capacity) / 1e8} CKB
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-400">Lock Script</label>
        <ScriptSelector
          script={cell.lock}
          onChange={(lock) => updateCell(selectedIndex, { lock })}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-stone-400">Type Script</label>
          <button
            onClick={() =>
              updateCell(selectedIndex, {
                type: cell.type
                  ? null
                  : { codeHash: '', hashType: 'type', args: '' },
              })
            }
            className={`text-xs font-medium transition-colors ${
              cell.type
                ? 'text-red-400/70 hover:text-red-400'
                : 'text-blue-400/70 hover:text-blue-400'
            }`}
          >
            {cell.type ? 'Remove' : 'Add Type'}
          </button>
        </div>
        {cell.type && (
          <ScriptSelector
            script={cell.type}
            onChange={(type) => updateCell(selectedIndex, { type })}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-400">Output Data</label>
        <DataEditor
          value={cell.data}
          mode={cell.dataMode}
          onChange={(data, dataMode) => updateCell(selectedIndex, { data, dataMode })}
        />
        <DataPreview
          type={cell.type}
          data={cell.data}
          capacity={cell.capacity}
        />
      </div>
    </div>
  )
}
