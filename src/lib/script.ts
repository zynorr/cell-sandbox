import type { ScriptState, KnownScript } from '@/types'

// Pudge testnet deployment outpoints used by the design registry.
// Build Tx uses CCC's network-aware registry for supported system scripts.
export const KNOWN_SCRIPTS: KnownScript[] = [
  {
    name: 'Secp256k1 Blake160 SighashAll',
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    hashType: 'type',
    roles: ['lock'],
    description: 'Standard CKB lock using a 20-byte public-key hash',
  },
  {
    name: 'Secp256k1 Multisig',
    codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
    hashType: 'type',
    roles: ['lock'],
    description: 'Multisignature secp256k1 lock',
  },
  {
    name: 'xUDT',
    codeHash: '0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb',
    hashType: 'type',
    roles: ['type'],
    description: 'Extensible UDT type script - Pudge deployment',
    cellDep: {
      txHash: '0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f',
      index: 0,
      depType: 'code',
    },
  },
  {
    name: 'Spore v2',
    codeHash: '0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d',
    hashType: 'data1',
    roles: ['type'],
    description: 'Spore Protocol digital-object type script - Pudge deployment',
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
    roles: ['lock'],
    description: 'Interoperable authentication lock - Pudge deployment',
    cellDep: {
      txHash: '0xec18bf0d857c981c3d1f4e17999b9b90c484b303378e94de1a57b0872f5d4602',
      index: 0,
      depType: 'code',
    },
  },
  {
    name: 'Always Success',
    codeHash: '0x3b521cc4b552f109d092d8cc468a8048acb53c5952dbe769d2b2f9cf6e47f7f1',
    hashType: 'data1',
    roles: ['lock'],
    description: 'Anyone-can-spend testing lock - never use for valuable CKB',
    cellDep: {
      txHash: '0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93',
      index: 0,
      depType: 'code',
    },
  },
  {
    name: 'Nervos DAO',
    codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
    hashType: 'type',
    roles: ['type'],
    description: 'Nervos DAO deposit and two-phase withdrawal type script',
    cellDep: {
      txHash: '0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f',
      index: 2,
      depType: 'code',
    },
  },
  {
    name: 'Cheque',
    codeHash: '0x60d5f39efce409c587cb9ea359cefdead650ca128f0bd9cb3855348f98c70d5b',
    hashType: 'type',
    roles: ['lock'],
    description: 'Cheque lock for receiver claims and delayed sender withdrawals',
    cellDep: {
      txHash: '0x7f96858be0a9d584b4a9ea190e0420835156a6010a5fde15ffcdc9d9c721ccab',
      index: 0,
      depType: 'depGroup',
    },
  },
  {
    name: 'Type ID',
    codeHash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
    hashType: 'type',
    roles: ['type'],
    description: 'Singleton type identity preserved across Cell updates',
  },
]

export function getScriptCellDep(codeHash: string): { txHash: string; index: number; depType: 'code' | 'depGroup' } | undefined {
  return KNOWN_SCRIPTS.find((script) => script.codeHash.toLowerCase() === codeHash.toLowerCase())?.cellDep
}

export function getKnownScript(name: string): ScriptState | undefined {
  const found = KNOWN_SCRIPTS.find(
    (script) => script.name.toLowerCase() === name.toLowerCase()
  )
  if (!found) return undefined
  return {
    codeHash: found.codeHash,
    hashType: found.hashType,
    args: '',
  }
}
