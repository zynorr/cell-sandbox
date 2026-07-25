import { describe, expect, it } from 'vitest'
import { formatCapacityExact } from '@/lib/ccc'

describe('formatCapacityExact', () => {
  it('keeps small transaction fees visible', () => {
    expect(formatCapacityExact(BigInt(464))).toBe('0.00000464 CKB')
  })

  it('formats whole and fractional CKB without trailing zeroes', () => {
    expect(formatCapacityExact(BigInt(100000000000))).toBe('1,000 CKB')
    expect(formatCapacityExact(BigInt(899999999536))).toBe('8,999.99999536 CKB')
  })
})
