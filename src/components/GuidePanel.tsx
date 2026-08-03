'use client'

import { useSandbox } from '@/store/sandbox'
import type { ViewMode } from '@/types'

const GUIDE_STEPS: Array<{
  title: string
  body: string
  mode: ViewMode
}> = [
  {
    title: 'Take the guided journey',
    body: 'Open the four Cell layers, follow a state transition, then connect the picture to CCC code.',
    mode: 'learn',
  },
  {
    title: 'Explore in Cell Lab',
    body: 'Begin with a readable example, load an on-chain Cell, or deliberately open the unrestricted blank canvas.',
    mode: 'design',
  },
  {
    title: 'Trace a transaction',
    body: 'Paste a transaction hash to compare the Cells referenced by its inputs with the new output Cells it creates.',
    mode: 'inspect',
  },
  {
    title: 'Build and test',
    body: 'Choose output Cells, validate them, then let CCC and the wallet complete inputs, fee, and change.',
    mode: 'build',
  },
]

export function GuidePanel() {
  const showGuide = useSandbox((s) => s.showGuide)
  const setShowGuide = useSandbox((s) => s.setShowGuide)
  const setViewMode = useSandbox((s) => s.setViewMode)

  if (!showGuide) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close guide"
        className="absolute inset-0 bg-black/60"
        onClick={() => setShowGuide(false)}
      />
      <aside className="relative h-full w-full max-w-md overflow-y-auto border-l border-stone-800 bg-stone-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">How to Use</p>
            <h2 className="mt-1 text-lg font-semibold text-stone-100">Choose the next useful step</h2>
          </div>
          <button
            onClick={() => setShowGuide(false)}
            className="rounded-md border border-stone-700 px-2 py-1 text-xs text-stone-400 transition-colors hover:border-stone-600 hover:text-stone-200"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {GUIDE_STEPS.map((step, index) => (
            <button
              key={step.title}
              onClick={() => {
                setViewMode(step.mode)
                setShowGuide(false)
              }}
              className="w-full rounded-lg border border-stone-800 bg-stone-900/50 p-3 text-left transition-colors hover:border-stone-700 hover:bg-stone-900"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-[10px] font-semibold text-stone-300">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-stone-100">{step.title}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-400">{step.body}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-blue-900/40 bg-blue-950/20 p-3">
          <p className="text-xs font-medium text-blue-200">Key mental model</p>
          <p className="mt-1 text-xs leading-5 text-stone-400">
            A valid CKB transaction consumes Cells that are live before the transaction and creates new output Cells. Once committed, each consumed Cell is dead and cannot be used again.
          </p>
        </div>
      </aside>
    </div>
  )
}
