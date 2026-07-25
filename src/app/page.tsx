'use client'

import { useEffect, useRef, useState } from 'react'
import { CellView } from '@/components/CellView'
import { CellEditor } from '@/components/CellEditor'
import { Toolbar } from '@/components/Toolbar'
import { TransactionFlow } from '@/components/TransactionFlow'
import { WalletConnect } from '@/components/WalletConnect'
import { CellTemplates } from '@/components/CellTemplates'
import { GuidePanel } from '@/components/GuidePanel'
import { StartHerePanel } from '@/components/StartHerePanel'
import { CellConceptPanel } from '@/components/CellConceptPanel'
import { TransactionInspector } from '@/components/TransactionInspector'
import { WorkspaceStatus } from '@/components/WorkspaceStatus'
import { useSandbox } from '@/store/sandbox'
import type { NetworkMode, ViewMode } from '@/types'
import { deserializeCells } from '@/lib/share'

const NAV_ITEMS: Array<{ mode: ViewMode; label: string }> = [
  { mode: 'learn', label: 'Learn' },
  { mode: 'design', label: 'Design Cells' },
  { mode: 'inspect', label: 'Inspect Tx' },
  { mode: 'build', label: 'Build Tx' },
]

function EmptyCellsState() {
  const addCell = useSandbox((s) => s.addCell)
  const setShowTemplates = useSandbox((s) => s.setShowTemplates)

  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-stone-800 bg-stone-950/40 p-6 text-center">
      <svg className="h-9 w-9 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <p className="mt-3 text-sm font-medium text-stone-300">No Cells yet</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-stone-500">
        Create a blank Cell or choose a template to start exploring capacity, scripts, and data.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => addCell()}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
        >
          New Cell
        </button>
        <button
          onClick={() => setShowTemplates(true)}
          className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-200 transition-colors hover:border-stone-600"
        >
          Templates
        </button>
      </div>
    </div>
  )
}

