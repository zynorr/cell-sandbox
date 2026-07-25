'use client'

import { useSandbox } from '@/store/sandbox'
import { ScriptSelector } from './ScriptSelector'
import { DataEditor } from './DataEditor'
import { DataPreview } from './DataPreview'
import { estimateFreeCapacity, estimateOccupiedBytes, estimateOccupiedCapacity } from '@/lib/cellMetrics'
import { formatCapacity, formatCapacityExact } from '@/lib/ccc'
import {
  getLockScriptAdvisory,
  getLockScriptIssue,
  getTypeScriptAdvisory,
  getTypeScriptIssue,
  SECP256K1_BLAKE160_CODE_HASH,
} from '@/lib/cellValidation'

function formatCapacityInput(capacity: string): string {
  try {
    return formatCapacityExact(capacity)
  } catch {
    return 'Enter capacity as whole shannons'
  }
}

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
  const lockIssue = cell.lock.codeHash ? getLockScriptIssue(cell.lock) : null
  const lockAdvisory = cell.lock.codeHash ? getLockScriptAdvisory(cell.lock) : null
  const typeIssue = cell.type?.codeHash ? getTypeScriptIssue(cell.type) : null
  const typeAdvisory = getTypeScriptAdvisory(cell.type)
  const walletLockPending =
    cell.lock.codeHash.toLowerCase() === SECP256K1_BLAKE160_CODE_HASH &&
    (!cell.lock.args || cell.lock.args === '0x')
  const occupiedAfterWallet = occupiedCapacity + BigInt(20 * 100000000)
  const freeAfterWallet = freeCapacity - BigInt(20 * 100000000)

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
          {formatCapacityInput(cell.capacity)}
        </p>
        <p className="text-[11px] leading-4 text-stone-600">
          Capacity is a Uint64 shannon amount and the Cell&apos;s byte limit. It covers capacity, lock, optional type, and output data.
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
          {walletLockPending && (
            <div className="col-span-2 border-t border-stone-800 pt-2 text-stone-500">
              After the wallet adds 20-byte lock args:{' '}
              <span className="font-mono text-stone-300">{formatCapacity(occupiedAfterWallet)} occupied</span>
              {' / '}
              <span className={`font-mono ${freeAfterWallet >= BigInt(0) ? 'text-emerald-300' : 'text-red-300'}`}>
                {formatCapacity(freeAfterWallet)} free
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-400">Lock Script</label>
        <p className="text-[11px] leading-4 text-stone-600">
          Required spending condition. It executes when this Cell is consumed as an input.
        </p>
        <ScriptSelector
          script={cell.lock}
          role="lock"
          onChange={(lock) => updateCell(selectedIndex, { lock })}
        />
        {lockIssue && (
          <p className="rounded-lg border border-amber-800/30 bg-amber-950/20 px-2.5 py-2 text-[11px] leading-4 text-amber-300">
            {lockIssue}
          </p>
        )}
        {!lockIssue && lockAdvisory && (
          <p className="rounded-lg border border-amber-800/30 bg-amber-950/20 px-2.5 py-2 text-[11px] leading-4 text-amber-300">
            {lockAdvisory}
          </p>
        )}
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
              Optional application rule checked for matching input and output Cells.
            </p>
            <ScriptSelector
              script={cell.type}
              role="type"
              onChange={(type) => updateCell(selectedIndex, { type })}
            />
            {typeIssue && (
              <p className="rounded-lg border border-amber-800/30 bg-amber-950/20 px-2.5 py-2 text-[11px] leading-4 text-amber-300">
                {typeIssue}
              </p>
            )}
            {!typeIssue && typeAdvisory && (
              <p className="rounded-lg border border-amber-800/30 bg-amber-950/20 px-2.5 py-2 text-[11px] leading-4 text-amber-300">
                {typeAdvisory}
              </p>
            )}
          </>
        )}
        {!cell.type && (
          <p className="text-[11px] leading-4 text-stone-600">
            Without a type script, the Cell still has a lock and output data but no additional application rule.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-400">Output Data</label>
        <p className="text-[11px] leading-4 text-stone-600">
          Bytes at the matching index in the transaction&apos;s outputs_data array. The preview interprets common xUDT, DAO, and Spore encodings.
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
