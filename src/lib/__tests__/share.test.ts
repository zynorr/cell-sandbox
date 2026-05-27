import { describe, it, expect, vi, beforeEach } from 'vitest'
import { serializeCells, deserializeCells, buildShareUrl, copyToClipboard } from '../share'
import type { CellState } from '@/types'

const mockCells: CellState[] = [
  {
    capacity: '6100000000',
    lock: { codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8', hashType: 'type', args: '0x' },
    type: null,
    data: '0x',
    dataMode: 'hex',
  },
  {
    capacity: '14200000000',
    lock: { codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8', hashType: 'type', args: '0x1234' },
    type: {
      codeHash: '0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb',
      hashType: 'type',
      args: '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    data: '0x00e87648170000000000000000000000',
    dataMode: 'hex',
  },
]

describe('serializeCells', () => {
  it('should encode cells as a base64 string with the cs= prefix', () => {
    const result = serializeCells(mockCells)
    expect(result).toMatch(/^cs=/)
    const encoded = result.slice(3)
    expect(() => atob(encoded)).not.toThrow()
  })

  it('should return empty string for invalid input gracefully', () => {
    const circular: Record<string, unknown> = { a: 1 }
    circular.self = circular
    const result = serializeCells(circular as unknown as CellState[])
    expect(result).toBe('')
  })
})

describe('deserializeCells', () => {
  it('should return null for empty search params', () => {
    expect(deserializeCells('')).toBeNull()
    expect(deserializeCells('?other=123')).toBeNull()
  })

  it('should round-trip cells through serialise/deserialize', () => {
    const serialized = serializeCells(mockCells)
    const search = `?${serialized}`
    const result = deserializeCells(search)
    expect(result).toEqual(mockCells)
  })

  it('should return null for malformed base64', () => {
    const result = deserializeCells('?cs=this-is-not-valid-base64!!!')
    expect(result).toBeNull()
  })

  it('should return null for non-array JSON', () => {
    const encoded = btoa(encodeURIComponent('{"a":1}'))
    const result = deserializeCells(`?cs=${encoded}`)
    expect(result).toBeNull()
  })

  it('rejects cells with invalid hashType via Zod validation', () => {
    const badCells = JSON.stringify([
      {
        capacity: '100',
        lock: { codeHash: '0xabc', hashType: 'bogus', args: '0x' },
        type: null,
        data: '0x',
        dataMode: 'hex',
      },
    ])
    const encoded = btoa(encodeURIComponent(badCells))
    const result = deserializeCells('?cs=' + encoded)
    expect(result).toBeNull()
  })

  it('rejects cells with missing required fields via Zod', () => {
    const badCells = JSON.stringify([{ capacity: '100' }])
    const encoded = btoa(encodeURIComponent(badCells))
    const result = deserializeCells('?cs=' + encoded)
    expect(result).toBeNull()
  })

  it('rejects completely unexpected types (not an array)', () => {
    const badCells = JSON.stringify({ malicious: true, nested: null })
    const encoded = btoa(encodeURIComponent(badCells))
    const result = deserializeCells('?cs=' + encoded)
    expect(result).toBeNull()
  })
})

describe('buildShareUrl', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000/test?foo=bar' },
      writable: true,
    })
  })

  it('should build a share URL with encoded cells', () => {
    const url = buildShareUrl(mockCells)
    expect(url).toMatch(/^http:\/\/localhost:3000\/test\?cs=/)
    expect(url).not.toContain('foo=bar')
  })

  it('should fall back to current URL if serialization fails', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const url = buildShareUrl(circular as unknown as CellState[])
    expect(url).toBe('http://localhost:3000/test')
  })
})

describe('copyToClipboard', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      writable: true,
    })
  })

  it('should call clipboard.writeText and return true on success', async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined)
    const result = await copyToClipboard('hello')
    expect(result).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello')
  })

  it('should return false if clipboard write fails', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'))
    const result = await copyToClipboard('hello')
    expect(result).toBe(false)
  })

  it('should return false if navigator is undefined', async () => {
    const originalNav = globalThis.navigator
    ;(globalThis as unknown as { navigator: undefined }).navigator = undefined
    const result = await copyToClipboard('test')
    expect(result).toBe(false)
    globalThis.navigator = originalNav
  })
})
