import { NextRequest, NextResponse } from 'next/server'
import { faucetClaimRequestSchema, faucetClaimResponseSchema, faucetStatusResponseSchema } from '@/lib/schemas'

const BASE = 'https://faucet-api.nervos.org'

interface NormalizedFaucetClaim {
  id?: string | number
  address: string
  amount: string
  status?: string
  txStatus?: string | null
  txHash?: string | null
  timestamp?: string | number
}

function stringifyFaucetError(value: unknown): string {
  if (!value) return 'Faucet request failed'
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => stringifyFaucetError(item)).join(', ')
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['detail', 'message', 'title']) {
      if (typeof record[key] === 'string') return record[key]
    }
    const textValues = Object.values(record).filter((item): item is string => typeof item === 'string')
    if (textValues.length > 0) return textValues.join(', ')
    return JSON.stringify(value)
  }
  return String(value)
}

function normalizeClaim(result: {
  data?: {
    id: string | number
    attributes: {
      addressHash: string
      capacity: string
      status: string
      txStatus: string | null
      txHash: string | null
      timestamp: string | number
    }
  }
  claim_event?: {
    id?: string | number
    address_hash: string
    amount: string | number
    status?: string
    tx_hash?: string | null
  }
}): NormalizedFaucetClaim | null {
  if (result.data?.attributes) {
    const attrs = result.data.attributes
    return {
      id: result.data.id,
      address: attrs.addressHash,
      amount: attrs.capacity,
      status: attrs.status,
      txStatus: attrs.txStatus,
      txHash: attrs.txHash,
      timestamp: attrs.timestamp,
    }
  }

  if (result.claim_event) {
    return {
      id: result.claim_event.id,
      address: result.claim_event.address_hash,
      amount: String(result.claim_event.amount),
      status: result.claim_event.status,
      txHash: result.claim_event.tx_hash,
    }
  }

  return null
}

async function getFaucetCookies(): Promise<{ csrf: string; cookie: string }> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'CellSandbox/1.0' },
  })
  const html = await res.text()

  const csrfMatch = html.match(/csrf-token" content="([^"]+)/)
  if (!csrfMatch) throw new Error('Could not get CSRF token')

  const setCookie = res.headers.get('set-cookie') ?? ''
  const cookies = setCookie
    .split(',')
    .map((c: string) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ')

  return { csrf: csrfMatch[1], cookie: cookies }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()

    // Validate incoming request body
    const parsedBody = faucetClaimRequestSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    const { csrf, cookie } = await getFaucetCookies()

    const claimRes = await fetch(`${BASE}/claim_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
        'Cookie': cookie,
        'Accept': 'application/json',
        'User-Agent': 'CellSandbox/1.0',
      },
      body: JSON.stringify({
        claim_event: { address_hash: parsedBody.data.address, amount: '10000' },
      }),
    })

    const text = await claimRes.text()
    let result: unknown
    try {
      result = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: 'Faucet returned unexpected response' }, { status: 502 })
    }

    const validatedClaim = faucetClaimResponseSchema.safeParse(result)
    if (!validatedClaim.success) {
      return NextResponse.json({ error: 'Faucet returned unexpected response' }, { status: 502 })
    }

    if (!claimRes.ok || validatedClaim.data.error || validatedClaim.data.errors) {
      return NextResponse.json(
        { ok: false, error: stringifyFaucetError(validatedClaim.data.error ?? validatedClaim.data.errors) },
        { status: claimRes.ok ? 502 : claimRes.status }
      )
    }

    const claim = normalizeClaim(validatedClaim.data)
    if (!claim) {
      return NextResponse.json({ ok: false, error: 'Faucet returned no claim details' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, claim })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Faucet request failed' },
      { status: 502 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get('address')
    if (!address) {
      return NextResponse.json({ error: '?address= required' }, { status: 400 })
    }

    const res = await fetch(`${BASE}/claim_events`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CellSandbox/1.0',
      },
    })
    const data: unknown = await res.json()

    // Validate the faucet API response structure
    const parsed = faucetStatusResponseSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid response from faucet status API' }, { status: 502 })
    }

    const claimEvents = parsed.data.claimEvents
    if (!claimEvents) {
      return NextResponse.json({ claims: [] })
    }

    const userClaims = claimEvents.data
      .filter((ce) => ce.attributes.addressHash === address)
      .map((ce) => ({
        id: ce.id,
        capacity: ce.attributes.capacity,
        status: ce.attributes.status,
        txStatus: ce.attributes.txStatus,
        txHash: ce.attributes.txHash,
        timestamp: ce.attributes.timestamp,
      }))

    return NextResponse.json({ claims: userClaims })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Status check failed' },
      { status: 502 }
    )
  }
}
