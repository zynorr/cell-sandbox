'use client'

import { useSandbox } from '@/store/sandbox'
import { getCellTemplates, type CellTemplate } from '@/lib/templates'
import { formatCapacityExact } from '@/lib/ccc'

export function CellTemplates({ trigger = true }: { trigger?: boolean }) {
  const showTemplates = useSandbox((s) => s.showTemplates)
  const setShowTemplates = useSandbox((s) => s.setShowTemplates)
  const applyTemplate = useSandbox((s) => s.applyTemplate)
  const cells = useSandbox((s) => s.cells)
  const wallet = useSandbox((s) => s.wallet)
  const viewMode = useSandbox((s) => s.viewMode)
  const setViewMode = useSandbox((s) => s.setViewMode)
  const network = useSandbox((s) => s.network)
  const templates = getCellTemplates(network)

  const sections = [
    { label: 'Build templates', templates: templates.filter((template) => template.sendable) },
    { label: 'Design examples', templates: templates.filter((template) => !template.sendable) },
  ]

  function handleApply(tpl: CellTemplate) {
    const applied = tpl.cells.map((c) => {
      if (tpl.requiresWalletLock && wallet.lockScript && (!c.lock.args || c.lock.args === '0x')) {
        return { ...c, lock: { ...wallet.lockScript } }
      }
      return c
    })
    const asOutputs = viewMode === 'build' && Boolean(tpl.sendable)
    applyTemplate(applied, { asOutputs })
    if (viewMode === 'build' && !tpl.sendable) setViewMode('design')
  }

  function statusLabel(tpl: CellTemplate): string {
    if (!tpl.sendable) return viewMode === 'build' ? 'Opens Design' : 'Design only'
    if (tpl.requiresWalletLock && !wallet.lockScript) return 'Wallet fills lock'
    return viewMode === 'build' ? 'Adds output' : 'Build ready'
  }

  if (!showTemplates) {
    if (!trigger) return null
    return (
      <button
        onClick={() => setShowTemplates(true)}
        className="secondary-button"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2h3v3H2zM7 2h3v3H7zM2 7h3v3H2zM7 7h3v3H7z" />
        </svg>
        Templates
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close templates" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTemplates(false)} />
      <section className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-stone-700 bg-stone-900 shadow-2xl animate-fade-in">
        <div className="flex items-start justify-between border-b border-stone-800 p-5">
          <div>
            <span className="text-xs font-semibold uppercase text-emerald-400">Start from an example</span>
            <h2 className="mt-1 text-xl font-semibold text-stone-100">Choose a Cell to explore</h2>
          </div>
          <button onClick={() => setShowTemplates(false)} className="secondary-button">Close</button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">

      <p className="text-sm text-stone-400 leading-6">
        {viewMode === 'build'
          ? 'Build templates replace the workspace and become outputs. Design examples open Design Cells. Existing Tx selections are cleared.'
          : 'Selecting a template replaces the current workspace. Build-ready templates can become outputs in Build Tx.'}
      </p>

      <div className="mt-5 space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="mb-2 text-xs font-semibold uppercase text-stone-500">
              {section.label}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {section.templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleApply(tpl)}
                  className={`min-h-36 text-left p-4 rounded-md border transition-colors hover:bg-stone-800 ${
                    cells.length === tpl.cells.length &&
                    cells.every((c, i) => c.capacity === tpl.cells[i]?.capacity)
                      ? 'border-blue-500/30 bg-stone-800'
                      : 'border-stone-700/30 bg-stone-800/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-stone-100">{tpl.name}</div>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider ${
                      tpl.sendable
                        ? tpl.requiresWalletLock && !wallet.lockScript
                          ? 'bg-amber-900/40 text-amber-300'
                          : 'bg-emerald-900/40 text-emerald-300'
                        : 'bg-stone-800 text-stone-500'
                    }`}>
                      {statusLabel(tpl)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-stone-400 leading-5">
                    {tpl.description}
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    {tpl.cells.map((c, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-stone-700/50 text-stone-400 font-mono"
                      >
                        {formatCapacityExact(c.capacity)}
                      </span>
                    ))}
                    {tpl.cells.length > 1 && (
                      <span className="text-[9px] text-stone-500 self-center">
                        +{tpl.cells.length - 1} more
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        </div>
        </div>
      </section>
    </div>
  )
}
