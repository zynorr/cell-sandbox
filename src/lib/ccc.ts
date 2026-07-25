import { ccc } from '@ckb-ccc/ccc'
import { ClientPublicTestnet, ClientPublicMainnet } from '@ckb-ccc/core'

const clients: Map<string, ccc.Client> = new Map()

export function getClient(network: 'testnet' | 'mainnet' = 'testnet'): ccc.Client {
  const key = network
  let client = clients.get(key)
  if (!client) {
    client = network === 'testnet'
      ? new ClientPublicTestnet()
      : new ClientPublicMainnet()
    clients.set(key, client)
  }
  return client
}

export function getScriptColor(script: { codeHash: string }): string {
  const hashNum = ccc.numFrom(script.codeHash)
  const hue = Number((hashNum & ccc.numFrom(0xfff)) % ccc.numFrom(360))
  return `hsl(${hue} 65% 35%)`
}

export function formatCapacity(capacity: string | bigint | number): string {
  try {
    return formatCapacityExact(capacity)
  } catch {
    return 'Invalid capacity'
  }
}

export function formatCapacityExact(capacity: string | bigint | number): string {
  const value = BigInt(capacity)
  const negative = value < BigInt(0)
  const absolute = negative ? -value : value
  const whole = absolute / BigInt(100000000)
  const fraction = absolute % BigInt(100000000)
  const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const fractionText = fraction.toString().padStart(8, '0').replace(/0+$/, '')

  return `${negative ? '-' : ''}${wholeText}${fractionText ? `.${fractionText}` : ''} CKB`
}

