'use client'

import { useSandbox } from '@/store/sandbox'
import { useState } from 'react'
import { buildShareUrl, copyToClipboard } from '@/lib/share'
import { outpointSchema } from '@/lib/schemas'

function PlusIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2v8M2 6h8" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5.5 3.5l1-1A2.12 2.12 0 019.5 5.5l-1 1M6.5 8.5l-1 1a2.12 2.12 0 01-3-3l1-1" />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 3L1 6l3 3M8 3l3 3-3 3" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 6a4 4 0 114 4M2 6V3m0 3h3" />
    </svg>
  )
}

export function Toolbar() {
  const store = useSandbox()
  const [localError, setLocalError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [codePreview, setCodePreview] = useState(false)

  function handleLoad(e: React.FormEvent) {
    e.preventDefault()
    const input = store.loadOutpointInput.trim()
    if (!input) return

    const result = outpointSchema.safeParse(input)
    if (!result.success) {
      setLocalError(result.error.issues[0].message)
      return
    }

    setLocalError(null)
    store.loadFromChain()
  }

  function handleExport() {
    const code = store.exportAsCode()
    copyToClipboard(code)
    setCopied('code')
    setCodePreview(true)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleShare() {
    const url = buildShareUrl(store.cells)
    copyToClipboard(url)
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }

  const inputError = store.error || localError

  return (
    <div className="space-y-2.5">
      <form onSubmit={handleLoad} className="flex items-center gap-2">
        <input
          type="text"
          value={store.loadOutpointInput}
          onChange={(e) => {
            store.setLoadOutpointInput(e.target.value)
            setLocalError(null)
            if (store.error) store.clearError()
          }}
          placeholder={`txHash:index  (load from ${store.network})`}
          className="flex-1 min-w-[200px] bg-stone-800/50 border border-stone-700/50 rounded-lg px-3 py-1.5 text-xs font-mono text-stone-300 placeholder-stone-600 focus:outline-none focus:border-blue-500/50 focus:bg-stone-800 transition-colors"
        />
        <button
          type="submit"
          disabled={store.isLoading}
          className="text-xs font-medium text-stone-200 bg-stone-700 hover:bg-stone-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
        >
          {store.isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse-soft" />
              Loading
            </span>
          ) : (
            'Load'
          )}
        </button>
      </form>

      {inputError && (
        <div className="text-xs text-red-400 bg-red-900/15 border border-red-800/20 rounded-lg px-3 py-1.5 animate-fade-in">
          {inputError}
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => store.addCell()}
          className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-all active:scale-95"
        >
          <PlusIcon />
          New Cell
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs font-medium bg-stone-700 hover:bg-stone-600 text-stone-200 px-3 py-1.5 rounded-lg transition-all active:scale-95"
        >
          {copied === 'link' ? (
            <span className="text-green-400">Copied!</span>
          ) : (
            <>
              <LinkIcon />
              Copy Link
            </>
          )}
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-medium bg-stone-700 hover:bg-stone-600 text-stone-200 px-3 py-1.5 rounded-lg transition-all active:scale-95"
        >
          {copied === 'code' ? (
            <span className="text-green-400">Copied!</span>
          ) : (
            <>
              <CodeIcon />
              Export Code
            </>
          )}
        </button>
        <button
          onClick={store.resetCells}
          className="flex items-center gap-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-700/50 px-3 py-1.5 rounded-lg transition-all active:scale-95"
        >
          <ResetIcon />
          Reset
        </button>
      </div>

      {codePreview && (
        <div className="relative animate-fade-in">
          <pre className="text-xs text-stone-400 bg-stone-800/30 border border-stone-700/50 rounded-lg p-3 overflow-x-auto max-h-48 font-mono">
            {store.exportAsCode()}
          </pre>
          <button
            onClick={() => setCodePreview(false)}
            className="absolute top-2 right-2 text-stone-600 hover:text-stone-400 transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
