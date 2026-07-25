import type { StateCreator } from 'zustand'
import type { StoreState } from '../sandbox'

export interface FlowSlice {
  txOutputs: number[]

  toggleTxOutput: (index: number) => void
}

export const createFlowSlice: StateCreator<StoreState, [], [], FlowSlice> = (set) => ({
  txOutputs: [],

  toggleTxOutput: (index) =>
    set((s) => {
      const isOutput = s.txOutputs.includes(index)
      return {
        txOutputs: isOutput
          ? s.txOutputs.filter((i) => i !== index)
          : [...s.txOutputs, index],
      }
    }),
})
