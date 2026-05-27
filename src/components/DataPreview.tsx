'use client'

import type { ScriptState } from '@/types'
import { KNOWN_SCRIPTS } from '@/lib/script'

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  if (h.length === 0) return new Uint8Array(0)
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function readLeUint128(bytes: Uint8Array, offset = 0): bigint {
  let val = BigInt(0)
  for (let i = offset + 15; i >= offset; i--) {
    val = (val << BigInt(8)) | BigInt(bytes[i] ?? 0)
  }
  return val
}

function readLeUint64(bytes: Uint8Array, offset = 0): bigint {
  let val = BigInt(0)
  for (let i = offset + 7; i >= offset; i--) {
    val = (val << BigInt(8)) | BigInt(bytes[i] ?? 0)
  }
  return val
}

function readLeUint32(bytes: Uint8Array, offset = 0): number {
  return (bytes[offset] ?? 0) |
    ((bytes[offset + 1] ?? 0) << 8) |
    ((bytes[offset + 2] ?? 0) << 16) |
    ((bytes[offset + 3] ?? 0) << 24)
}

interface PreviewEntry {
  label: string
  value: string
  highlight?: boolean
}

function parseXudt(data: Uint8Array): PreviewEntry[] {
  if (data.length < 16) return [{ label: 'Data too short', value: `${data.length} bytes` }]
  const amount = readLeUint128(data)
  const formatted = (Number(amount) / 1e8).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })
  return [
    { label: 'Token Amount', value: `${formatted}`, highlight: true },
    { label: 'Raw (uint128 LE)', value: `0x${Array.from(data.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join('')}` },
  ]
}

function parseDao(data: Uint8Array): PreviewEntry[] {
  if (data.length === 0) return [{ label: 'Deposit cell', value: 'No data yet (fresh deposit)' }]
  if (data.length < 8) return [{ label: 'Data too short', value: `${data.length} bytes` }]
  const blockNumber = readLeUint64(data)
  return [
    { label: 'Deposit Block', value: `#${blockNumber.toString()}`, highlight: true },
    { label: 'Status', value: blockNumber === BigInt(0) ? 'Fresh deposit' : 'Waiting for withdrawal' },
  ]
}

function parseSpore(data: Uint8Array): PreviewEntry[] {
  if (data.length < 4) return [{ label: 'Data too short', value: `${data.length} bytes` }]
  // Spore v2 molecule: table with 4-byte total size prefix
  const totalSize = readLeUint32(data)
  if (data.length < totalSize || data.length < 4) {
    return [{ label: 'Raw data', value: `${data.length} bytes (Spore content)` }]
  }
  // Try to extract meaningful text from the content area
  const content = data.slice(4)
  const text = new TextDecoder().decode(content.slice(0, Math.min(content.length, 120)))
  const cleaned = text.replace(/[^\x20-\x7E]/g, '').trim()
  if (cleaned.length > 0) {
    return [
      { label: 'Content', value: cleaned.substring(0, 80), highlight: true },
      { label: 'Total size', value: `${totalSize} bytes` },
    ]
  }
  return [{ label: 'Spore data', value: `${data.length} bytes` }]
}

function identifyScript(codeHash: string, hashType: string): string | null {
  const ch = codeHash.toLowerCase()
  for (const s of KNOWN_SCRIPTS) {
    if (s.codeHash.toLowerCase() === ch && s.hashType === hashType) return s.name
  }
  return null
}

interface DataPreviewProps {
  type: ScriptState | null
  data: string
  capacity: string
}

export function DataPreview({ type, data, capacity }: DataPreviewProps) {
  const bytes = hexToBytes(data)
  const ckb = Number(capacity) / 1e8

  if (!type || !type.codeHash) {
    return (
      <PreviewDisplay
        entries={[
          { label: 'Value', value: `${ckb.toLocaleString()} CKB`, highlight: true },
          { label: 'Data', value: bytes.length === 0 ? 'Empty' : `${bytes.length} bytes` },
        ]}
      />
    )
  }

  const scriptName = identifyScript(type.codeHash, type.hashType)
  let entries: PreviewEntry[] = []

  if (scriptName?.toLowerCase().includes('xudt')) {
    entries = parseXudt(bytes)
  } else if (scriptName?.toLowerCase().includes('dao')) {
    entries = parseDao(bytes)
  } else if (scriptName?.toLowerCase().includes('spore')) {
    entries = parseSpore(bytes)
  } else if (scriptName?.toLowerCase().includes('always success') || scriptName?.toLowerCase().includes('type id')) {
    entries = [
      { label: 'Type', value: 'Testing / demo', highlight: true },
      { label: 'Data', value: bytes.length === 0 ? 'Empty' : `${bytes.length} bytes` },
    ]
  } else {
    entries = [
      { label: 'Script', value: scriptName ?? 'Unknown', highlight: false },
      { label: 'Data', value: bytes.length === 0 ? 'Empty' : `${bytes.length} bytes` },
    ]
  }

  return <PreviewDisplay entries={entries} />
}

function PreviewDisplay({ entries }: { entries: PreviewEntry[] }) {
  return (
    <div className="space-y-1 rounded-lg bg-stone-800/30 border border-stone-700/30 p-3">
      <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Interpretation</div>
      {entries.map((e, i) => (
        <div key={i} className="flex items-center justify-between text-xs">
          <span className="text-stone-500">{e.label}</span>
          <span className={`font-mono ${e.highlight ? 'text-blue-300' : 'text-stone-400'}`}>{e.value}</span>
        </div>
      ))}
    </div>
  )
}
