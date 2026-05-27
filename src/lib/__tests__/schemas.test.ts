import { describe, it, expect } from 'vitest'
import {
  cellStateArraySchema,
  faucetClaimRequestSchema,
  faucetStatusResponseSchema,
  faucetClaimResponseSchema,
  outpointSchema,
  scriptSchema,
} from '../schemas'

describe('scriptSchema', () => {
  it('accepts a valid script', () => {
    const result = scriptSchema.safeParse({
      codeHash: '0x9bd7e06f',
      hashType: 'type',
      args: '0x',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid hashType', () => {
    const result = scriptSchema.safeParse({
      codeHash: '0x9bd7e06f',
      hashType: 'invalid',
      args: '0x',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = scriptSchema.safeParse({ codeHash: '0x' })
    expect(result.success).toBe(false)
  })
})

describe('cellStateArraySchema', () => {
  const validCell = {
    capacity: '6100000000',
    lock: { codeHash: '0x9bd7e06f', hashType: 'type', args: '0x' },
    type: null,
    data: '0x',
    dataMode: 'hex',
  }

  it('accepts a valid cell array', () => {
    const result = cellStateArraySchema.safeParse([validCell])
    expect(result.success).toBe(true)
  })

  it('rejects non-array input', () => {
    const result = cellStateArraySchema.safeParse({ not: 'an array' })
    expect(result.success).toBe(false)
  })

  it('rejects cells with missing required fields', () => {
    const result = cellStateArraySchema.safeParse([{ capacity: '100' }])
    expect(result.success).toBe(false)
  })

  it('rejects invalid dataMode value', () => {
    const result = cellStateArraySchema.safeParse([{ ...validCell, dataMode: 'binary' }])
    expect(result.success).toBe(false)
  })

  it('rejects object with __proto__ key (non-array input)', () => {
    const obj = JSON.parse('{"__proto__": {"admin": true}}')
    const result = cellStateArraySchema.safeParse(obj)
    expect(result.success).toBe(false)
  })

  it('accepts cell with extra unknown keys (stripped by Zod by default)', () => {
    const result = cellStateArraySchema.safeParse([{ ...validCell, __proto__: { admin: true } }])
    expect(result.success).toBe(true) // Zod strips unknown keys; shape is still valid
  })
})

describe('faucetClaimRequestSchema', () => {
  it('accepts a valid address', () => {
    const result = faucetClaimRequestSchema.safeParse({ address: 'ckt1q...' })
    expect(result.success).toBe(true)
  })

  it('rejects empty address', () => {
    const result = faucetClaimRequestSchema.safeParse({ address: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing address', () => {
    const result = faucetClaimRequestSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects non-string address', () => {
    const result = faucetClaimRequestSchema.safeParse({ address: 123 })
    expect(result.success).toBe(false)
  })
})

describe('faucetClaimResponseSchema', () => {
  it('accepts a successful claim response', () => {
    const result = faucetClaimResponseSchema.safeParse({
      claim_event: { id: 1, address_hash: 'ckt1q...', amount: '10000', status: 'success' },
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal successful response', () => {
    const result = faucetClaimResponseSchema.safeParse({
      claim_event: { address_hash: 'ckt1q...', amount: '10000' },
    })
    expect(result.success).toBe(true)
  })

  it('accepts error response', () => {
    const result = faucetClaimResponseSchema.safeParse({ error: 'rate limited' })
    expect(result.success).toBe(true)
  })

  it('accepts shape with unknown keys (stripped by Zod)', () => {
    const result = faucetClaimResponseSchema.safeParse({ random: 'data' })
    expect(result.success).toBe(true) // both claim_event and error are optional; extra keys stripped
  })
})

describe('faucetStatusResponseSchema', () => {
  it('accepts a valid status response', () => {
    const result = faucetStatusResponseSchema.safeParse({
      claimEvents: {
        data: [
          {
            id: '123',
            attributes: {
              addressHash: 'ckt1q...',
              capacity: '10000',
              status: 'pending',
              txStatus: null,
              txHash: null,
              timestamp: '2024-01-01T00:00:00Z',
            },
          },
        ],
      },
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty data', () => {
    const result = faucetStatusResponseSchema.safeParse({
      claimEvents: { data: [] },
    })
    expect(result.success).toBe(true)
  })

  it('accepts response with error only', () => {
    const result = faucetStatusResponseSchema.safeParse({ error: 'not found' })
    expect(result.success).toBe(true)
  })

  it('rejects malformed claim event structure', () => {
    const result = faucetStatusResponseSchema.safeParse({
      claimEvents: { data: [{ id: '1', attributes: { bad: 'data' } }] },
    })
    expect(result.success).toBe(false)
  })
})

describe('outpointSchema', () => {
  it('parses a valid outpoint string', () => {
    const result = outpointSchema.safeParse('0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8:0')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.txHash).toBe('0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8')
      expect(result.data.index).toBe(0)
    }
  })

  it('parses outpoint with multi-digit index', () => {
    const result = outpointSchema.safeParse('0xabc:42')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.index).toBe(42)
    }
  })

  it('parses outpoint with a short txHash', () => {
    const result = outpointSchema.safeParse('0xdeadbeef:3')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.txHash).toBe('0xdeadbeef')
      expect(result.data.index).toBe(3)
    }
  })

  it('rejects string without a colon separator', () => {
    const result = outpointSchema.safeParse('0xabc')
    expect(result.success).toBe(false)
  })

  it('rejects string with multiple colons', () => {
    const result = outpointSchema.safeParse('0xabc:0:extra')
    expect(result.success).toBe(false)
  })

  it('rejects empty string', () => {
    const result = outpointSchema.safeParse('')
    expect(result.success).toBe(false)
  })

  it('rejects txHash without 0x prefix', () => {
    const result = outpointSchema.safeParse('abc123:0')
    expect(result.success).toBe(false)
  })

  it('rejects txHash with invalid hex characters', () => {
    const result = outpointSchema.safeParse('0xzzzz:0')
    expect(result.success).toBe(false)
  })

  it('rejects non-numeric index', () => {
    const result = outpointSchema.safeParse('0xabc:abc')
    expect(result.success).toBe(false)
  })

  it('rejects empty txHash segment', () => {
    const result = outpointSchema.safeParse(':0')
    expect(result.success).toBe(false)
  })

  it('rejects empty index segment', () => {
    const result = outpointSchema.safeParse('0xabc:')
    expect(result.success).toBe(false)
  })

  it('rejects index with trailing dash (not a valid number)', () => {
    const result = outpointSchema.safeParse('0xabc:-')
    expect(result.success).toBe(false)
  })
})
