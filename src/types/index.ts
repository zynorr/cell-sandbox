export interface CellState {
  capacity: string
  lock: ScriptState
  type: ScriptState | null
  data: string
  dataMode: 'hex' | 'text' | 'number'
  outPoint?: { txHash: string; index: number }
}

export interface WalletState {
  connected: boolean
  address: string
  balance: { capacity: string; occupied: string; free: string }
  isConnecting: boolean
  isSending: boolean
  lastTxHash: string | null
  explorerUrl: string | null
  sendError: string | null
  lockScript?: ScriptState
}

export interface ScriptState {
  codeHash: string
  hashType: 'type' | 'data' | 'data1' | 'data2'
  args: string
}

export interface CellDep {
  txHash: string
  index: number
  depType: 'code' | 'depGroup'
}

export interface KnownScript {
  name: string
  codeHash: string
  hashType: 'type' | 'data' | 'data1' | 'data2'
  description: string
  cellDep?: CellDep
}

export interface TransactionFlow {
  inputs: number[]
  outputs: number[]
  cellDeps: ScriptState[]
  witnesses: string[]
}

export type NetworkMode = 'testnet' | 'mainnet'

export type ViewMode = 'builder' | 'flow'
