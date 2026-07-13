import type { CellState } from '@/types'

export function dataBytes(data: string): number {
  if (!data || data === '0x') return 0
  const raw = data.startsWith('0x') ? data.slice(2) : data
  return Math.max(0, Math.ceil(raw.length / 2))
}

function scriptBytes(script: CellState['lock'] | null): number {
  if (!script) return 0
  const codeHashBytes = 32
  const argsBytes = dataBytes(script.args || '0x')
  const hashTypeBytes = 1
  return codeHashBytes + hashTypeBytes + argsBytes
}

export function estimateOccupiedBytes(cell: CellState): number {
  const baseCellOutputBytes = 8
  return baseCellOutputBytes + scriptBytes(cell.lock) + scriptBytes(cell.type) + dataBytes(cell.data)
}

export function estimateOccupiedCapacity(cell: CellState): bigint {
  return BigInt(estimateOccupiedBytes(cell)) * BigInt(100000000)
}

export function estimateFreeCapacity(cell: CellState): bigint {
  try {
    return BigInt(cell.capacity || '0') - estimateOccupiedCapacity(cell)
  } catch {
    return BigInt(0) - estimateOccupiedCapacity(cell)
  }
}
