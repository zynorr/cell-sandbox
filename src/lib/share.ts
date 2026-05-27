import type { CellState } from '@/types'
import { cellStateArraySchema } from './schemas'

const KEY = 'cs'

export function serialiseCells(cells: CellState[]): string {
  try {
    const json = JSON.stringify(cells)
    const encoded = typeof btoa !== 'undefined'
      ? btoa(encodeURIComponent(json))
      : Buffer.from(encodeURIComponent(json)).toString('base64')
    return `${KEY}=${encoded}`
  } catch {
    return ''
  }
}

export function deserializeCells(search: string): CellState[] | null {
  try {
    const params = new URLSearchParams(search)
    const encoded = params.get(KEY)
    if (!encoded) return null

    const decoded = typeof atob !== 'undefined'
      ? atob(encoded)
      : Buffer.from(encoded, 'base64').toString('utf-8')

    const json = decodeURIComponent(decoded)
    const parsed: unknown = JSON.parse(json)

    // Zod validation — reject malformed or malicious payloads
    const result = cellStateArraySchema.safeParse(parsed)
    if (!result.success) return null

    return result.data as CellState[]
  } catch {
    return null
  }
}

export function buildShareUrl(cells: CellState[]): string {
  const serialized = serialiseCells(cells)
  if (!serialized) return window.location.href.split('?')[0]
  const base = window.location.href.split('?')[0]
  return `${base}?${serialized}`
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return Promise.resolve(false)
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
}
