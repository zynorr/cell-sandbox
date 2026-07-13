'use client'

import { useSandbox } from '@/store/sandbox'
import { dataBytes, estimateFreeCapacity, estimateOccupiedCapacity } from '@/lib/cellMetrics'
import { formatCapacity } from '@/lib/ccc'

export function WorkspaceStatus() {
  const cells = useSandbox((s) => s.cells)
  const selectedIndex = useSandbox((s) => s.selectedIndex)
  const viewMode = useSandbox((s) => s.viewMode)
  const txInputs = useSandbox((s) => s.txInputs)
  const txOutputs = useSandbox((s) => s.txOutputs)

  const cell = selectedIndex !== null ? cells[selectedIndex] : undefined
  const hasLock = Boolean(cell?.lock.codeHash)
  const hasCapacity = Number(cell?.capacity ?? 0) > 0
  const occupied = cell ? estimateOccupiedCapacity(cell) : null
  const free = cell ? estimateFreeCapacity(cell) : null
  const status = cells.length === 0
    ? 'No Cells'
    : hasCapacity && hasLock
      ? 'Cell ready'
      : 'Draft Cell'

  const nextStep = (() => {
    if (viewMode === 'learn') return 'Next: design or load a Cell'
    if (viewMode === 'design') return hasLock ? 'Next: inspect or build a transaction' : 'Next: choose a lock script'
    if (viewMode === 'inspect') return 'Next: paste a full transaction hash'
    if (txOutputs.length === 0) return 'Next: click Output under a designed Cell'
    return 'Next: connect wallet and send'
  })()

  return (
    <footer className="flex flex-col gap-1 border-t border-stone-800/80 bg-stone-950/40 px-4 py-2 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>Status: <span className="text-stone-300">{status}</span></span>
        <span>Cells: <span className="text-stone-300">{cells.length}</span></span>
        {cell && <span>Data: <span className="text-stone-300">{dataBytes(cell.data)} bytes</span></span>}
        {occupied !== null && <span>Est. occupied: <span className="text-stone-300">{formatCapacity(occupied)}</span></span>}
        {free !== null && <span>Est. free: <span className={free >= BigInt(0) ? 'text-emerald-300' : 'text-red-300'}>{formatCapacity(free)}</span></span>}
        <span>Tx Flow: <span className="text-blue-300">{txInputs.length} in</span> / <span className="text-emerald-300">{txOutputs.length} out</span></span>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span>{nextStep}</span>
        <a
          href="https://docs.nervos.org"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-stone-500 transition-colors hover:text-stone-300"
        >
          CKB Docs
        </a>
      </div>
    </footer>
  )
}
