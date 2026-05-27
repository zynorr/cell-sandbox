import type { StateCreator } from 'zustand'
import type { NetworkMode, ViewMode } from '@/types'
import type { StoreState } from '../sandbox'

export interface UISlice {
  network: NetworkMode
  isLoading: boolean
  error: string | null
  showTemplates: boolean
  viewMode: ViewMode

  setViewMode: (m: ViewMode) => void
  setNetwork: (n: NetworkMode) => void
  clearError: () => void
  setShowTemplates: (v: boolean) => void
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set) => ({
  network: 'testnet',
  isLoading: false,
  error: null,
  showTemplates: false,
  viewMode: 'builder',

  setViewMode: (viewMode) => set({ viewMode }),
  setNetwork: (network) => set({ network }),
  clearError: () => set({ error: null }),
  setShowTemplates: (showTemplates) => set({ showTemplates }),
})