function CellCanvas({ showOutputControls }: { showOutputControls: boolean }) {
  const cells = useSandbox((s) => s.cells)
  const txOutputs = useSandbox((s) => s.txOutputs)
  const toggleTxOutput = useSandbox((s) => s.toggleTxOutput)

  if (cells.length === 0) return <EmptyCellsState />

  return (
    <div className="flex flex-wrap items-start gap-4 sm:gap-5">
      {cells.map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <CellView index={i} />
          {showOutputControls && (
            <div>
              <button
                onClick={() => toggleTxOutput(i)}
                aria-label={`${txOutputs.includes(i) ? 'Remove' : 'Mark'} Cell #${i} ${txOutputs.includes(i) ? 'from' : 'as'} transaction output`}
                title={`${txOutputs.includes(i) ? 'Remove' : 'Mark'} Cell #${i} ${txOutputs.includes(i) ? 'from' : 'as'} transaction output`}
                className={`min-w-24 rounded-md px-2.5 py-1 text-[10px] font-medium transition-all active:scale-95 ${
                  txOutputs.includes(i)
                    ? 'bg-emerald-600/90 text-white shadow-sm'
                    : 'border border-stone-700/50 bg-stone-800/50 text-stone-500 hover:border-emerald-500/50 hover:text-stone-300'
                }`}
              >
                {txOutputs.includes(i) ? 'Output added' : 'Add output'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function EditorAside() {
  return (
    <aside className="flex w-full flex-col border-t border-stone-800/80 bg-stone-950/20 lg:w-80 lg:border-l lg:border-t-0 xl:w-96">
      <div className="flex-1">
        <CellEditor />
      </div>
      <div className="px-4 pb-4">
        <WalletConnect />
      </div>
    </aside>
  )
}

function ToolbarBand() {
  return (
    <div className="border-b border-stone-800/80 bg-stone-950/20 px-4 py-3 sm:px-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
        <div className="min-w-0 flex-1">
          <Toolbar />
        </div>
        <div className="flex shrink-0 items-start gap-1.5 sm:pt-0">
          <CellTemplates />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const restoreCells = useSandbox((s) => s.restoreCells)
  const clearError = useSandbox((s) => s.clearError)

  useEffect(() => {
    clearError()
    const cells = deserializeCells(window.location.search)
    if (cells) restoreCells(cells)
  }, [restoreCells, clearError])

  const cells = useSandbox((s) => s.cells)
  const selectedIndex = useSandbox((s) => s.selectedIndex)
  const network = useSandbox((s) => s.network)
  const setNetwork = useSandbox((s) => s.setNetwork)
  const viewMode = useSandbox((s) => s.viewMode)
  const setViewMode = useSandbox((s) => s.setViewMode)
  const setShowGuide = useSandbox((s) => s.setShowGuide)

  const [showNetworkMenu, setShowNetworkMenu] = useState(false)
  const networkRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    workspaceRef.current?.scrollTo({ top: 0, left: 0 })
  }, [viewMode])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (networkRef.current && !networkRef.current.contains(e.target as Node)) {
        setShowNetworkMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-800/80 bg-stone-950/60 px-4 py-2.5 backdrop-blur-sm sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 whitespace-nowrap text-base font-bold tracking-tight text-stone-100">Cell Sandbox</span>
            <div className="relative" ref={networkRef}>
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-all active:scale-95 ${
                  network === 'testnet'
                    ? 'border border-emerald-700/40 bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/40'
                    : 'border border-amber-700/40 bg-amber-900/40 text-amber-400 hover:bg-amber-800/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${network === 'testnet' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {network}
                </span>
              </button>
              {showNetworkMenu && (
                <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[120px] overflow-hidden rounded-lg border border-stone-700 bg-stone-800 shadow-xl animate-fade-in">
                  {(['testnet', 'mainnet'] as NetworkMode[]).map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setNetwork(n)
                        setShowNetworkMenu(false)
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors ${
                        network === n
                          ? 'bg-blue-900/30 text-blue-300'
                          : 'text-stone-400 hover:bg-stone-700/50 hover:text-stone-200'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${n === 'testnet' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <nav className="flex min-w-0 flex-wrap gap-1 rounded-lg border border-stone-800 bg-stone-900/60 p-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.mode}
                onClick={() => setViewMode(item.mode)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === item.mode
                    ? 'bg-stone-700 text-stone-100 shadow-sm'
                    : 'text-stone-500 hover:bg-stone-800 hover:text-stone-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:border-emerald-700 hover:bg-emerald-950/40"
            >
              How to Use
            </button>
            <span className="shrink-0 font-mono text-xs text-stone-500">
              {cells.length} cell{cells.length !== 1 && 's'}
              {selectedIndex !== null ? ` - #${selectedIndex}` : ''}
            </span>
          </div>
        </div>
      </header>

      <GuidePanel />

      <div ref={workspaceRef} className="min-h-0 flex-1 overflow-y-auto">
        {viewMode === 'learn' && (
          <div className="grid gap-4 p-4 lg:grid-cols-[16rem_1fr] xl:grid-cols-[16rem_1fr_22rem]">
            <StartHerePanel />
            <main className="min-w-0 space-y-4">
              <section className="rounded-lg border border-stone-800 bg-stone-950/40 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Learning Flow</p>
                <h1 className="mt-1 text-lg font-semibold text-stone-100">See the Cell model before writing code</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
                  Start with the Cell fields, design or load a Cell, inspect real transactions, then build a transaction flow once the state transition makes sense.
                </p>
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
                    <p className="text-xs font-semibold text-stone-200">CCC Playground</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">Code-first: write TypeScript, then see the transaction.</p>
                  </div>
                  <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
                    <p className="text-xs font-semibold text-stone-200">CCC App</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">Task-first: choose a known operation and fill its parameters.</p>
                  </div>
                  <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3">
                    <p className="text-xs font-semibold text-emerald-200">Cell Sandbox</p>
                    <p className="mt-1 text-xs leading-5 text-stone-400">Design-first: shape Cells visually, inspect inputs and outputs, then export or send.</p>
                  </div>
                </div>
              </section>
              <CellConceptPanel />
            </main>
            <div className="space-y-4 lg:col-span-2 xl:col-span-1">
              <CellEditor />
              <div className="px-0">
                <WalletConnect />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'design' && (
          <>
            <ToolbarBand />
            <div className="flex flex-col lg:flex-row">
              <main className="flex-1 p-4 sm:p-6">
                <CellCanvas showOutputControls={false} />
              </main>
              <EditorAside />
            </div>
          </>
        )}

        {viewMode === 'inspect' && (
          <div className="grid gap-4 p-4 lg:grid-cols-[16rem_1fr]">
            <StartHerePanel />
            <main className="min-w-0">
              <TransactionInspector />
            </main>
          </div>
        )}

        {viewMode === 'build' && (
          <>
            <ToolbarBand />
            <TransactionFlow />
            <div className="flex flex-col lg:flex-row">
              <main className="flex-1 p-4 sm:p-6">
                <CellCanvas showOutputControls />
              </main>
              <EditorAside />
            </div>
          </>
        )}
      </div>

      <WorkspaceStatus />
    </div>
  )
}
