import { describe, expect, it } from 'vitest'
import { PUDGE_TRANSACTION_EXAMPLES } from '@/lib/examples'
import { txHashSchema } from '@/lib/schemas'

describe('PUDGE_TRANSACTION_EXAMPLES', () => {
  it('provides valid, distinct transaction hashes', () => {
    const hashes = PUDGE_TRANSACTION_EXAMPLES.map((sample) => sample.hash)

    expect(hashes.every((hash) => txHashSchema.safeParse(hash).success)).toBe(true)
    expect(new Set(hashes).size).toBe(hashes.length)
  })

  it('covers both a simple and a multi-input transaction', () => {
    expect(PUDGE_TRANSACTION_EXAMPLES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ expectedInputs: 1, expectedOutputs: 1 }),
        expect.objectContaining({ expectedInputs: 3, expectedOutputs: 3 }),
      ])
    )
  })
})
