'use client'

import { useSandbox } from '@/store/sandbox'
import { dataBytes, getCellFreeCapacity, getCellOccupiedCapacity } from '@/lib/cellMetrics'
import { formatCapacity } from '@/lib/ccc'
import {
  getLockScriptAdvisory,
  getLockScriptIssue,
  getTypeScriptAdvisory,
  isWalletFillableLock,
  validateOutputCells,
  WALLET_FILLABLE_LOCK_ISSUE,
} from '@/lib/cellValidation'

export function WorkspaceStatus() {
  const cells = useSandbox((s) => s.cells)
  const selectedIndex = useSandbox((s) => s.selectedIndex)
  const viewMode = useSandbox((s) => s.viewMode)
  const txOutputs = useSandbox((s) => s.txOutputs)
  const wallet = useSandbox((s) => s.wallet)

  const cell = selectedIndex !== null ? cells[selectedIndex] : undefined
  const hasLock = Boolean(cell?.lock.codeHash)
  const hasCapacity = Boolean(cell && /^\d+$/.test(cell.capacity) && BigInt(cell.capacity) > BigInt(0))
  const network = useSandbox((s) => s.network)
  const lockIssue = hasLock && cell ? getLockScriptIssue(cell.lock, network) : null
  const selectedWalletFillable = Boolean(cell && isWalletFillableLock(cell.lock, network))
  const designAdvisory = cell
    ? getLockScriptAdvisory(cell.lock, network) || getTypeScriptAdvisory(cell.type, network)
    : null
  const occupied = cell ? getCellOccupiedCapacity(cell) : null
  const free = cell ? getCellFreeCapacity(cell) : null
  const showCellMetrics = viewMode === 'design' || viewMode === 'build'
  const outputIssues = validateOutputCells(
    txOutputs.flatMap((index) => cells[index] ? [{ index, cell: cells[index] }] : []),
    network
  )
  const walletWillFillIssues = !wallet.connected && outputIssues.length > 0 && outputIssues.every(
    (issue) => issue.endsWith(WALLET_FILLABLE_LOCK_ISSUE)
  )
  const cellStatus = cells.length === 0
    ? 'No Cells'
    : hasCapacity && hasLock && selectedWalletFillable
      ? 'Ready for wallet'
    : hasCapacity && hasLock && !lockIssue
      ? designAdvisory ? 'Design example' : 'Cell ready'
      : lockIssue
        ? 'Needs lock details'
        : 'Draft Cell'
  const status = viewMode === 'learn'
    ? 'Learning Cell model'
    : viewMode === 'inspect'
      ? 'Transaction inspection'
      : viewMode === 'build' && txOutputs.length > 0 && outputIssues.length > 0
        ? walletWillFillIssues ? 'Waiting for wallet' : 'Output needs attention'
        : cellStatus

  const nextStep = (() => {
    if (viewMode === 'learn') return 'Next: design or load a Cell'
    if (viewMode === 'design') {
      if (!hasLock) return 'Next: choose a lock script'
      if (selectedWalletFillable) return 'Next: open Build Tx or enter recipient args'
      if (lockIssue) return 'Next: complete the lock args'
      return 'Next: inspect or build a transaction'
    }
    if (viewMode === 'inspect') return 'Next: load a transaction and compare its Cells'
    if (txOutputs.length === 0) return 'Next: click Add output under a designed Cell'
    if (!wallet.connected && outputIssues.some((issue) => issue.endsWith(WALLET_FILLABLE_LOCK_ISSUE))) {
      return 'Next: connect wallet to fill the output lock'
    }
    if (outputIssues.length > 0) return 'Next: fix the selected output'
    if (!wallet.connected) return 'Next: connect a wallet for funding'
    return 'Next: review the transaction'
  })()

  return (
    <footer className="shrink-0 flex flex-col gap-1 border-t border-stone-800/80 bg-stone-950 px-4 py-2 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>Status: <span className="text-stone-300">{status}</span></span>
        {showCellMetrics && <span className="hidden sm:inline">Cells: <span className="text-stone-300">{cells.length}</span></span>}
        {showCellMetrics && cell && <span className="hidden sm:inline">Data: <span className="text-stone-300">{dataBytes(cell.data)} bytes</span></span>}
        {showCellMetrics && occupied !== null && <span className="hidden sm:inline">Occupied: <span className="text-stone-300">{formatCapacity(occupied)}</span></span>}
        {showCellMetrics && free !== null && <span className="hidden sm:inline">Free: <span className={free >= BigInt(0) ? 'text-emerald-300' : 'text-red-300'}>{formatCapacity(free)}</span></span>}
        {viewMode === 'build' && (
          <span className="hidden sm:inline">
            Funding inputs: <span className="text-blue-300">{txOutputs.length > 0
              ? outputIssues.length > 0 && !walletWillFillIssues
                ? 'waiting for valid output'
                : wallet.connected ? 'selected during signing' : 'after wallet connects'
              : 'waiting for output'}</span>
            {' / '}
            <span className="text-emerald-300">{txOutputs.length} {txOutputs.length === 1 ? 'output' : 'outputs'}</span>
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span className="min-w-0">{nextStep}</span>
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
