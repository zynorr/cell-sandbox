import { describe, expect, it } from 'vitest'
import { generateExportCode } from '../cell'
import type { CellState } from '@/types'

const cell: CellState = {
  capacity: '18446744073709551615',
  lock: {
    codeHash: `0x${'1'.repeat(64)}`,
    hashType: 'type',
    args: `0x${'2'.repeat(40)}`,
  },
  type: null,
  data: '0xdeadbeef',
  dataMode: 'hex',
}

describe('generateExportCode', () => {
  it('keeps shannons exact and emits the parallel outputsData array', () => {
    const code = generateExportCode([cell])

    expect(code).toContain("capacity: BigInt('18446744073709551615')")
    expect(code).toContain('outputsData: [')
    expect(code).toContain("ccc.hexFrom('0xdeadbeef')")
    expect(code).not.toContain('fixedPointFrom')
  })
})
