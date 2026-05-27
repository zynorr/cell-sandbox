'use client'

import { useSandbox } from '@/store/sandbox'
import type { CellState } from '@/types'

function formatCKB(shannon: string): string {
  const n = BigInt(shannon || '0')
  const whole = n / BigInt(1e8)
  const frac = n % BigInt(1e8)
  const fracStr = frac.toString().padStart(8, '0').replace(/0+$/, '')
  return `${whole.toLocaleString()}.${fracStr || '0'} CKB`
}

function scriptLabel(script: { codeHash: string; hashType: string } | null): string {
  if (!script) return 'None'
  return `${script.codeHash.slice(0, 10)}... (${script.hashType})`
}

function dataPreview(data: string): string {
  if (!data || data === '0x') return 'Empty'
  if (data.length > 40) return `${data.slice(0, 40)}...`
  return data
}

export function TxConfirmDialog() {
  const showConfirmDialog = useSandbox((s) => s.showConfirmDialog)
  const setShowConfirmDialog = useSandbox((s) => s.setShowConfirmDialog)
  const cells = useSandbox((s) => s.cells)
  const txOutputs = useSandbox((s) => s.txOutputs)

  if (!showConfirmDialog) return null

  const outputCells = txOutputs
    .map((i) => cells[i])
    .filter((c): c is CellState => c !== undefined)
  const totalCapacity = outputCells.reduce(
    (sum, c) => sum + BigInt(c.capacity || '0'),
    BigInt(0)
  )

  function handleConfirm() {
    setShowConfirmDialog(false)
    useSandbox.getState().sendTransaction()
  }

  function handleCancel() {
    setShowConfirmDialog(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-stone-900 border border-stone-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-stone-800">
          <h2 className="text-sm font-semibold text-stone-100">Confirm Transaction</h2>
          <button
            onClick={handleCancel}
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">Outputs</span>
            <span className="text-stone-300 font-mono">{outputCells.length} cell{outputCells.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center justify-between text-xs bg-stone-800/50 rounded-lg px-3 py-2">
            <span className="text-stone-400">Total Capacity</span>
            <span className="text-emerald-400 font-mono font-medium">{formatCKB(totalCapacity.toString())}</span>
          </div>

          <div className="space-y-2">
            {outputCells.map((cell, idx) => (
              <div
                key={idx}
                className="text-xs bg-stone-800/30 border border-stone-800 rounded-lg p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-mono">#{txOutputs[idx]}</span>
                  <span className="text-emerald-400 font-mono">{formatCKB(cell.capacity)}</span>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-1 text-stone-400">
                  <span>Lock:</span>
                  <span className="text-stone-300 font-mono truncate" title={cell.lock.codeHash}>
                    {scriptLabel(cell.lock)}
                  </span>
                  {cell.type && (
                    <>
                      <span>Type:</span>
                      <span className="text-stone-300 font-mono truncate" title={cell.type.codeHash}>
                        {scriptLabel(cell.type)}
                      </span>
                    </>
                  )}
                  <span>Data:</span>
                  <span className="text-stone-300 font-mono truncate">{dataPreview(cell.data)}</span>
                  {cell.dataMode === 'text' && (
                    <>
                      <span>Mode:</span>
                      <span className="text-stone-300">{cell.dataMode}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 pt-3 pb-4 border-t border-stone-800">
          <button
            onClick={handleCancel}
            className="flex-1 text-xs font-medium text-stone-400 hover:text-stone-200 bg-stone-800 hover:bg-stone-700 px-3 py-2 rounded-lg transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-all active:scale-95 shadow-sm"
          >
            Confirm & Send
          </button>
        </div>
      </div>
    </div>
  )
}
