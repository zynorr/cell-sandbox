'use client'

import { useEffect, useRef, useState } from 'react'
import { CellView } from '@/components/CellView'
import { CellEditor } from '@/components/CellEditor'
import { Toolbar } from '@/components/Toolbar'
import { TransactionFlow } from '@/components/TransactionFlow'
import { WalletConnect } from '@/components/WalletConnect'
import { CellTemplates } from '@/components/CellTemplates'
import { GuidePanel } from '@/components/GuidePanel'
import { TransactionInspector } from '@/components/TransactionInspector'
import { LearnWorkspace } from '@/components/LearnWorkspace'
import { useSandbox } from '@/store/sandbox'
import type { NetworkMode, ViewMode } from '@/types'
import { deserializeCells } from '@/lib/share'

const WORKSPACES: Array<{ mode: ViewMode; label: string; short: string }> = [
  { mode: 'design', label: 'Cell Lab', short: 'Lab' },
  { mode: 'inspect', label: 'Transaction Explorer', short: 'Explore' },
  { mode: 'build', label: 'Build & Test', short: 'Build' },
]

function CellCanvas({ outputs = false }: { outputs?: boolean }) {
  const cells = useSandbox((s) => s.cells)
  const txOutputs = useSandbox((s) => s.txOutputs)
  const toggleTxOutput = useSandbox((s) => s.toggleTxOutput)

  return (
    <div className="cell-canvas">
      <div className="cell-canvas-head">
        <div>
          <p className="workspace-kicker">{outputs ? 'Proposed outputs' : 'Visual structure'}</p>
          <h2>{outputs ? 'Choose the Cells this transaction creates' : 'Select a Cell to open its layers'}</h2>
        </div>
        <div className="cell-legend" aria-label="Cell layer legend">
          <span><i className="bg-blue-400" />Lock</span>
          <span><i className="bg-amber-400" />Type</span>
          <span><i className="bg-emerald-400" />Data</span>
        </div>
      </div>
      <div className="flex min-h-64 flex-wrap content-start items-start gap-5 p-5 sm:p-8">
        {cells.map((_, index) => {
          const selected = txOutputs.includes(index)
          return (
            <div key={index} className={`cell-item ${selected ? 'is-output' : ''}`}>
              <CellView index={index} />
              <div className="flex items-center justify-between gap-3 border-t border-stone-800 px-3 py-2">
                <span className="text-xs font-medium text-stone-400">Cell {String(index + 1).padStart(2, '0')}</span>
                {outputs && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-300">
                    <input type="checkbox" checked={selected} onChange={() => toggleTxOutput(index)} />
                    Create
                  </label>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LabEntry({ onBlank }: { onBlank: () => void }) {
  const setShowTemplates = useSandbox((s) => s.setShowTemplates)
  const setViewMode = useSandbox((s) => s.setViewMode)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <CellTemplates trigger={false} />
      <div className="max-w-2xl">
        <p className="workspace-kicker">Cell Lab</p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-100">What would you like to explore?</h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">Begin with a readable example or deliberately open the full Cell structure. Nothing here is live on-chain until you build and sign a transaction.</p>
      </div>
      <div className="mt-8 grid gap-px overflow-hidden rounded-md border border-stone-800 bg-stone-800 md:grid-cols-2">
        <button onClick={() => setShowTemplates(true)} className="entry-choice">
          <span className="entry-number">01</span><strong>Start from an example</strong><small>Explore a transfer, DAO deposit, xUDT or authentication Cell.</small><b>Choose example -&gt;</b>
        </button>
        <button onClick={onBlank} className="entry-choice">
          <span className="entry-number">02</span><strong>Create a blank Cell</strong><small>Open the unrestricted canvas and define every layer yourself.</small><b>Open blank canvas -&gt;</b>
        </button>
        <button onClick={() => setViewMode('inspect')} className="entry-choice">
          <span className="entry-number">03</span><strong>Inspect a real transaction</strong><small>Trace consumed input Cells and the new output Cells they create.</small><b>Open Explorer -&gt;</b>
        </button>
        <button onClick={() => setViewMode('learn')} className="entry-choice">
          <span className="entry-number">04</span><strong>Continue the guided journey</strong><small>Learn the layers and state transition before editing raw fields.</small><b>Return to Journey -&gt;</b>
        </button>
      </div>
    </main>
  )
}

function CellLab() {
  const cells = useSandbox((s) => s.cells)
  const [blankOpened, setBlankOpened] = useState(false)
  const configured = cells.some((cell) => Boolean(cell.lock.codeHash || cell.type || cell.data !== '0x' || cell.outPoint))

  if (!configured && !blankOpened) return <LabEntry onBlank={() => setBlankOpened(true)} />

  return (
    <div className="flex min-h-full flex-col">
      <div className="workspace-toolbar">
        <Toolbar />
        <CellTemplates />
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <main className="min-w-0 p-4 sm:p-6"><CellCanvas /></main>
        <aside className="min-h-[32rem] border-t border-stone-800 bg-stone-950/40 lg:border-l lg:border-t-0"><CellEditor /></aside>
      </div>
    </div>
  )
}

function AppHeader() {
  const network = useSandbox((s) => s.network)
  const setNetwork = useSandbox((s) => s.setNetwork)
  const viewMode = useSandbox((s) => s.viewMode)
  const setViewMode = useSandbox((s) => s.setViewMode)
  const setShowGuide = useSandbox((s) => s.setShowGuide)
  const [showNetwork, setShowNetwork] = useState(false)
  const networkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(event: MouseEvent) {
      if (networkRef.current && !networkRef.current.contains(event.target as Node)) setShowNetwork(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <header className="app-header">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={() => setViewMode('learn')} className="brand-mark" aria-label="Open guided journey"><i />Cell Sandbox</button>
        <div className="relative" ref={networkRef}>
          <button onClick={() => setShowNetwork(!showNetwork)} className={`network-switch ${network}`}><i />{network}</button>
          {showNetwork && (
            <div className="absolute left-0 top-full z-40 mt-2 w-36 overflow-hidden rounded-md border border-stone-700 bg-stone-900 shadow-xl">
              {(['testnet', 'mainnet'] as NetworkMode[]).map((item) => <button key={item} onClick={() => { setNetwork(item); setShowNetwork(false) }} className="block w-full px-3 py-2 text-left text-xs capitalize text-stone-300 hover:bg-stone-800">{item}</button>)}
            </div>
          )}
        </div>
      </div>

      <nav className="app-nav" aria-label="Primary navigation">
        <button onClick={() => setViewMode('learn')} className={viewMode === 'learn' ? 'is-active' : ''}>Journey</button>
        <span className="nav-divider" />
        {WORKSPACES.map((item) => <button key={item.mode} onClick={() => setViewMode(item.mode)} className={viewMode === item.mode ? 'is-active' : ''}><span className="hidden sm:inline">{item.label}</span><span className="sm:hidden">{item.short}</span></button>)}
      </nav>

      <div className="hidden justify-self-end sm:block"><button onClick={() => setShowGuide(true)} className="secondary-button">Guide</button></div>
    </header>
  )
}

export default function Home() {
  const restoreCells = useSandbox((s) => s.restoreCells)
  const clearError = useSandbox((s) => s.clearError)
  const viewMode = useSandbox((s) => s.viewMode)
  const setViewMode = useSandbox((s) => s.setViewMode)
  const workspaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    clearError()
    const cells = deserializeCells(window.location.search)
    if (cells) {
      restoreCells(cells)
      setViewMode('design')
    }
  }, [clearError, restoreCells, setViewMode])

  useEffect(() => {
    workspaceRef.current?.scrollTo({ top: 0, left: 0 })
  }, [viewMode])

  return (
    <div className="flex h-full min-h-0 flex-col bg-stone-950">
      <AppHeader />
      <GuidePanel />
      <div ref={workspaceRef} className="min-h-0 flex-1 overflow-y-auto">
        {viewMode === 'learn' && <LearnWorkspace />}
        {viewMode === 'design' && <CellLab />}
        {viewMode === 'inspect' && (
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-6 max-w-2xl"><p className="workspace-kicker">Transaction Explorer</p><h1 className="mt-2 text-2xl font-semibold text-stone-100">Trace a real state transition</h1><p className="mt-2 text-sm leading-6 text-stone-400">Compare the live Cells a transaction consumed with the entirely new Cells it created.</p></div>
            <TransactionInspector />
          </main>
        )}
        {viewMode === 'build' && (
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="workspace-kicker">Build & Test</p><h1 className="mt-2 text-2xl font-semibold text-stone-100">Turn designed Cells into outputs</h1><p className="mt-2 text-sm text-stone-400">You choose what to create. CCC and the wallet complete funding, fee, and change.</p></div><CellTemplates /></div>
            <TransactionFlow />
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]"><CellCanvas outputs /><aside className="rounded-md border border-stone-800 bg-stone-900/40 p-4"><WalletConnect /></aside></div>
          </main>
        )}
      </div>
    </div>
  )
}
