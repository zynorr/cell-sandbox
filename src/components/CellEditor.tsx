'use client'

import { useState } from 'react'
import { useSandbox } from '@/store/sandbox'
import { ScriptSelector } from './ScriptSelector'
import { DataEditor } from './DataEditor'
import { DataPreview } from './DataPreview'
import { dataBytes, getCellFreeCapacity, getCellOccupiedBytes, getCellOccupiedCapacity } from '@/lib/cellMetrics'
import { formatCapacity, formatCapacityExact } from '@/lib/ccc'
import { findKnownScript } from '@/lib/script'
import {
  getLockScriptAdvisory,
  getLockScriptIssue,
  getTypeScriptAdvisory,
  getTypeScriptIssue,
  isWalletFillableLock,
} from '@/lib/cellValidation'

type InspectorTab = 'overview' | 'fields' | 'raw'

function shannonsToCkb(value: string): string {
  try {
    const amount = BigInt(value)
    const whole = amount / BigInt(100000000)
    const fraction = (amount % BigInt(100000000)).toString().padStart(8, '0').replace(/0+$/, '')
    return `${whole}${fraction ? `.${fraction}` : ''}`
  } catch {
    return ''
  }
}

function ckbToShannons(value: string): string | null {
  if (!/^\d+(?:\.\d{0,8})?$/.test(value)) return null
  const [whole, fraction = ''] = value.split('.')
  return (BigInt(whole) * BigInt(100000000) + BigInt(fraction.padEnd(8, '0') || '0')).toString()
}

function readXudtAmount(data: string): string {
  const hex = data.startsWith('0x') ? data.slice(2) : data
  if (hex.length < 32 || !/^[0-9a-fA-F]+$/.test(hex)) return '0'
  const bytes = hex.slice(0, 32).match(/.{2}/g) ?? []
  return BigInt(`0x${bytes.reverse().join('')}`).toString()
}

function writeXudtAmount(value: string, currentData: string): string | null {
  if (!/^\d+$/.test(value)) return null
  const amount = BigInt(value)
  if (amount >= (BigInt(1) << BigInt(128))) return null
  const bigEndian = amount.toString(16).padStart(32, '0')
  const littleEndian = (bigEndian.match(/.{2}/g) ?? []).reverse().join('')
  const extension = currentData.startsWith('0x') ? currentData.slice(34) : ''
  return `0x${littleEndian}${extension}`
}

function CapacityField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [display, setDisplay] = useState(() => shannonsToCkb(value))

  return (
    <div className="space-y-2">
      <label htmlFor="capacity-ckb" className="field-label">Capacity</label>
      <div className="relative">
        <input
          id="capacity-ckb"
          inputMode="decimal"
          value={display}
          onChange={(event) => {
            const next = event.target.value
            setDisplay(next)
            const shannons = ckbToShannons(next)
            if (shannons !== null) onChange(shannons)
          }}
          className="field-input pr-14"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-500">CKB</span>
      </div>
      <p className="field-help">Value and storage budget. Exact shannons are available under Raw structure.</p>
    </div>
  )
}

