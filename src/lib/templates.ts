import type { CellState } from '@/types'

export interface CellTemplate {
  id: string
  name: string
  description: string
  category: 'token' | 'nft' | 'dao' | 'auth' | 'demo'
  color: string
  cells: CellState[]
  sendable?: boolean
}

export const CELL_TEMPLATES: CellTemplate[] = [
  {
    id: 'simple-transfer',
    name: 'Simple Transfer',
    description: 'Send CKB to any address — secp256k1 lock, no type script, 61 CKB',
    category: 'token',
    color: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
    sendable: true,
    cells: [
      {
        capacity: '6100000000',
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
    description: 'Deposit CKB into Nervos DAO for staking rewards — sendable',
    category: 'dao',
    color: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
    sendable: true,
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
    description: 'Testing cell with no validation — always-success lock, no type, any data',
    category: 'demo',
    color: 'bg-stone-600/20 text-stone-300 border-stone-600/30',
    sendable: true,
    cells: [
      {
        capacity: '6100000000',
        lock: {
          codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          hashType: 'data',
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
    description: 'Design: xUDT fungible token — 1000 tokens, needs existing xUDT to send',
    category: 'token',
    color: 'bg-violet-600/20 text-violet-300 border-violet-600/30',
    cells: [
      {
        capacity: '14200000000',
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
    name: 'Spore DOB v2',
    description: 'Design: Spore Protocol digital object — needs existing Spore cell to send',
    category: 'nft',
    color: 'bg-pink-600/20 text-pink-300 border-pink-600/30',
    cells: [
      {
        capacity: '18000000000',
        lock: {
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
          args: '0x',
        },
        type: {
          codeHash: '0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d',
          hashType: 'data1',
          args: '0x',
        },
        data: '0x7b226e616d65223a20226578616d706c6520646f62222c202264657363223a202268656c6c6f2066726f6d207468652063656c6c2073616e64626f78227d',
        dataMode: 'hex',
      },
    ],
  },
  {
    id: 'omnilock',
    name: 'Omnilock Account',
    description: 'Design: Omnilock with ETH auth — supports ETH/BTC/Doge verification',
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
