'use client'

import { useSandbox } from '@/store/sandbox'

export function StartHerePanel() {
  const cells = useSandbox((s) => s.cells)
  const addCell = useSandbox((s) => s.addCell)
  const setSelectedIndex = useSandbox((s) => s.setSelectedIndex)
  const setShowGuide = useSandbox((s) => s.setShowGuide)
  const setViewMode = useSandbox((s) => s.setViewMode)

  function handleCreateCell() {
    if (cells.length === 0) {
      addCell()
    } else {
      setSelectedIndex(0)
    }
    setViewMode('design')
  }

  return (
    <section className="rounded-lg border border-stone-800 bg-stone-950/50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Start Here</p>
      <div className="mt-3 space-y-2">
        <button
          onClick={() => setShowGuide(true)}
          className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-left text-xs font-medium text-stone-200 transition-colors hover:border-emerald-700/60 hover:bg-emerald-950/20"
        >
          1. Open guide
          <span className="mt-1 block font-normal leading-5 text-stone-500">Understand the path before changing fields.</span>
        </button>
        <button
          onClick={handleCreateCell}
          className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-left text-xs font-medium text-stone-200 transition-colors hover:border-blue-700/60 hover:bg-blue-950/20"
        >
          2. Design or load a draft Cell
          <span className="mt-1 block font-normal leading-5 text-stone-500">Edit capacity, lock, type, and data before choosing how it enters a transaction.</span>
        </button>
        <button
          onClick={() => setViewMode('inspect')}
          className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-left text-xs font-medium text-stone-200 transition-colors hover:border-amber-700/60 hover:bg-amber-950/20"
        >
          3. Inspect a sample transaction
          <span className="mt-1 block font-normal leading-5 text-stone-500">Use the sample transaction to compare live input Cells with new output Cells.</span>
        </button>
      </div>
      <button
        onClick={() => setViewMode('build')}
        className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
      >
        Build Tx Flow
        <span className="mt-1 block font-normal text-emerald-100/80">Mark draft Cells as outputs, then connect a wallet to send.</span>
      </button>
    </section>
  )
}
