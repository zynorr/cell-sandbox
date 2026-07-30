import { describe, expect, it } from 'vitest'
import { ccc } from '@ckb-ccc/ccc'
import type { CellState } from '@/types'
import {
  getCellFreeCapacity,
  getCellOccupiedBytes,
  getCellOccupiedCapacity,
} from '../cellMetrics'
import { getKnownScriptById } from '../script'

function transferCell(capacity = '6200000000'): CellState {
  return {
    capacity,
    lock: getKnownScriptById(
      ccc.KnownScript.Secp256k1Blake160,
      'testnet',
      `0x${'1'.repeat(40)}`
    ),
    type: null,
    data: '0x',
    dataMode: 'hex',
  }
}

describe('CCC Cell capacity metrics', () => {
  it('matches CCC CellAny occupancy and free capacity', () => {
    const cell = transferCell()
    const cccCell = new ccc.CellAny(
      ccc.CellOutput.from({
        capacity: BigInt(cell.capacity),
        lock: ccc.Script.from(cell.lock),
      }),
      ccc.hexFrom(cell.data)
    )

    expect(getCellOccupiedBytes(cell)).toBe(cccCell.occupiedSize)
    expect(getCellOccupiedCapacity(cell)).toBe(cccCell.cellOutput.capacity - cccCell.capacityFree)
    expect(getCellFreeCapacity(cell)).toBe(cccCell.capacityFree)
  })

  it('keeps metrics visible while an invalid capacity draft is being edited', () => {
    const cell = transferCell('not-a-number')

    expect(getCellOccupiedBytes(cell)).toBe(61)
    expect(getCellOccupiedCapacity(cell)).toBe(BigInt(6_100_000_000))
    expect(getCellFreeCapacity(cell)).toBe(BigInt(-6_100_000_000))
  })
})
