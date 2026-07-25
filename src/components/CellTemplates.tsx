'use client'

import { useSandbox } from '@/store/sandbox'
import { CELL_TEMPLATES } from '@/lib/templates'
import { formatCapacityExact } from '@/lib/ccc'

export function CellTemplates() {
  const showTemplates = useSandbox((s) => s.showTemplates)
  const setShowTemplates = useSandbox((s) => s.setShowTemplates)
  const applyTemplate = useSandbox((s) => s.applyTemplate)
  const cells = useSandbox((s) => s.cells)
  const wallet = useSandbox((s) => s.wallet)
  const viewMode = useSandbox((s) => s.viewMode)
  const setViewMode = useSandbox((s) => s.setViewMode)

  const sections = [
    { label: 'Build templates', templates: CELL_TEMPLATES.filter((template) => template.sendable) },
    { label: 'Design examples', templates: CELL_TEMPLATES.filter((template) => !template.sendable) },
  ]

  function handleApply(tpl: typeof CELL_TEMPLATES[number]) {
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

  function statusLabel(tpl: typeof CELL_TEMPLATES[number]): string {
    if (!tpl.sendable) return viewMode === 'build' ? 'Opens Design' : 'Design only'
    if (tpl.requiresWalletLock && !wallet.lockScript) return 'Wallet required'
    return viewMode === 'build' ? 'Adds output' : 'Build ready'
  }

  if (!showTemplates) {
    return (
      <button
        onClick={() => setShowTemplates(true)}
        className="flex items-center gap-1.5 text-xs font-medium bg-stone-700 hover:bg-stone-600 text-stone-200 px-3 py-1.5 rounded-lg transition-all active:scale-95"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2h3v3H2zM7 2h3v3H7zM2 7h3v3H2zM7 7h3v3H7z" />
        </svg>
        Templates
      </button>
    )
  }

  return (
    <div className="animate-fade-in space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Cell Templates
        </span>
        <button
          onClick={() => setShowTemplates(false)}
          className="text-xs text-stone-500 hover:text-stone-400 transition-colors"
        >
          Close
        </button>
      </div>

      <p className="text-[10px] text-stone-500 leading-relaxed">
        {viewMode === 'build'
          ? 'Build templates replace the workspace and become outputs. Design examples open Design Cells. Existing Tx selections are cleared.'
          : 'Selecting a template replaces the current workspace. Build-ready templates can become outputs in Build Tx.'}
      </p>

      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1.5 font-medium">
              {section.label}
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {section.templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleApply(tpl)}
                  className={`text-left p-2.5 rounded-lg border transition-all hover:bg-stone-700/50 active:scale-[0.98] ${
                    cells.length === tpl.cells.length &&
                    cells.every((c, i) => c.capacity === tpl.cells[i]?.capacity)
                      ? 'border-blue-500/30 bg-stone-800'
                      : 'border-stone-700/30 bg-stone-800/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-stone-200">{tpl.name}</div>
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
                  <div className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">
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
  )
}
