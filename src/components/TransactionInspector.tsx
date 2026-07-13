'use client'

import { useState } from 'react'
import { useSandbox } from '@/store/sandbox'
import { formatCapacity } from '@/lib/ccc'
import { txHashSchema } from '@/lib/schemas'
import { KNOWN_SCRIPTS } from '@/lib/script'
import { loadTransactionFromChain, type InspectedCell, type InspectedTransaction } from '@/lib/transaction'
import { SAMPLE_PUDGE_TX_HASH } from '@/lib/examples'
import type { ScriptState } from '@/types'

function shortHash(value: string): string {
  if (!value) return 'None'
  if (value.length <= 18) return value
  return `${value.slice(0, 10)}...${value.slice(-6)}`
}

function scriptLabel(script: ScriptState | null): string {
  if (!script) return 'None'
  const known = KNOWN_SCRIPTS.find(
    (item) =>
      item.codeHash.toLowerCase() === script.codeHash.toLowerCase() &&
      item.hashType === script.hashType
  )
  return known ? known.name : `${shortHash(script.codeHash)} (${script.hashType})`
}

function dataLabel(data: string): string {
  if (!data || data === '0x') return 'Empty'
  const bytes = Math.max(0, Math.ceil((data.startsWith('0x') ? data.length - 2 : data.length) / 2))
  return `${bytes} bytes`
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${tone ?? 'text-stone-200'}`}>{value}</p>
    </div>
  )
}

function CellSummary({ item, role }: { item: InspectedCell; role: 'input' | 'output' }) {
  const tone = role === 'input'
    ? 'border-blue-800/50 bg-blue-950/10'
    : 'border-emerald-800/50 bg-emerald-950/10'

  if (!item.cell) {
    return (
      <div className={`rounded-lg border p-3 ${tone}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-stone-200">
            {role === 'input' ? 'Input' : 'Output'} #{item.index}
          </p>
          {item.outPoint && (
            <span className="font-mono text-[10px] text-stone-500">
              {shortHash(item.outPoint.txHash)}:{item.outPoint.index}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs leading-5 text-amber-300">
          {item.unresolvedReason ?? 'Cell details are not available.'}
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-stone-200">
          {role === 'input' ? 'Input' : 'Output'} #{item.index}
        </p>
        {item.outPoint && (
          <span className="font-mono text-[10px] text-stone-500">
            {shortHash(item.outPoint.txHash)}:{item.outPoint.index}
          </span>
        )}
      </div>
      <dl className="mt-2 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-stone-500">Capacity</dt>
        <dd className="font-mono text-stone-200">{formatCapacity(item.cell.capacity)}</dd>
        <dt className="text-stone-500">Lock</dt>
        <dd className="truncate text-stone-300" title={item.cell.lock.codeHash}>{scriptLabel(item.cell.lock)}</dd>
        <dt className="text-stone-500">Type</dt>
        <dd className="truncate text-stone-300" title={item.cell.type?.codeHash}>{scriptLabel(item.cell.type)}</dd>
        <dt className="text-stone-500">Data</dt>
        <dd className="font-mono text-stone-300">{dataLabel(item.cell.data)}</dd>
      </dl>
    </div>
  )
}

export function TransactionInspector() {
  const network = useSandbox((s) => s.network)
  const setNetwork = useSandbox((s) => s.setNetwork)
  const [txHash, setTxHash] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InspectedTransaction | null>(null)

  async function inspectHash(nextHash: string, targetNetwork = network) {
    const parsed = txHashSchema.safeParse(nextHash)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      setResult(null)
      return
    }

    setIsLoading(true)
    setError(null)
    const loaded = await loadTransactionFromChain(parsed.data, targetNetwork)
    setIsLoading(false)

    if (typeof loaded === 'string') {
      setError(loaded)
      setResult(null)
      return
    }

    setResult(loaded)
  }

  async function handleInspect(e: React.FormEvent) {
    e.preventDefault()
    await inspectHash(txHash)
  }

  async function handleSampleTx() {
    setTxHash(SAMPLE_PUDGE_TX_HASH)
    if (network !== 'testnet') setNetwork('testnet')
    await inspectHash(SAMPLE_PUDGE_TX_HASH, 'testnet')
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950/40 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="tx-hash-input" className="text-xs font-medium text-stone-400">Transaction Hash</label>
            <form onSubmit={handleInspect} className="mt-1.5 flex gap-2">
              <input
                id="tx-hash-input"
                value={txHash}
                onChange={(event) => {
                  setTxHash(event.target.value)
                  setError(null)
                }}
                placeholder={`0x... (${network})`}
                className="min-w-0 flex-1 rounded-lg border border-stone-700/60 bg-stone-900 px-3 py-2 font-mono text-xs text-stone-200 placeholder-stone-600 transition-colors focus:border-emerald-600/70 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Loading' : 'Inspect'}
              </button>
            </form>
          </div>
          <div className="rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2 text-xs leading-5 text-stone-500 lg:w-72">
            A transaction is a state transition: live input Cells are consumed and new output Cells are created.
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handleSampleTx}
            disabled={isLoading}
            className="rounded-lg border border-blue-800/50 bg-blue-950/20 px-3 py-1.5 font-medium text-blue-200 transition-colors hover:border-blue-700 hover:bg-blue-950/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open sample Pudge transaction
          </button>
          <span className="font-mono text-[10px] text-stone-600">{shortHash(SAMPLE_PUDGE_TX_HASH)}</span>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-red-800/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
      </div>

      {!result && !isLoading && !error && (
        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="No transaction loaded" value="Paste or sample" tone="text-stone-300" />
          <SummaryCard label="Inputs" value="Waiting" tone="text-blue-300" />
          <SummaryCard label="Outputs" value="Waiting" tone="text-emerald-300" />
          <SummaryCard label="Fee" value="Waiting" tone="text-amber-300" />
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border border-blue-800/40 bg-blue-950/20 p-4 text-sm text-blue-200">
          Fetching transaction details and resolving referenced input Cells...
        </div>
      )}

      {result && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <SummaryCard label="Inputs" value={`${result.inputCells.length} Cells`} tone="text-blue-300" />
            <SummaryCard label="Outputs" value={`${result.outputCells.length} Cells`} tone="text-emerald-300" />
            <SummaryCard
              label="Capacity Flow"
              value={`${formatCapacity(result.inputCapacity)} -> ${formatCapacity(result.outputCapacity)}`}
              tone="text-stone-200"
            />
            <SummaryCard
              label="Fee"
              value={result.fee === null ? 'Partial inputs' : formatCapacity(result.fee)}
              tone="text-amber-300"
            />
          </div>

          <div className="rounded-lg border border-stone-800 bg-stone-950/40 p-3">
            <div className="flex flex-col gap-2 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>Status: <span className="text-stone-300">{result.status}</span></span>
                <span>Cell deps: <span className="text-stone-300">{result.cellDeps}</span></span>
                {result.blockNumber && <span>Block: <span className="text-stone-300">#{result.blockNumber}</span></span>}
                {result.unresolvedInputs > 0 && (
                  <span className="text-amber-300">{result.unresolvedInputs} unresolved input{result.unresolvedInputs === 1 ? '' : 's'}</span>
                )}
              </div>
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 transition-colors hover:text-stone-200"
              >
                Open explorer
              </a>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-lg border border-stone-800 bg-stone-950/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-blue-200">Input Cells Consumed</h3>
                <span className="text-[10px] uppercase tracking-wider text-stone-500">old state</span>
              </div>
              <div className="mt-3 space-y-2">
                {result.inputCells.map((item) => (
                  <CellSummary key={`${item.outPoint?.txHash}-${item.outPoint?.index}-${item.index}`} item={item} role="input" />
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-stone-800 bg-stone-950/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-emerald-200">Output Cells Created</h3>
                <span className="text-[10px] uppercase tracking-wider text-stone-500">new state</span>
              </div>
              <div className="mt-3 space-y-2">
                {result.outputCells.map((item) => (
                  <CellSummary key={`${item.outPoint?.txHash}-${item.outPoint?.index}-${item.index}`} item={item} role="output" />
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  )
}
