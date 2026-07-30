'use client'

import { useSandbox } from '@/store/sandbox'

const CELL_FIELDS = [
  ['Capacity', 'CKB amount and storage limit'],
  ['Lock', 'Who may consume the Cell'],
  ['Type', 'Optional state-transition rules'],
  ['Data', 'Application state stored as bytes'],
]

export function LearnWorkspace() {
  const setViewMode = useSandbox((state) => state.setViewMode)

  return (
    <main className="mx-auto min-w-0 w-full max-w-6xl">
      <section className="border-b border-stone-800 px-4 py-8 sm:px-8 sm:py-10">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">The Cell model</p>
        <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold text-stone-100 sm:text-3xl">State lives in Cells</h1>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              A live Cell is an immutable piece of state. A transaction consumes existing Cells and creates new Cells; it does not edit a Cell in place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setViewMode('design')}
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              Design a Cell
            </button>
            <button
              type="button"
              onClick={() => setViewMode('inspect')}
              className="rounded-md border border-stone-700 bg-stone-900 px-4 py-2 text-xs font-semibold text-stone-200 transition-colors hover:border-stone-600"
            >
              Inspect a transaction
            </button>
          </div>
        </div>
      </section>

      <section className="grid border-b border-stone-800 lg:grid-cols-[1fr_1.15fr]">
        <div className="flex min-h-72 items-center justify-center border-b border-stone-800 p-8 lg:border-b-0 lg:border-r">
          <div className="relative flex aspect-square w-full max-w-64 items-center justify-center rounded-full border border-emerald-700/50 bg-emerald-950/20">
            <div className="absolute inset-5 rounded-full border border-stone-700" />
            <div className="absolute inset-11 rounded-full border border-dashed border-stone-600" />
            <div className="text-center">
              <p className="font-mono text-xs text-emerald-300">live Cell</p>
              <p className="mt-1 text-[11px] text-stone-500">state + ownership</p>
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Four fields</p>
          <dl className="mt-3 divide-y divide-stone-800 border-y border-stone-800">
            {CELL_FIELDS.map(([field, meaning]) => (
              <div key={field} className="grid grid-cols-[5.5rem_1fr] gap-4 py-3 text-sm">
                <dt className="font-mono font-medium text-stone-200">{field}</dt>
                <dd className="text-stone-400">{meaning}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs leading-5 text-stone-500">
            Capacity is measured in shannons. One CKB equals 100,000,000 shannons, and every stored byte requires one CKB of occupied capacity.
          </p>
        </div>
      </section>

      <section className="border-b border-stone-800 px-4 py-8 sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">State transition</p>
        <div className="mt-4 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <div className="border border-blue-800/40 bg-blue-950/20 p-4">
            <p className="text-xs font-semibold text-blue-300">Live input Cells</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">Referenced by outpoint, then consumed.</p>
          </div>
          <span className="self-center text-center text-stone-600" aria-hidden="true">-&gt;</span>
          <div className="border border-stone-700 bg-stone-900 p-4">
            <p className="text-xs font-semibold text-stone-200">Transaction</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">Scripts validate the proposed change.</p>
          </div>
          <span className="self-center text-center text-stone-600" aria-hidden="true">-&gt;</span>
          <div className="border border-emerald-800/40 bg-emerald-950/20 p-4">
            <p className="text-xs font-semibold text-emerald-300">New output Cells</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">Created as the next live state.</p>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 lg:grid-cols-[1fr_1.15fr]">
        <div className="border-b border-stone-800 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">What CCC completes</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-100">You provide outputs; the signer funds them</h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Build Tx follows CCC directly. The connected signer selects live input Cells, adds change, calculates the fee, and signs the completed transaction.
          </p>
        </div>
        <div className="min-w-0 bg-stone-950/50 p-6 sm:p-8">
          <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-stone-300"><code>{`const tx = ccc.Transaction.from({ outputs, outputsData })

await tx.completeInputsByCapacity(signer)
await tx.completeFeeBy(signer, 1000)`}</code></pre>
        </div>
      </section>
    </main>
  )
}
