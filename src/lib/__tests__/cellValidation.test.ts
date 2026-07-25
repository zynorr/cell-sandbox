import { describe, expect, it } from 'vitest'
import {
  ALWAYS_SUCCESS_CODE_HASH,
  MAX_CELL_CAPACITY,
  NERVOS_DAO_CODE_HASH,
  SECP256K1_BLAKE160_CODE_HASH,
  validateOutputCells,
} from '@/lib/cellValidation'
import type { CellState } from '@/types'

function outputCell(patch: Partial<CellState> = {}): CellState {
  return {
    capacity: '6100000000',
    lock: {
      codeHash: SECP256K1_BLAKE160_CODE_HASH,
      hashType: 'type',
      args: `0x${'1'.repeat(40)}`,
    },
    type: null,
    data: '0x',
    dataMode: 'hex',
    ...patch,
  }
}

describe('validateOutputCells', () => {
  it('accepts a complete secp256k1 output', () => {
    expect(validateOutputCells([{ cell: outputCell(), index: 0 }])).toEqual([])
  })

  it('rejects an empty secp256k1 lock arg', () => {
    const issues = validateOutputCells([
      { cell: outputCell({ lock: { codeHash: SECP256K1_BLAKE160_CODE_HASH, hashType: 'type', args: '0x' } }), index: 2 },
    ])

    expect(issues[0]).toContain('Cell #2: Secp256k1 lock args must be 20 bytes')
  })

  it('rejects malformed data and insufficient capacity', () => {
    const issues = validateOutputCells([
      { cell: outputCell({ capacity: '1', data: '0xabc' }), index: 1 },
    ])

    expect(issues).toEqual(expect.arrayContaining([
      'Cell #1 capacity is below its estimated occupied capacity.',
      'Cell #1 data must be even-length, 0x-prefixed hex.',
    ]))
  })

  it('rejects capacity above the CKB Uint64 limit', () => {
    const issues = validateOutputCells([{
      cell: outputCell({ capacity: (MAX_CELL_CAPACITY + BigInt(1)).toString() }),
      index: 0,
    }])

    expect(issues).toContain('Cell #0 capacity exceeds the CKB Uint64 maximum.')
  })

  it('rejects a known lock with the wrong hash type', () => {
    const issues = validateOutputCells([{
      cell: outputCell({
        lock: { codeHash: SECP256K1_BLAKE160_CODE_HASH, hashType: 'data', args: `0x${'1'.repeat(40)}` },
      }),
      index: 0,
    }])

    expect(issues).toContain('Cell #0: Secp256k1 Blake160 SighashAll must use hash type "type".')
  })

  it('rejects a known type protocol in the lock field', () => {
    const issues = validateOutputCells([{
      cell: outputCell({
        lock: { codeHash: NERVOS_DAO_CODE_HASH, hashType: 'type', args: '0x' },
      }),
      index: 0,
    }])

    expect(issues).toContain('Cell #0: Nervos DAO is a type script and belongs in the Type Script field.')
  })

  it('accepts the canonical data for a new Nervos DAO deposit', () => {
    const cell = outputCell({
      capacity: '10200000000',
      type: { codeHash: NERVOS_DAO_CODE_HASH, hashType: 'type', args: '0x' },
      data: '0x0000000000000000',
    })

    expect(validateOutputCells([{ cell, index: 0 }])).toEqual([])
  })

  it('rejects empty or non-zero data on a new Nervos DAO deposit', () => {
    const daoType = { codeHash: NERVOS_DAO_CODE_HASH, hashType: 'type' as const, args: '0x' }

    for (const data of ['0x', '0x0100000000000000']) {
      const issues = validateOutputCells([{
        cell: outputCell({ capacity: '10200000000', type: daoType, data }),
        index: 3,
      }])

      expect(issues).toContain(
        'Cell #3: A new Nervos DAO deposit must contain exactly 8 zero bytes (0x0000000000000000).'
      )
    }
  })

  it('rejects invalid Nervos DAO hash type and args', () => {
    const issues = validateOutputCells([{
      cell: outputCell({
        capacity: '10400000000',
        type: { codeHash: NERVOS_DAO_CODE_HASH, hashType: 'data', args: '0x01' },
        data: '0x0000000000000000',
      }),
      index: 0,
    }])

    expect(issues).toContain('Cell #0: Nervos DAO type must use hash type "type" with empty args.')
  })

  it('blocks Always Success outputs from wallet funding', () => {
    const issues = validateOutputCells([{
      cell: outputCell({
        lock: { codeHash: ALWAYS_SUCCESS_CODE_HASH, hashType: 'data1', args: '0x' },
      }),
      index: 0,
    }])

    expect(issues).toContain(
      'Cell #0: Always Success is an anyone-can-spend testing lock and cannot be funded from Build Tx.'
    )
  })

  it('keeps unsupported type-script examples in Design Cells', () => {
    const issues = validateOutputCells([{
      cell: outputCell({
        capacity: '14200000000',
        type: {
          codeHash: '0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb',
          hashType: 'type',
          args: `0x${'0'.repeat(64)}`,
        },
        data: `0x${'0'.repeat(32)}`,
      }),
      index: 1,
    }])

    expect(issues).toContain(
      'Cell #1: Build Tx currently sends plain CKB and fresh Nervos DAO deposits only. Use other type-script Cells in Design Cells.'
    )
  })

  it('explains malformed xUDT base fields before the design-only restriction', () => {
    const issues = validateOutputCells([{
      cell: outputCell({
        capacity: '14300000000',
        type: {
          codeHash: '0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb',
          hashType: 'type',
          args: '0x01',
        },
        data: '0x01',
      }),
      index: 0,
    }])

    expect(issues).toEqual(expect.arrayContaining([
      'Cell #0: xUDT args require a 32-byte owner lock script hash, optionally followed by 4-byte flags and extension data.',
      'Cell #0: xUDT data requires at least a 16-byte uint128 little-endian amount.',
    ]))
  })
})
