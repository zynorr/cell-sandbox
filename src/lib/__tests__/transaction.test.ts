import { describe, expect, it } from 'vitest'
import { ccc } from '@ckb-ccc/ccc'
import { isCellbaseOutPoint } from '../transaction'

describe('isCellbaseOutPoint', () => {
  it('recognizes the null outpoint used by the cellbase dummy input', () => {
    const outPoint = ccc.OutPoint.from({
      txHash: `0x${'0'.repeat(64)}`,
      index: BigInt(0xffffffff),
    })

    expect(isCellbaseOutPoint(outPoint)).toBe(true)
  })

  it('does not classify a regular previous output as cellbase', () => {
    const outPoint = ccc.OutPoint.from({
      txHash: `0x${'1'.repeat(64)}`,
      index: 0,
    })

    expect(isCellbaseOutPoint(outPoint)).toBe(false)
  })
})
