import type { StateCreator } from 'zustand'
import type { StoreState } from '../sandbox'

export interface FlowSlice {
  txInputs: number[]
  txOutputs: number[]

  toggleTxInput: (index: number) => void
  toggleTxOutput: (index: number) => void
}

export const createFlowSlice: StateCreator<StoreState, [], [], FlowSlice> = (set) => ({
  txInputs: [],
  txOutputs: [],

  toggleTxInput: (index) =>
    set((s) => {
      const isInput = s.txInputs.includes(index)
      const txOutputs = s.txOutputs.filter((i) => i !== index)
      return {
        txInputs: isInput
          ? s.txInputs.filter((i) => i !== index)
          : [...s.txInputs, index],
        txOutputs,
      }
    }),

  toggleTxOutput: (index) =>
    set((s) => {
      const isOutput = s.txOutputs.includes(index)
      const txInputs = s.txInputs.filter((i) => i !== index)
      return {
        txOutputs: isOutput
          ? s.txOutputs.filter((i) => i !== index)
          : [...s.txOutputs, index],
        txInputs,
      }
    }),
})
