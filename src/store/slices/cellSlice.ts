import type { StateCreator } from 'zustand'
import type { CellState } from '@/types'
import type { StoreState } from '../sandbox'
import { emptyCell, loadCellFromChain, generateExportCode } from '@/lib/cell'
import { defaultWallet } from './walletSlice'
import { outpointSchema } from '@/lib/schemas'

export interface CellSlice {
  cells: CellState[]
  selectedIndex: number | null
  loadOutpointInput: string

  setSelectedIndex: (i: number | null) => void
  setLoadOutpointInput: (v: string) => void
  addCell: (cell?: CellState) => void
  removeCell: (index: number) => void
  updateCell: (index: number, patch: Partial<CellState>) => void
  loadFromChain: () => Promise<void>
  resetCells: () => void
  restoreCells: (cells: CellState[]) => void
  exportAsCode: () => string
  applyTemplate: (cells: CellState[]) => void
}

export const createCellSlice: StateCreator<StoreState, [], [], CellSlice> = (set, get) => ({
  cells: [emptyCell()],
  selectedIndex: 0,
  loadOutpointInput: '',

  setSelectedIndex: (selectedIndex) => set({ selectedIndex }),
  setLoadOutpointInput: (loadOutpointInput) => set({ loadOutpointInput }),

  addCell: (cell) =>
    set((s) => ({
      cells: [...s.cells, cell ?? emptyCell()],
      selectedIndex: s.cells.length,
    })),

  removeCell: (index) =>
    set((s) => ({
      cells: s.cells.filter((_, i) => i !== index),
      txInputs: s.txInputs.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
      txOutputs: s.txOutputs.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
      selectedIndex:
        s.selectedIndex === index
          ? Math.min(index, s.cells.length - 2)
          : s.selectedIndex === null
            ? null
            : s.selectedIndex > index
              ? s.selectedIndex - 1
              : s.selectedIndex,
    })),

  updateCell: (index, patch) =>
    set((s) => {
      const next = [...s.cells]
      next[index] = { ...next[index], ...patch }
      return { cells: next }
    }),

  loadFromChain: async () => {
    const input = get().loadOutpointInput.trim()
    const parsed = outpointSchema.safeParse(input)
    if (!parsed.success) {
      set({ error: parsed.error.issues[0].message })
      return
    }
    const { txHash, index } = parsed.data

    const network = get().network
    set({ isLoading: true, error: null })
    const result = await loadCellFromChain(txHash, index, network)
    if (typeof result === 'string') {
      set({ error: result, isLoading: false })
      return
    }
    set((s) => ({
      cells: [...s.cells, result],
      selectedIndex: s.cells.length,
      isLoading: false,
    }))
  },

  resetCells: () =>
    set({
      cells: [emptyCell()],
      selectedIndex: 0,
      txInputs: [],
      txOutputs: [],
      wallet: { ...defaultWallet },
    }),

  restoreCells: (cells: CellState[]) => set({ cells, selectedIndex: 0 }),

  exportAsCode: () => generateExportCode(get().cells),

  applyTemplate: (cells) =>
    set({ cells, selectedIndex: 0, showTemplates: false }),
})
