'use client'

import { useSandbox } from '@/store/sandbox'
import { ScriptSelector } from './ScriptSelector'
import { DataEditor } from './DataEditor'
import { DataPreview } from './DataPreview'
import { estimateFreeCapacity, estimateOccupiedBytes, estimateOccupiedCapacity } from '@/lib/cellMetrics'
import { formatCapacity } from '@/lib/ccc'

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
  const occupiedBytes = estimateOccupiedBytes(cell)
  const occupiedCapacity = estimateOccupiedCapacity(cell)
  const freeCapacity = estimateFreeCapacity(cell)

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
        <p className="text-[11px] leading-4 text-stone-600">
          Capacity is the Cell&apos;s CKB amount and storage limit. It must cover the occupied bytes of lock, type, and data.
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-stone-800 bg-stone-950/50 p-2 text-[11px]">
          <div>
            <p className="text-stone-600">Est. occupied</p>
            <p className="font-mono text-stone-300">{formatCapacity(occupiedCapacity)}</p>
          </div>
          <div>
            <p className="text-stone-600">Est. free</p>
            <p className={`font-mono ${freeCapacity >= BigInt(0) ? 'text-emerald-300' : 'text-red-300'}`}>
              {formatCapacity(freeCapacity)}
            </p>
          </div>
          <div className="col-span-2 text-stone-600">
            Estimated occupied size: <span className="font-mono text-stone-400">{occupiedBytes} bytes</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-400">Lock Script</label>
        <p className="text-[11px] leading-4 text-stone-600">
          Ownership rule. The lock script decides when this Cell can be spent as an input.
        </p>
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
          <>
            <p className="text-[11px] leading-4 text-stone-600">
              Optional state-transition rule for tokens, DAO, NFTs, or app-specific Cells.
            </p>
            <ScriptSelector
              script={cell.type}
              onChange={(type) => updateCell(selectedIndex, { type })}
            />
          </>
        )}
        {!cell.type && (
          <p className="text-[11px] leading-4 text-stone-600">
            Without a type script, this Cell has ownership and data but no extra state-transition rule.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-400">Output Data</label>
        <p className="text-[11px] leading-4 text-stone-600">
          Arbitrary bytes stored in the Cell. The preview below interprets common token, DAO, and Spore patterns.
        </p>
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
