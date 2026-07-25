'use client'

import { CellView } from './CellView'
import { useSandbox } from '@/store/sandbox'

const CONCEPTS = [
  {
    title: 'Capacity',
    body: 'Uint64 amount in shannons: both the CKByte value and byte budget for the complete Cell.',
    tone: 'border-emerald-800/40 bg-emerald-950/20 text-emerald-200',
  },
  {
    title: 'Lock Script',
    body: 'Required spending condition, executed when the Cell is consumed as an input.',
    tone: 'border-blue-800/40 bg-blue-950/20 text-blue-200',
  },
  {
    title: 'Type Script',
    body: 'Optional application rule checked for matching input and output Cells.',
    tone: 'border-violet-800/40 bg-violet-950/20 text-violet-200',
  },
  {
    title: 'Data',
    body: 'Application bytes stored in outputs_data at the same index as the Cell output.',
    tone: 'border-amber-800/40 bg-amber-950/20 text-amber-200',
  },
]

export function CellConceptPanel() {
  const cells = useSandbox((s) => s.cells)
  const selectedIndex = useSandbox((s) => s.selectedIndex)
  const activeIndex = selectedIndex ?? 0
  const activeCell = cells[activeIndex]

  return (
    <section className="rounded-lg border border-stone-800 bg-stone-950/40 p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="flex min-h-[220px] flex-1 items-center justify-center rounded-lg border border-stone-800 bg-stone-950/60 p-5">
          {activeCell ? (
            <div className="flex flex-col items-center gap-3">
              <CellView index={activeIndex} />
              <p className="max-w-sm text-center text-xs leading-5 text-stone-500">
                The rings show lock and type scripts. Capacity is both the Cell&apos;s CKByte value and the byte budget for its complete structure.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-stone-300">No Cell selected</p>
              <p className="mt-1 text-xs text-stone-500">Create or load a Cell to see the model.</p>
            </div>
          )}
        </div>

        <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {CONCEPTS.map((concept) => (
            <div key={concept.title} className={`rounded-lg border p-3 ${concept.tone}`}>
              <p className="text-xs font-semibold">{concept.title}</p>
              <p className="mt-1 text-xs leading-5 text-stone-400">{concept.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
