'use client'

import { useMemo, useState } from 'react'
import { useSandbox } from '@/store/sandbox'
import { formatCapacity } from '@/lib/ccc'
import { validateOutputCells, WALLET_FILLABLE_LOCK_ISSUE } from '@/lib/cellValidation'

function capacityOrZero(capacity: string | undefined): bigint {
  try { return BigInt(capacity ?? '0') } catch { return BigInt(0) }
}

export function TransactionFlow() {
  const cells = useSandbox((state) => state.cells)
  const txOutputs = useSandbox((state) => state.txOutputs)
  const wallet = useSandbox((state) => state.wallet)
  const network = useSandbox((state) => state.network)
  const setViewMode = useSandbox((state) => state.setViewMode)
  const [showCode, setShowCode] = useState(false)
  const hasOutputs = txOutputs.length > 0
  const totalOut = useMemo(() => txOutputs.reduce((sum, index) => sum + capacityOrZero(cells[index]?.capacity), BigInt(0)), [cells, txOutputs])
  const outputIssues = useMemo(() => validateOutputCells(txOutputs.flatMap((index) => cells[index] ? [{ index, cell: cells[index] }] : []), network), [cells, network, txOutputs])
  const walletWillFillLock = !wallet.connected && outputIssues.length > 0 && outputIssues.every((issue) => issue.endsWith(WALLET_FILLABLE_LOCK_ISSUE))
  const outputsValid = hasOutputs && (outputIssues.length === 0 || walletWillFillLock)
  const currentStage = !hasOutputs ? 0 : !outputsValid ? 1 : !wallet.connected ? 2 : 3
  const stages = [
    ['Outputs', hasOutputs ? `${txOutputs.length} selected` : 'Choose Cells'],
    ['Validate', !hasOutputs ? 'Waiting' : outputsValid ? 'Passed' : 'Needs attention'],
    ['Fund', wallet.connected ? wallet.walletName : 'Connect wallet'],
    ['Review', wallet.connected && outputIssues.length === 0 ? 'Ready' : 'Waiting'],
  ]

  return (
    <section className="overflow-hidden rounded-md border border-stone-800 bg-stone-900/30">
      <ol className="grid grid-cols-2 border-b border-stone-800 sm:grid-cols-4">
        {stages.map(([label, value], index) => (
          <li key={label} className={`min-w-0 border-r border-stone-800 p-3 last:border-r-0 ${index === currentStage ? 'bg-stone-800/60' : ''}`}>
            <div className="flex items-center gap-2"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${index < currentStage ? 'border-emerald-700 bg-emerald-950 text-emerald-300' : index === currentStage ? 'border-stone-500 text-stone-100' : 'border-stone-700 text-stone-600'}`}>{index < currentStage ? 'OK' : index + 1}</span><p className="truncate text-xs font-semibold text-stone-300">{label}</p></div>
            <p className="mt-1 truncate pl-7 text-[11px] text-stone-500" title={value}>{value}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-semibold text-stone-200">
            {!hasOutputs ? 'Start by choosing output Cells below.' : !outputsValid ? 'One of the selected outputs needs attention.' : !wallet.connected ? 'Outputs are ready for wallet funding.' : 'The transaction is ready for final review.'}
          </p>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            {!hasOutputs ? 'These are the new Cells the transaction will create.' : !outputsValid ? outputIssues[0] : !wallet.connected ? 'CCC will select spendable live Cells, calculate the fee and return change.' : `${formatCapacity(totalOut)} across ${txOutputs.length} proposed output${txOutputs.length === 1 ? '' : 's'}.`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button onClick={() => setViewMode('design')} className="secondary-button">Edit in Cell Lab</button>
          <button onClick={() => setShowCode(!showCode)} className="secondary-button">{showCode ? 'Hide CCC code' : 'View CCC code'}</button>
        </div>
      </div>

      {showCode && (
        <div className="grid border-t border-stone-800 bg-stone-950 sm:grid-cols-[1fr_14rem]">
          <pre className="overflow-x-auto p-4 text-xs leading-6 text-stone-300"><code>{`const tx = ccc.Transaction.from({ outputs, outputsData })
await tx.completeInputsByCapacity(signer)
await tx.completeFeeBy(signer, 1000)`}</code></pre>
          <div className="border-t border-stone-800 p-4 text-xs leading-5 text-stone-500 sm:border-l sm:border-t-0">The picture proposes outputs. CCC completes inputs, fee and wallet change before signing.</div>
        </div>
      )}
    </section>
  )
}
