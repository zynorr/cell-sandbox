import { create } from 'zustand'
import type { CellSlice } from './slices/cellSlice'
import type { UISlice } from './slices/uiSlice'
import type { FlowSlice } from './slices/flowSlice'
import type { WalletSlice } from './slices/walletSlice'
import { createCellSlice } from './slices/cellSlice'
import { createUISlice } from './slices/uiSlice'
import { createFlowSlice } from './slices/flowSlice'
import { createWalletSlice } from './slices/walletSlice'

export type StoreState = CellSlice & UISlice & FlowSlice & WalletSlice

export const useSandbox = create<StoreState>()((...a) => ({
  ...createCellSlice(...a),
  ...createUISlice(...a),
  ...createFlowSlice(...a),
  ...createWalletSlice(...a),
}))
