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
  const ckb = Number(capacity) / 1e8
  return `${ckb.toFixed(2)} CKB`
}

