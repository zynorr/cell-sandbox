import { ccc } from '@ckb-ccc/ccc'
import type { CellState, ScriptState } from '@/types'

function toCccScript(script: ScriptState): ccc.Script {
  const codeHash = /^0x[0-9a-fA-F]{64}$/.test(script.codeHash)
    ? script.codeHash
    : `0x${'0'.repeat(64)}`
  const args = /^0x(?:[0-9a-fA-F]{2})*$/.test(script.args || '0x')
    ? script.args || '0x'
    : '0x'

  return ccc.Script.from({
    codeHash,
    hashType: script.hashType,
    args,
  })
}

function toCccCell(cell: CellState): ccc.CellAny {
  const outputData = /^0x(?:[0-9a-fA-F]{2})*$/.test(cell.data || '0x')
    ? cell.data || '0x'
    : '0x'

  const cellOutput = ccc.CellOutput.from({
    capacity: capacityOrZero(cell.capacity),
    lock: toCccScript(cell.lock),
    type: cell.type ? toCccScript(cell.type) : undefined,
  })

  return new ccc.CellAny(cellOutput, ccc.hexFrom(outputData))
}

function capacityOrZero(capacity: string): bigint {
  try {
    return BigInt(capacity || '0')
  } catch {
    return BigInt(0)
  }
}

export function dataBytes(data: string): number {
  try {
    return ccc.bytesFrom(data || '0x').byteLength
  } catch {
    return 0
  }
}

export function getCellOccupiedBytes(cell: CellState): number {
  return toCccCell(cell).occupiedSize
}

export function getCellOccupiedCapacity(cell: CellState): bigint {
  const cccCell = toCccCell(cell)
  return cccCell.cellOutput.capacity - cccCell.capacityFree
}

export function getCellFreeCapacity(cell: CellState): bigint {
  return toCccCell(cell).capacityFree
}
