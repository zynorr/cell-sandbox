import type { CellState } from '@/types'

export interface CellTemplate {
  id: string
  name: string
  description: string
  category: 'token' | 'nft' | 'dao' | 'auth' | 'demo'
  color: string
  cells: CellState[]
  sendable?: boolean
  requiresWalletLock?: boolean
}

export const CELL_TEMPLATES: CellTemplate[] = [
  {
    id: 'simple-transfer',
    name: 'CKB Transfer',
    description: 'Create a standard 62 CKB output. The connected wallet fills the lock; replace it to send to another recipient.',
    category: 'token',
    color: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
    sendable: true,
    requiresWalletLock: true,
    cells: [
      {
        capacity: '6200000000',
        lock: {
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
          args: '0x',
        },
        type: null,
        data: '0x',
        dataMode: 'hex',
      },
    ],
  },
  {
    id: 'dao-deposit',
    name: 'DAO Deposit',
    description: 'Create a fresh 102 CKB Nervos DAO deposit with the required 8 zero data bytes.',
    category: 'dao',
    color: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
    sendable: true,
    requiresWalletLock: true,
    cells: [
      {
        capacity: '10200000000',
        lock: {
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
          args: '0x',
        },
        type: {
          codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
          hashType: 'type',
          args: '0x',
        },
        data: '0x0000000000000000',
        dataMode: 'hex',
      },
    ],
  },
  {
    id: 'always-success',
    name: 'Always Success',
    description: 'Design only: a real testing lock that anyone can spend. Never use it to hold valuable CKB.',
    category: 'demo',
    color: 'bg-stone-600/20 text-stone-300 border-stone-600/30',
    cells: [
      {
        capacity: '6100000000',
        lock: {
          codeHash: '0x3b521cc4b552f109d092d8cc468a8048acb53c5952dbe769d2b2f9cf6e47f7f1',
          hashType: 'data1',
          args: '0x',
        },
        type: null,
        data: '0x',
        dataMode: 'hex',
      },
    ],
  },
  {
    id: 'xudt-token',
    name: 'xUDT Token',
    description: 'Design only: the first 16 data bytes hold a raw uint128 LE amount. The owner lock hash is a placeholder.',
    category: 'token',
    color: 'bg-violet-600/20 text-violet-300 border-violet-600/30',
    cells: [
      {
        capacity: '14300000000',
        lock: {
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
          args: '0x',
        },
        type: {
          codeHash: '0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb',
          hashType: 'type',
          args: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        data: '0x00e87648170000000000000000000000',
        dataMode: 'hex',
      },
    ],
  },
  {
    id: 'spore-dob',
    name: 'Spore v2 Cell',
    description: 'Design only: Molecule-encoded text content with sample IDs. A real Spore ID is derived from its creation transaction.',
    category: 'nft',
    color: 'bg-pink-600/20 text-pink-300 border-pink-600/30',
    cells: [
      {
        capacity: '21500000000',
        lock: {
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
          args: '0x',
        },
        type: {
          codeHash: '0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d',
          hashType: 'data1',
          args: '0x1111111111111111111111111111111111111111111111111111111111111111',
        },
        data: '0x58000000100000001e000000340000000a000000746578742f706c61696e1200000074657374696e6720706c61696e20746578742000000021a30f2b2f4927dbd6fd3917990af0dbb868438f44184e84d515f9af84ae4861',
        dataMode: 'hex',
      },
    ],
  },
  {
    id: 'omnilock',
    name: 'Omnilock Cell',
    description: 'Design only: inspect an Ethereum-auth Omnilock. The sample authentication ID is not your connected wallet.',
    category: 'auth',
    color: 'bg-cyan-600/20 text-cyan-300 border-cyan-600/30',
    cells: [
      {
        capacity: '6200000000',
        lock: {
          codeHash: '0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb',
          hashType: 'type',
          args: '0x01e2a01a7d8e8d86c2df1e7bad2f5ad3875015d8b5',
        },
        type: null,
        data: '0x',
        dataMode: 'hex',
      },
    ],
  },
]
