import { ccc } from '@ckb-ccc/ccc'
import { ClientPublicMainnet, ClientPublicTestnet } from '@ckb-ccc/core'
import type { KnownScript, NetworkMode, ScriptState } from '@/types'

interface ScriptDefinition {
  cccId: ccc.KnownScript
  name: string
  roles: Array<'lock' | 'type'>
  description: string
}

const SCRIPT_DEFINITIONS: ScriptDefinition[] = [
  {
    cccId: ccc.KnownScript.Secp256k1Blake160,
    name: 'Secp256k1 Blake160 SighashAll',
    roles: ['lock'],
    description: 'Standard CKB lock using a 20-byte public-key hash',
  },
  {
    cccId: ccc.KnownScript.Secp256k1Multisig,
    name: 'Secp256k1 Multisig',
    roles: ['lock'],
    description: 'Legacy secp256k1 multisignature lock',
  },
  {
    cccId: ccc.KnownScript.Secp256k1MultisigV2,
    name: 'Secp256k1 Multisig V2',
    roles: ['lock'],
    description: 'Current CCC secp256k1 multisignature lock',
  },
  {
    cccId: ccc.KnownScript.AnyoneCanPay,
    name: 'Anyone Can Pay',
    roles: ['lock'],
    description: 'Lock that permits deposits without the owner signature',
  },
  {
    cccId: ccc.KnownScript.JoyId,
    name: 'JoyID',
    roles: ['lock'],
    description: 'Passkey-based ownership lock',
  },
  {
    cccId: ccc.KnownScript.OmniLock,
    name: 'Omnilock',
    roles: ['lock'],
    description: 'Interoperable authentication lock',
  },
  {
    cccId: ccc.KnownScript.NostrLock,
    name: 'Nostr Lock',
    roles: ['lock'],
    description: 'Nostr public-key ownership lock',
  },
  {
    cccId: ccc.KnownScript.AlwaysSuccess,
    name: 'Always Success',
    roles: ['lock'],
    description: 'Anyone-can-spend testing lock; never use for valuable CKB',
  },
  {
    cccId: ccc.KnownScript.NervosDao,
    name: 'Nervos DAO',
    roles: ['type'],
    description: 'Nervos DAO deposit and two-phase withdrawal type script',
  },
  {
    cccId: ccc.KnownScript.TypeId,
    name: 'Type ID',
    roles: ['type'],
    description: 'Singleton type identity preserved across Cell updates',
  },
  {
    cccId: ccc.KnownScript.SUdt,
    name: 'sUDT',
    roles: ['type'],
    description: 'Simple user-defined token type script',
  },
  {
    cccId: ccc.KnownScript.XUdt,
    name: 'xUDT',
    roles: ['type'],
    description: 'Extensible user-defined token type script',
  },
  {
    cccId: ccc.KnownScript.UniqueType,
    name: 'Unique Type',
    roles: ['type'],
    description: 'Unique on-chain identity type script',
  },
  {
    cccId: ccc.KnownScript.DidCkb,
    name: 'DID CKB',
    roles: ['type'],
    description: 'Decentralized identity type script',
  },
]

type PublicClient = ClientPublicTestnet | ClientPublicMainnet

const PUBLIC_CLIENTS: Record<NetworkMode, PublicClient> = {
  testnet: new ClientPublicTestnet(),
  mainnet: new ClientPublicMainnet(),
}

function getCccScriptInfo(network: NetworkMode, id: ccc.KnownScript): ccc.ScriptInfo | undefined {
  const client = PUBLIC_CLIENTS[network]
  const script = client.scripts[id]
  return script ? ccc.ScriptInfo.from(script) : undefined
}

export function getKnownScripts(network: NetworkMode = 'testnet'): KnownScript[] {
  return SCRIPT_DEFINITIONS.flatMap((definition) => {
    const info = getCccScriptInfo(network, definition.cccId)
    if (!info) return []

    return [{
      ...definition,
      codeHash: info.codeHash,
      hashType: info.hashType,
    }]
  })
}

export function getKnownScriptById(
  id: ccc.KnownScript,
  network: NetworkMode = 'testnet',
  args = '0x'
): ScriptState {
  const info = getCccScriptInfo(network, id)
  if (!info) throw new Error(`CCC has no ${id} deployment for ${network}.`)

  return {
    codeHash: info.codeHash,
    hashType: info.hashType,
    args: ccc.hexFrom(args),
  }
}

export function findKnownScript(
  script: Pick<ScriptState, 'codeHash' | 'hashType'>,
  network?: NetworkMode
): KnownScript | undefined {
  const networks: NetworkMode[] = network
    ? [network]
    : ['testnet', 'mainnet']

  for (const current of networks) {
    const found = getKnownScripts(current).find(
      (known) => known.codeHash.toLowerCase() === script.codeHash.toLowerCase()
    )
    if (found) return found
  }
}

export function isKnownScript(
  script: Pick<ScriptState, 'codeHash' | 'hashType'>,
  id: ccc.KnownScript,
  network?: NetworkMode
): boolean {
  const networks: NetworkMode[] = network ? [network] : ['testnet', 'mainnet']
  return networks.some((current) => {
    const known = getCccScriptInfo(current, id)
    return Boolean(
      known &&
      known.codeHash.toLowerCase() === script.codeHash.toLowerCase() &&
      known.hashType === script.hashType
    )
  })
}
