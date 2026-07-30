import { ccc } from '@ckb-ccc/ccc'
import type { CellState, NetworkMode } from '@/types'
import { getKnownScriptById } from './script'

export interface CellTemplate {
  id: string
  name: string
  description: string
  category: 'token' | 'dao' | 'auth' | 'demo'
  color: string
  cells: CellState[]
  sendable?: boolean
  requiresWalletLock?: boolean
}

export function getCellTemplates(network: NetworkMode = 'testnet'): CellTemplate[] {
  const secp = getKnownScriptById(ccc.KnownScript.Secp256k1Blake160, network)

  return [
    {
      id: 'simple-transfer',
      name: 'CKB Transfer',
      description: 'Create a standard 62 CKB output. The connected wallet fills its lock by default; use Design for another recipient.',
      category: 'token',
      color: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
      sendable: true,
      requiresWalletLock: true,
      cells: [{
        capacity: '6200000000',
        lock: secp,
        type: null,
        data: '0x',
        dataMode: 'hex',
      }],
    },
    {
      id: 'dao-deposit',
      name: 'DAO Deposit',
      description: 'Create a fresh 102 CKB Nervos DAO deposit with the required 8 zero data bytes.',
      category: 'dao',
      color: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
      sendable: true,
      requiresWalletLock: true,
      cells: [{
        capacity: '10200000000',
        lock: secp,
        type: getKnownScriptById(ccc.KnownScript.NervosDao, network),
        data: '0x0000000000000000',
        dataMode: 'hex',
      }],
    },
    {
      id: 'always-success',
      name: 'Always Success',
      description: 'A real testing lock that anyone can spend. Never use it to hold valuable CKB.',
      category: 'demo',
      color: 'bg-stone-600/20 text-stone-300 border-stone-600/30',
      cells: [{
        capacity: '6100000000',
        lock: getKnownScriptById(ccc.KnownScript.AlwaysSuccess, network),
        type: null,
        data: '0x',
        dataMode: 'hex',
      }],
    },
    {
      id: 'xudt-token',
      name: 'xUDT Token',
      description: 'The first 16 data bytes hold a raw uint128 LE amount. The owner lock hash is a placeholder.',
      category: 'token',
      color: 'bg-violet-600/20 text-violet-300 border-violet-600/30',
      cells: [{
        capacity: '14300000000',
        lock: secp,
        type: getKnownScriptById(
          ccc.KnownScript.XUdt,
          network,
          `0x${'0'.repeat(64)}`
        ),
        data: '0x00e87648170000000000000000000000',
        dataMode: 'hex',
      }],
    },
    {
      id: 'omnilock',
      name: 'Omnilock Cell',
      description: 'Inspect an Ethereum-auth Omnilock. The sample authentication ID is not your connected wallet.',
      category: 'auth',
      color: 'bg-cyan-600/20 text-cyan-300 border-cyan-600/30',
      cells: [{
        capacity: '6200000000',
        lock: getKnownScriptById(
          ccc.KnownScript.OmniLock,
          network,
          '0x01e2a01a7d8e8d86c2df1e7bad2f5ad3875015d8b5'
        ),
        type: null,
        data: '0x',
        dataMode: 'hex',
      }],
    },
  ]
}
