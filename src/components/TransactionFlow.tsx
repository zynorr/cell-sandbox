'use client'

import { useMemo } from 'react'
import { useSandbox } from '@/store/sandbox'
import { formatCapacity } from '@/lib/ccc'
import { validateOutputCells, WALLET_FILLABLE_LOCK_ISSUE } from '@/lib/cellValidation'

function capacityOrZero(capacity: string | undefined): bigint {
  try {
    return BigInt(capacity ?? '0')
  } catch {
    return BigInt(0)
  }
}

function Step({ label, value, complete }: { label: string; value: string; complete: boolean }) {
  return (
    <div className="min-w-0 border-l border-stone-800 px-3 py-2 first:border-l-0">
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${complete ? 'text-emerald-400' : 'text-stone-600'}`}>{label}</p>
      <p className="mt-1 truncate text-xs text-stone-300" title={value}>{value}</p>
    </div>
  )
}

export function TransactionFlow() {
  const cells = useSandbox((state) => state.cells)
  const txOutputs = useSandbox((state) => state.txOutputs)
  const wallet = useSandbox((state) => state.wallet)
  const network = useSandbox((state) => state.network)
  const hasOutputs = txOutputs.length > 0

  const totalOut = useMemo(
    () => txOutputs.reduce((sum, index) => sum + capacityOrZero(cells[index]?.capacity), BigInt(0)),
    [cells, txOutputs]
  )
  const outputIssues = useMemo(
    () => validateOutputCells(
      txOutputs.flatMap((index) => cells[index] ? [{ index, cell: cells[index] }] : []),
      network
    ),
    [cells, network, txOutputs]
  )
  const walletWillFillLock = !wallet.connected && outputIssues.length > 0 && outputIssues.every(
    (issue) => issue.endsWith(WALLET_FILLABLE_LOCK_ISSUE)
  )
  const reviewReady = hasOutputs && wallet.connected && outputIssues.length === 0
  const status = !hasOutputs
    ? 'Choose at least one designed Cell as an output.'
    : walletWillFillLock
      ? 'Connect a wallet to fill empty output locks and fund the outputs.'
      : outputIssues.length > 0
        ? outputIssues[0]
        : !wallet.connected
          ? 'Outputs are ready. Connect a wallet to supply live input Cells.'
          : 'Ready to review and sign.'

  return (
    <section className="border-b border-stone-800">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Build transaction</p>
          <p className={`mt-1 text-xs leading-5 ${outputIssues.length > 0 && !walletWillFillLock ? 'text-amber-300' : 'text-stone-400'}`}>{status}</p>
        </div>
        <div className="grid overflow-hidden rounded-md border border-stone-800 sm:min-w-[29rem] sm:grid-cols-3">
          <Step label="Outputs" value={hasOutputs ? `${txOutputs.length} selected` : 'None selected'} complete={hasOutputs} />
          <Step label="Wallet" value={wallet.connected ? wallet.walletName : 'Not connected'} complete={wallet.connected} />
          <Step label="Review" value={reviewReady ? 'Ready' : 'Waiting'} complete={reviewReady} />
        </div>
      </div>

      <div className="grid items-stretch gap-2 border-t border-stone-800 bg-stone-950/30 p-4 sm:p-6 lg:grid-cols-[1fr_auto_1.25fr_auto_1fr]">
        <div className="border border-blue-800/40 bg-blue-950/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Inputs</p>
          <p className="mt-2 text-sm font-medium text-stone-200">
            {!hasOutputs
              ? 'Waiting for outputs'
              : outputIssues.length > 0 && !walletWillFillLock
                ? 'Waiting for valid outputs'
                : wallet.connected ? 'Selected during signing' : 'Selected after wallet connects'}
          </p>
          <p className="mt-1 text-xs leading-5 text-stone-500">CCC chooses spendable live Cells while completing the transaction.</p>
        </div>
        <span className="self-center text-center text-stone-600" aria-hidden="true">-&gt;</span>
        <div className="border border-stone-700 bg-stone-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">CCC transaction</p>
          <ol className="mt-2 space-y-1 font-mono text-xs leading-5 text-stone-300">
            <li>1. Transaction.from(outputs)</li>
            <li>2. completeInputsByCapacity(signer)</li>
            <li>3. completeFeeBy(signer, 1000)</li>
          </ol>
        </div>
        <span className="self-center text-center text-stone-600" aria-hidden="true">-&gt;</span>
        <div className="border border-emerald-800/40 bg-emerald-950/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Outputs</p>
          <p className="mt-2 text-sm font-medium text-stone-200">{txOutputs.length} Cell{txOutputs.length === 1 ? '' : 's'}</p>
          <p className="mt-1 font-mono text-xs text-emerald-300">{formatCapacity(totalOut)}</p>
          <p className="mt-1 text-xs text-stone-500">Fee and wallet change are added at signing.</p>
        </div>
      </div>
    </section>
  )
}