export function CellEditor() {
  const cells = useSandbox((s) => s.cells)
  const selectedIndex = useSandbox((s) => s.selectedIndex)
  const updateCell = useSandbox((s) => s.updateCell)
  const removeCell = useSandbox((s) => s.removeCell)
  const network = useSandbox((s) => s.network)
  const [tabState, setTabState] = useState<{ index: number | null; tab: InspectorTab }>({ index: selectedIndex, tab: 'overview' })
  const tab = tabState.index === selectedIndex ? tabState.tab : 'overview'
  const setTab = (next: InspectorTab) => setTabState({ index: selectedIndex, tab: next })

  if (selectedIndex === null || !cells[selectedIndex]) {
    return <div className="flex min-h-64 items-center justify-center p-6 text-sm text-stone-500">Select a Cell to inspect its layers.</div>
  }

  const cell = cells[selectedIndex]
  const occupiedBytes = getCellOccupiedBytes(cell)
  const occupiedCapacity = getCellOccupiedCapacity(cell)
  const freeCapacity = getCellFreeCapacity(cell)
  const lockName = findKnownScript(cell.lock, network)?.name ?? (cell.lock.codeHash ? 'Custom lock' : 'Not selected')
  const typeName = cell.type ? findKnownScript(cell.type, network)?.name ?? 'Custom type' : 'None'
  const lockIssue = cell.lock.codeHash ? getLockScriptIssue(cell.lock, network) : null
  const lockAdvisory = cell.lock.codeHash ? getLockScriptAdvisory(cell.lock, network) : null
  const typeIssue = cell.type?.codeHash ? getTypeScriptIssue(cell.type, network) : null
  const typeAdvisory = getTypeScriptAdvisory(cell.type, network)
  const walletLockPending = isWalletFillableLock(cell.lock, network)

  function toggleType() {
    updateCell(selectedIndex!, {
      type: cell.type ? null : { codeHash: '', hashType: 'type', args: '0x' },
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-stone-800 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-stone-500">Inspector</p>
            <h2 className="mt-1 text-base font-semibold text-stone-100">Cell {String(selectedIndex + 1).padStart(2, '0')}</h2>
          </div>
          <button onClick={() => removeCell(selectedIndex)} className="text-xs text-red-300 hover:text-red-200">Remove</button>
        </div>
        <div className="mt-4 grid grid-cols-3 rounded-md border border-stone-800 bg-stone-950 p-1">
          {(['overview', 'fields', 'raw'] as const).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`inspector-tab ${tab === item ? 'is-active' : ''}`}>
              {item === 'raw' ? 'Raw structure' : item}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-stone-800 bg-stone-800">
              <div className="metric-block"><span>Total capacity</span><strong>{formatCapacity(cell.capacity)}</strong></div>
              <div className="metric-block"><span>Free capacity</span><strong className={freeCapacity >= 0 ? 'text-emerald-300' : 'text-red-300'}>{formatCapacity(freeCapacity)}</strong></div>
              <div className="metric-block"><span>Occupied</span><strong>{formatCapacity(occupiedCapacity)}</strong></div>
              <div className="metric-block"><span>Stored data</span><strong>{dataBytes(cell.data)} bytes</strong></div>
            </div>

            <dl className="divide-y divide-stone-800 border-y border-stone-800">
              <button className="summary-row" onClick={() => setTab('fields')}><dt><i className="bg-blue-400" />Lock</dt><dd>{lockName}</dd></button>
              <button className="summary-row" onClick={() => setTab('fields')}><dt><i className="bg-amber-400" />Type</dt><dd>{typeName}</dd></button>
              <button className="summary-row" onClick={() => setTab('fields')}><dt><i className="bg-emerald-400" />Data</dt><dd>{cell.data === '0x' ? 'Empty' : `${dataBytes(cell.data)} bytes`}</dd></button>
            </dl>

            <p className="text-sm leading-6 text-stone-400">This summary describes what the Cell contains. Open Fields to make meaningful changes, or Raw structure to inspect its serialized values.</p>
            <button onClick={() => setTab('fields')} className="primary-button w-full">Edit Cell fields</button>
          </div>
        )}

        {tab === 'fields' && (
          <div className="space-y-6">
            <CapacityField key={selectedIndex} value={cell.capacity} onChange={(capacity) => updateCell(selectedIndex, { capacity })} />

            <section className="field-section field-section-lock">
              <div><span className="field-dot bg-blue-400" /><label className="field-label">Lock</label></div>
              <p className="field-help">Required spending condition. It answers who may consume this Cell.</p>
              <ScriptSelector script={cell.lock} role="lock" showRaw={false} onChange={(lock) => updateCell(selectedIndex, { lock })} />
              {walletLockPending && <p className="notice notice-info">The connected wallet can fill the owner arguments when you build.</p>}
              {!walletLockPending && (lockIssue || lockAdvisory) && <p className="notice notice-warning">{lockIssue || lockAdvisory}</p>}
            </section>

            <section className="field-section field-section-type">
              <div className="flex items-center justify-between gap-3">
                <div><span className="field-dot bg-amber-400" /><label className="field-label">Type</label></div>
                <button onClick={toggleType} className="text-xs font-medium text-amber-300 hover:text-amber-200">{cell.type ? 'Remove rule' : 'Add rule'}</button>
              </div>
              <p className="field-help">Optional application rule checked across matching input and output Cells.</p>
              {cell.type && <ScriptSelector script={cell.type} role="type" showRaw={false} onChange={(type) => updateCell(selectedIndex, { type })} />}
              {(typeIssue || typeAdvisory) && <p className="notice notice-warning">{typeIssue || typeAdvisory}</p>}
            </section>

            <section className="field-section field-section-data">
              <div><span className="field-dot bg-emerald-400" /><label className="field-label">Data</label></div>
              <p className="field-help">Application state stored inside this Cell.</p>
              {typeName === 'xUDT' ? (
                <div className="space-y-2">
                  <label htmlFor="xudt-amount" className="field-label">Token amount</label>
                  <input
                    id="xudt-amount"
                    inputMode="numeric"
                    value={readXudtAmount(cell.data)}
                    onChange={(event) => {
                      const data = writeXudtAmount(event.target.value, cell.data)
                      if (data) updateCell(selectedIndex, { data, dataMode: 'hex' })
                    }}
                    className="field-input font-mono"
                  />
                  <p className="field-help">Encoded as an unsigned 128-bit little-endian value. The bytes remain available under Raw structure.</p>
                </div>
              ) : typeName === 'Nervos DAO' ? (
                <div className="rounded-md border border-stone-800 bg-stone-950 p-3 text-xs text-stone-300">Fresh deposits store exactly 8 zero bytes. Cell Sandbox keeps that encoding intact.</div>
              ) : cell.dataMode === 'text' ? (
                <DataEditor value={cell.data} mode={cell.dataMode} onChange={(data, dataMode) => updateCell(selectedIndex, { data, dataMode })} />
              ) : (
                <button onClick={() => setTab('raw')} className="secondary-button self-start">Edit serialized data</button>
              )}
              <DataPreview type={cell.type} data={cell.data} capacity={cell.capacity} />
            </section>
          </div>
        )}

        {tab === 'raw' && (
          <div className="space-y-6">
            <div className="notice notice-warning">Advanced view. These values map directly to the serialized Cell structure.</div>
            <div className="space-y-2">
              <label htmlFor="capacity-shannons" className="field-label">Capacity in shannons</label>
              <input id="capacity-shannons" value={cell.capacity} onChange={(event) => updateCell(selectedIndex, { capacity: event.target.value })} className="field-input font-mono" />
              <p className="field-help">{formatCapacityExact(cell.capacity)} · {occupiedBytes} occupied bytes</p>
            </div>
            <div className="space-y-2"><label className="field-label">Lock script</label><ScriptSelector script={cell.lock} role="lock" onChange={(lock) => updateCell(selectedIndex, { lock })} /></div>
            <div className="space-y-2">
              <div className="flex justify-between"><label className="field-label">Type script</label><button onClick={toggleType} className="text-xs text-amber-300">{cell.type ? 'Remove' : 'Add'}</button></div>
              {cell.type ? <ScriptSelector script={cell.type} role="type" onChange={(type) => updateCell(selectedIndex, { type })} /> : <p className="field-help">No type script.</p>}
            </div>
            <div className="space-y-2"><label className="field-label">Raw output data</label><DataEditor value={cell.data} mode={cell.dataMode} onChange={(data, dataMode) => updateCell(selectedIndex, { data, dataMode })} /></div>
          </div>
        )}
      </div>
    </div>
  )
}
