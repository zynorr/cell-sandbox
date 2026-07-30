'use client'

import type { ScriptState } from '@/types'
import { formatCapacityExact } from '@/lib/ccc'
import { findKnownScript } from '@/lib/script'
import { useSandbox } from '@/store/sandbox'

function hexToBytes(hex: string): Uint8Array {
  const raw = hex.startsWith('0x') ? hex.slice(2) : hex
  if (raw.length === 0 || raw.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(raw)) {
    return new Uint8Array(0)
  }
  return Uint8Array.from(raw.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16))
}

function bytesToHex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

function readLeUint128(bytes: Uint8Array, offset = 0): bigint {
  let value = BigInt(0)
  for (let index = offset + 15; index >= offset; index--) {
    value = (value << BigInt(8)) | BigInt(bytes[index] ?? 0)
  }
  return value
}

function readLeUint64(bytes: Uint8Array, offset = 0): bigint {
  let value = BigInt(0)
  for (let index = offset + 7; index >= offset; index--) {
    value = (value << BigInt(8)) | BigInt(bytes[index] ?? 0)
  }
  return value
}

interface PreviewEntry {
  label: string
  value: string
  highlight?: boolean
}

function parseXudt(data: Uint8Array): PreviewEntry[] {
  if (data.length < 16) return [{ label: 'Data too short', value: `${data.length} bytes; requires at least 16` }]

  const entries: PreviewEntry[] = [
    { label: 'Amount (uint128 LE)', value: readLeUint128(data).toString(), highlight: true },
    { label: 'Encoded amount', value: bytesToHex(data.slice(0, 16)) },
  ]
  if (data.length > 16) entries.push({ label: 'Extension data', value: `${data.length - 16} bytes` })
  return entries
}

function parseDao(data: Uint8Array): PreviewEntry[] {
  if (data.length !== 8) {
    return [
      { label: 'Invalid DAO data', value: `${data.length} bytes` },
      { label: 'Fresh deposit requires', value: '8 zero bytes' },
    ]
  }

  const depositBlockNumber = readLeUint64(data)
  if (depositBlockNumber === BigInt(0)) {
    return [
      { label: 'State', value: 'Fresh deposit', highlight: true },
      { label: 'Data', value: '8 zero bytes' },
    ]
  }

  return [
    { label: 'State', value: 'Withdrawal prepared', highlight: true },
    { label: 'Deposit block number', value: `#${depositBlockNumber.toString()}` },
  ]
}

function displayCapacity(capacity: string): string {
  try {
    return formatCapacityExact(capacity)
  } catch {
    return 'Invalid capacity'
  }
}

interface DataPreviewProps {
  type: ScriptState | null
  data: string
  capacity: string
}

export function DataPreview({ type, data, capacity }: DataPreviewProps) {
  const network = useSandbox((state) => state.network)
  const bytes = hexToBytes(data)

  if (!type || !type.codeHash) {
    return (
      <PreviewDisplay
        entries={[
          { label: 'Capacity', value: displayCapacity(capacity), highlight: true },
          { label: 'Output data', value: bytes.length === 0 ? 'Empty' : `${bytes.length} bytes` },
        ]}
      />
    )
  }

  const scriptName = findKnownScript(type, network)?.name ?? null
  let entries: PreviewEntry[]

  if (scriptName === 'xUDT') {
    entries = parseXudt(bytes)
    const args = hexToBytes(type.args)
    entries.push({
      label: 'Owner lock hash',
      value: args.length < 32
        ? 'Missing; requires 32 bytes'
        : args.slice(0, 32).every((byte) => byte === 0)
          ? 'Placeholder (all zeroes)'
          : bytesToHex(args.slice(0, 32)),
    })
    entries.push({
      label: 'xUDT extensions',
      value: args.length <= 32 ? 'None' : `${args.length - 32} arg bytes`,
    })
  } else if (scriptName === 'Nervos DAO') {
    entries = parseDao(bytes)
  } else if (scriptName === 'Type ID') {
    entries = [
      { label: 'Type identity', value: type.args || 'Missing args', highlight: true },
      { label: 'Output data', value: bytes.length === 0 ? 'Empty' : `${bytes.length} bytes (app-defined)` },
    ]
  } else {
    entries = [
      { label: 'Type script', value: scriptName ?? 'Unknown', highlight: false },
      { label: 'Output data', value: bytes.length === 0 ? 'Empty' : `${bytes.length} bytes` },
    ]
  }

  return <PreviewDisplay entries={entries} />
}

function PreviewDisplay({ entries }: { entries: PreviewEntry[] }) {
  return (
    <div className="space-y-1 rounded-lg border border-stone-700/30 bg-stone-800/30 p-3">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">Interpretation</div>
      {entries.map((entry) => (
        <div key={entry.label} className="flex min-w-0 items-start justify-between gap-3 text-xs">
          <span className="shrink-0 text-stone-500">{entry.label}</span>
          <span className={`min-w-0 break-all text-right font-mono ${entry.highlight ? 'text-blue-300' : 'text-stone-400'}`}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}
