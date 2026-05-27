import type { ScriptState, KnownScript } from '@/types'

// Pudge testnet deployment outpoints from CCC's built-in script registry.
// System scripts with TYPE_ID type need cell deps; built-in scripts (always-success, all-zero) do not.
export const KNOWN_SCRIPTS: KnownScript[] = [
  {
    name: 'Secp256k1 (Blake160)',
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    hashType: 'type',
    description: 'Standard ECDSA secp256k1 signature verification',
  },
  {
    name: 'Secp256k1 (Multisig)',
    codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
    hashType: 'type',
    description: 'Multi-signature secp256k1 verification',
  },
  {
    name: 'xUDT',
    codeHash: '0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb',
    hashType: 'type',
    description: 'Extensible User-Defined Token — Pudge deployment',
    cellDep: {
      txHash: '0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f',
      index: 0,
      depType: 'code',
    },
  },
  {
    name: 'Spore DOB',
    codeHash: '0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d',
    hashType: 'data1',
    description: 'Spore Protocol v2 — Pudge deployment',
    cellDep: {
      txHash: '0x5e8d2a517d50fd4bb4d01737a7952a1f1d35c8afc77240695bb569cd7d9d5a1f',
      index: 0,
      depType: 'code',
    },
  },
  {
    name: 'Omnilock',
    codeHash: '0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb',
    hashType: 'type',
    description: 'Universal lock — supports ETH/BTC/Doge auth (Pudge)',
    cellDep: {
      txHash: '0xec18bf0d857c981c3d1f4e17999b9b90c484b303378e94de1a57b0872f5d4602',
      index: 0,
      depType: 'code',
    },
  },
  {
    name: 'Always Success',
    codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    hashType: 'data',
    description: 'Always passes — useful for testing',
  },
  {
    name: 'Nervos DAO',
    codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
    hashType: 'type',
    description: 'Nervos DAO deposit/withdraw',
    cellDep: {
      txHash: '0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f',
      index: 2,
      depType: 'code',
    },
  },
  {
    name: 'Cheque',
    codeHash: '0x0187a2c0e8cac4df8bb0f0c7fad1e128c1add0e5b08d83ecc4ad3ce06b8c5cfe',
    hashType: 'type',
    description: 'Cheque lock — pull-based token transfer',
  },
  {
    name: 'Type ID',
    codeHash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
    hashType: 'type',
    description: 'Unique identifier for cell types',
  },
]

export function getScriptCellDep(codeHash: string): { txHash: string; index: number; depType: 'code' | 'depGroup' } | undefined {
  return KNOWN_SCRIPTS.find((s) => s.codeHash.toLowerCase() === codeHash.toLowerCase())?.cellDep
}

export function getKnownScript(name: string): ScriptState | undefined {
  const found = KNOWN_SCRIPTS.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  )
  if (!found) return undefined
  return {
    codeHash: found.codeHash,
    hashType: found.hashType,
    args: '',
  }
}
