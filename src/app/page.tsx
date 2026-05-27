'use client'

import { useEffect, useState, useRef } from 'react'
import { CellView } from '@/components/CellView'
import { CellEditor } from '@/components/CellEditor'
import { Toolbar } from '@/components/Toolbar'
import { TransactionFlow } from '@/components/TransactionFlow'
import { WalletConnect } from '@/components/WalletConnect'
import { CellTemplates } from '@/components/CellTemplates'
import { useSandbox } from '@/store/sandbox'
import type { NetworkMode, ViewMode } from '@/types'
import { deserializeCells } from '@/lib/share'

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
  const txInputs = useSandbox((s) => s.txInputs)
  const txOutputs = useSandbox((s) => s.txOutputs)
  const toggleTxInput = useSandbox((s) => s.toggleTxInput)
  const toggleTxOutput = useSandbox((s) => s.toggleTxOutput)

  const [showNetworkMenu, setShowNetworkMenu] = useState(false)
  const networkRef = useRef<HTMLDivElement>(null)

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
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b border-stone-800/80 bg-stone-950/40 backdrop-blur-sm min-w-0">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-bold text-stone-100 tracking-tight whitespace-nowrap">Cell Sandbox</span>
          <div className="relative" ref={networkRef}>
            <button
              onClick={() => setShowNetworkMenu(!showNetworkMenu)}
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 transition-all active:scale-95 ${
                network === 'testnet'
                  ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 hover:bg-emerald-800/40'
                  : 'bg-amber-900/40 text-amber-400 border border-amber-700/40 hover:bg-amber-800/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${network === 'testnet' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {network}
              </span>
            </button>
            {showNetworkMenu && (
              <div className="absolute top-full left-0 mt-1.5 bg-stone-800 border border-stone-700 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in min-w-[120px]">
                {(['testnet', 'mainnet'] as NetworkMode[]).map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setNetwork(n)
                      setShowNetworkMenu(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
                      network === n
                        ? 'bg-blue-900/30 text-blue-300'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${n === 'testnet' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="flex bg-stone-800/60 rounded-lg p-0.5 border border-stone-700/30 shrink-0">
            {(['builder', 'flow'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`text-xs px-2.5 sm:px-3 py-1 rounded-md transition-all whitespace-nowrap ${
                  viewMode === mode
                    ? 'bg-stone-700 text-stone-200 shadow-sm'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                {mode === 'builder' ? 'Cells' : 'Tx Flow'}
              </button>
            ))}
          </div>
          <span className="text-xs text-stone-500 font-mono shrink-0">
            {cells.length} cell{cells.length !== 1 && 's'}
            {selectedIndex !== null ? ` · #${selectedIndex}` : ''}
          </span>
        </div>
      </header>

      <div className="overflow-y-auto flex-1 min-h-0">
        <div className="px-4 sm:px-6 py-3 border-b border-stone-800/80 bg-stone-950/20">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <Toolbar />
            </div>
            <div className="flex items-start gap-1.5 shrink-0">
              <CellTemplates />
            </div>
          </div>
        </div>

        {viewMode === 'flow' && <TransactionFlow />}

        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-4 sm:p-6">
            {cells.length > 0 ? (
              <div className="flex flex-wrap gap-4 sm:gap-5 items-start">
                {cells.map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <CellView index={i} />
                    {viewMode === 'flow' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleTxInput(i)}
                          className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-all active:scale-95 ${
                            txInputs.includes(i)
                              ? 'bg-blue-600/90 text-white shadow-sm'
                              : 'bg-stone-800/50 text-stone-500 border border-stone-700/50 hover:border-blue-500/50 hover:text-stone-300'
                          }`}
                        >
                          Input
                        </button>
                        <button
                          onClick={() => toggleTxOutput(i)}
                          className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-all active:scale-95 ${
                            txOutputs.includes(i)
                              ? 'bg-emerald-600/90 text-white shadow-sm'
                              : 'bg-stone-800/50 text-stone-500 border border-stone-700/50 hover:border-emerald-500/50 hover:text-stone-300'
                          }`}
                        >
                          Output
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-stone-500">
                <svg className="w-8 h-8 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <p className="text-sm">No cells yet</p>
                <p className="text-xs text-stone-600">Click a template or <span className="text-blue-400">+ New Cell</span> to start</p>
              </div>
            )}
          </div>

          <aside className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-stone-800/80 bg-stone-950/20 flex flex-col">
            <div className="flex-1">
              <CellEditor />
            </div>
            <div className="px-4 pb-4">
              <WalletConnect />
            </div>
          </aside>
        </div>
      </div>

      <footer className="flex items-center justify-between px-6 py-2 border-t border-stone-800/80 bg-stone-950/20">
        <p className="text-xs text-stone-600">Cells consume CKB — capacity must cover occupied space</p>
        <a
          href="https://docs.nervos.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
        >
          CKB Docs ↗
        </a>
      </footer>
    </div>
  )
}
