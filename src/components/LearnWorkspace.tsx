'use client'

import { useEffect, useRef, useState } from 'react'
import { ccc } from '@ckb-ccc/ccc'
import { useSandbox } from '@/store/sandbox'
import { getKnownScriptById } from '@/lib/script'
import { CellProcessScene } from '@/components/CellProcessScene'

const LESSONS = [
  { label: 'Cell', title: 'Open the state container' },
  { label: 'Scripts', title: 'See ownership and rules' },
  { label: 'Change', title: 'Follow a state transition' },
  { label: 'Code', title: 'Connect the picture to CCC' },
] as const

type CellLayer = 'capacity' | 'lock' | 'type' | 'data'

const LAYER_COPY: Record<CellLayer, string> = {
  capacity: 'Value and byte budget',
  lock: 'Who may consume it',
  type: 'What transition is valid',
  data: 'Application state bytes',
}

function LayeredCell({ initialLayer }: { initialLayer: CellLayer }) {
  const [selectedLayer, setSelectedLayer] = useState<CellLayer>(initialLayer)

  return (
    <div className="cell-diagram" aria-label="Exploded diagram of a CKB Cell">
      <div className="cell-diagram-stage">
        <div className="cell-diagram-grid" aria-hidden="true" />
        <svg viewBox="0 0 520 430" role="img" aria-labelledby="cell-diagram-title cell-diagram-description">
          <title id="cell-diagram-title">The four layers of a CKB Cell</title>
          <desc id="cell-diagram-description">An exploded view showing capacity, lock script, optional type script, and data.</desc>
          <line x1="260" y1="55" x2="260" y2="367" className="cell-axis" />

          <g className={`cell-disc capacity ${selectedLayer === 'capacity' ? 'is-active' : ''}`} onClick={() => setSelectedLayer('capacity')}>
            <path d="M60 88 C60 126 150 156 260 156 C370 156 460 126 460 88 L460 108 C460 146 370 176 260 176 C150 176 60 146 60 108 Z" />
            <ellipse cx="260" cy="88" rx="200" ry="68" />
            <text x="260" y="83" textAnchor="middle">CAPACITY</text>
            <text x="260" y="103" textAnchor="middle" className="disc-subtitle">value + storage boundary</text>
          </g>

          <g className={`cell-disc lock ${selectedLayer === 'lock' ? 'is-active' : ''}`} onClick={() => setSelectedLayer('lock')}>
            <path d="M100 184 C100 213 172 237 260 237 C348 237 420 213 420 184 L420 201 C420 231 348 254 260 254 C172 254 100 231 100 201 Z" />
            <ellipse cx="260" cy="184" rx="160" ry="54" />
            <text x="260" y="181" textAnchor="middle">LOCK SCRIPT</text>
            <text x="260" y="199" textAnchor="middle" className="disc-subtitle">required ownership rule</text>
          </g>

          <g className={`cell-disc type ${selectedLayer === 'type' ? 'is-active' : ''}`} onClick={() => setSelectedLayer('type')}>
            <path d="M145 270 C145 292 196 311 260 311 C324 311 375 292 375 270 L375 284 C375 307 324 325 260 325 C196 325 145 307 145 284 Z" />
            <ellipse cx="260" cy="270" rx="115" ry="39" />
            <text x="260" y="268" textAnchor="middle">TYPE SCRIPT</text>
            <text x="260" y="284" textAnchor="middle" className="disc-subtitle">optional application rule</text>
          </g>

          <g className={`cell-disc data ${selectedLayer === 'data' ? 'is-active' : ''}`} onClick={() => setSelectedLayer('data')}>
            <path d="M190 348 C190 362 221 373 260 373 C299 373 330 362 330 348 L330 360 C330 374 299 385 260 385 C221 385 190 374 190 360 Z" />
            <ellipse cx="260" cy="348" rx="70" ry="24" />
            <text x="260" y="353" textAnchor="middle">DATA</text>
          </g>
        </svg>
        <div className="cell-diagram-badge"><i className={`cell-badge-dot ${selectedLayer}`} /><span>{LAYER_COPY[selectedLayer]}</span></div>
      </div>

      <div className="cell-layer-switcher" aria-label="Inspect a Cell layer">
        {(['capacity', 'lock', 'type', 'data'] as const).map((layer) => (
          <button key={layer} onClick={() => setSelectedLayer(layer)} className={selectedLayer === layer ? 'is-active' : ''}>
            <i className={layer} />
            <span>{layer}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function StateChange() {
  return (
    <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div className="journey-cell journey-cell-input">
        <span className="journey-kicker">Consumed input</span>
        <strong>100 CKB</strong>
        <small>Live before the transaction</small>
      </div>
      <span className="text-center text-xl text-stone-600" aria-hidden="true">-&gt;</span>
      <div className="grid gap-2">
        <div className="journey-cell journey-cell-output">
          <span className="journey-kicker">Created output</span>
          <strong>61 CKB</strong>
          <small>Recipient</small>
        </div>
        <div className="journey-cell journey-cell-change">
          <span className="journey-kicker">Created change</span>
          <strong>38.999 CKB</strong>
          <small>Returned to the wallet</small>
        </div>
      </div>
    </div>
  )
}

export function LearnWorkspace() {
  const trackRef = useRef<HTMLElement>(null)
  const setViewMode = useSandbox((state) => state.setViewMode)
  const applyTemplate = useSandbox((state) => state.applyTemplate)
  const network = useSandbox((state) => state.network)

  function openGuidedCell() {
    applyTemplate([{
      capacity: '10000000000',
      lock: getKnownScriptById(ccc.KnownScript.Secp256k1Blake160, network),
      type: null,
      data: '0x',
      dataMode: 'hex',
    }])
    setViewMode('design')
  }

  const lessonCopy = [
    {
      eyebrow: 'The Cell model',
      heading: 'State lives in Cells',
      body: 'A live Cell is an immutable piece of state. It holds capacity and defines how that state may be used. Open its layers before touching the raw structure.',
      note: 'Capacity is both value and the byte budget for everything inside the Cell.',
    },
    {
      eyebrow: 'Ownership and rules',
      heading: 'Scripts guard the state',
      body: 'The lock script controls who may consume a Cell. An optional type script enforces application rules across matching inputs and outputs.',
      note: 'Lock answers “who can spend?” Type answers “what transition is valid?”',
    },
    {
      eyebrow: 'State transition',
      heading: 'Cells are consumed, not edited',
      body: 'A transaction references existing live Cells as inputs and creates new Cells as outputs. Change and fees become visible only after funding is completed.',
      note: 'The 100 CKB input disappears. Two entirely new output Cells take its place.',
    },
    {
      eyebrow: 'Visual to code',
      heading: 'The model maps directly to CCC',
      body: 'The visual workflow proposes outputs. CCC asks the signer for spendable inputs, completes the fee and change, then the wallet signs the result.',
      note: 'The interface should make these three operations easier to see, not hide them.',
    },
  ]

  function goToSlide(index: number) {
    const track = trackRef.current
    if (!track) return
    const left = index * track.clientWidth

    if (typeof track.scrollTo === 'function') {
      track.scrollTo({ left, behavior: 'smooth' })
    } else {
      track.scrollLeft = left
    }
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let locked = false
    let unlockTimer: number | undefined

    function handleWheel(event: WheelEvent) {
      if (!track || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      const index = Math.round(track.scrollLeft / track.clientWidth)
      const panel = track.children[index] as HTMLElement | undefined
      if (!panel) return

      const verticalLimit = panel.scrollHeight - panel.clientHeight
      const canScrollInside = verticalLimit > 2 && (
        (event.deltaY > 0 && panel.scrollTop < verticalLimit - 2) ||
        (event.deltaY < 0 && panel.scrollTop > 2)
      )
      if (canScrollInside) return

      event.preventDefault()
      if (locked) return

      const nextIndex = Math.max(0, Math.min(track.children.length - 1, index + (event.deltaY > 0 ? 1 : -1)))
      if (nextIndex === index) return

      locked = true
      track.scrollTo({ left: nextIndex * track.clientWidth, behavior: 'smooth' })
      unlockTimer = window.setTimeout(() => { locked = false }, 550)
    }

    track.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      track.removeEventListener('wheel', handleWheel)
      if (unlockTimer) window.clearTimeout(unlockTimer)
    }
  }, [])

  return (
    <main ref={trackRef} className="journey-track">
      <section className="journey-screen welcome-launcher">
        <div className="welcome-launcher-inner">
          <div className="welcome-copy">
            <p className="welcome-eyebrow"><i />Welcome to Cell Sandbox</p>
            <h1>Start with one simple idea.</h1>
            <p className="welcome-lead">You do not need to understand CKB yet. We will open one Cell together, see what it holds, and follow what happens when it moves through a transaction.</p>

            <div className="welcome-actions">
              <button onClick={() => goToSlide(1)} className="welcome-primary">Show me a Cell <span>-&gt;</span></button>
              <button onClick={() => setViewMode('design')} className="welcome-secondary">I know the basics</button>
            </div>

            <ul className="welcome-promises" aria-label="Before you begin">
              <li><i />No wallet needed</li>
              <li><i />Nothing will be sent</li>
              <li><i />Raw details can wait</li>
            </ul>
          </div>

          <CellProcessScene />
        </div>
        <button onClick={() => goToSlide(1)} className="welcome-next">Your first step <span>Explore what a Cell holds</span> <b>-&gt;</b></button>
      </section>

      {lessonCopy.map((copy, lesson) => (
        <section key={copy.heading} className="journey-screen journey-lesson">
          <div className="journey-lesson-inner">
            <div className="journey-lesson-topline">
              <p className="text-xs font-semibold uppercase text-emerald-400">Guided journey</p>
              <button onClick={() => setViewMode('design')} className="secondary-button">Skip to Cell Lab</button>
            </div>

            <ol className="journey-progress" aria-label="Journey progress">
              {LESSONS.map((item, index) => (
                <li key={item.label}>
                  <button onClick={() => goToSlide(index + 1)} className={`journey-step ${lesson === index ? 'is-current' : ''} ${lesson > index ? 'is-complete' : ''}`} aria-current={lesson === index ? 'step' : undefined}>
                    <span>{index + 1}</span>{item.label}
                  </button>
                </li>
              ))}
            </ol>

            <div className="journey-lesson-content">
              <div className="journey-visual min-w-0">
                {lesson < 2 && <LayeredCell initialLayer={lesson === 0 ? 'capacity' : 'lock'} />}
                {lesson === 2 && <StateChange />}
                {lesson === 3 && (
                  <div className="code-stage">
                    <div><span>1</span><code>Transaction.from(outputs)</code><small>propose the new Cells</small></div>
                    <div><span>2</span><code>completeInputsByCapacity(signer)</code><small>select live funding Cells</small></div>
                    <div><span>3</span><code>completeFeeBy(signer, 1000)</code><small>add fee and wallet change</small></div>
                  </div>
                )}
              </div>

              <div className="journey-copy min-w-0">
                <p className="text-xs font-semibold uppercase text-emerald-400">{copy.eyebrow}</p>
                <h2 className="mt-2 text-3xl font-semibold text-stone-100">{copy.heading}</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-stone-300">{copy.body}</p>
                <div className="mt-6 border-l-2 border-amber-400 bg-amber-950/10 px-4 py-3 text-sm leading-6 text-stone-400">{copy.note}</div>
                <div className="mt-7 flex flex-wrap gap-2">
                  <button onClick={() => goToSlide(lesson)} className="secondary-button">Previous</button>
                  {lesson < LESSONS.length - 1 ? (
                    <button onClick={() => goToSlide(lesson + 2)} className="primary-button">Continue: {LESSONS[lesson + 1].title}</button>
                  ) : (
                    <button onClick={openGuidedCell} className="primary-button">Open this Cell in the Lab</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </main>
  )
}
