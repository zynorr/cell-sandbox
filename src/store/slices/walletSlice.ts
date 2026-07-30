import type { StateCreator } from 'zustand'
import type { CellState, WalletState, ScriptState } from '@/types'
import type { StoreState } from '../sandbox'
import { getClient } from '@/lib/ccc'
import { isKnownScript } from '@/lib/script'
import {
  isWalletFillableLock,
  validateOutputCells,
} from '@/lib/cellValidation'
import { ccc } from '@ckb-ccc/ccc'

const emptyBalance: WalletState['balance'] = { capacity: '0', occupied: '0', free: '0' }

function getExplorerUrl(network: string, txHash: string): string {
  const base = network === 'mainnet'
    ? 'https://explorer.nervos.org'
    : 'https://pudge.explorer.nervos.org'
  return `${base}/transaction/${txHash}`
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function toCccScript(script: ScriptState): ccc.Script {
  return ccc.Script.from({
    codeHash: ccc.hexFrom(script.codeHash),
    hashType: script.hashType as ccc.HashType,
    args: ccc.hexFrom(script.args || '0x'),
  })
}

async function getSpendableBalance(lockScript: ScriptState, network: 'testnet' | 'mainnet'): Promise<WalletState['balance']> {
  const client = getClient(network)
  const capacity = await client.getBalanceSingle(toCccScript(lockScript))
  const balance = capacity.toString()
  return { capacity: balance, occupied: '0', free: balance }
}

let activeSigner: ccc.Signer | undefined

export const defaultWallet: WalletState = {
  connected: false,
  address: '',
  walletName: '',
  signerName: '',
  balance: emptyBalance,
  isConnecting: false,
  isRefreshingBalance: false,
  isSending: false,
  lastTxHash: null,
  explorerUrl: null,
  sendError: null,
  balanceError: null,
}

export interface WalletSlice {
  wallet: WalletState
  showConfirmDialog: boolean

  connectWallet: (signer: ccc.Signer, walletName: string, signerName: string) => Promise<void>
  disconnectWallet: () => void
  refreshWalletBalance: () => Promise<void>
  sendTransaction: () => Promise<void>
  setShowConfirmDialog: (v: boolean) => void
}

export const createWalletSlice: StateCreator<StoreState, [], [], WalletSlice> = (set, get) => ({
  wallet: { ...defaultWallet },
  showConfirmDialog: false,

  setShowConfirmDialog: (showConfirmDialog) => set({ showConfirmDialog }),

  connectWallet: async (signer, walletName, signerName) => {
    const state = get()
    if (state.wallet.isConnecting) return
    if (activeSigner === signer && state.wallet.connected) return
    set({ wallet: { ...state.wallet, isConnecting: true, sendError: null, balanceError: null } })

    try {
      if (!(await signer.isConnected())) await signer.connect()
      const addressObjs = await signer.getAddressObjs()
      const addressObj = addressObjs[0]
      const addressScript = addressObj?.script
      if (!addressObj || !addressScript) {
        throw new Error('The selected wallet did not provide a CKB address for this network.')
      }

      activeSigner = signer
      const walletLockScript: ScriptState = {
        codeHash: addressScript.codeHash,
        hashType: addressScript.hashType as ScriptState['hashType'],
        args: addressScript.args,
      }

      set((current) => ({
        cells: current.cells.map((cell) =>
          isWalletFillableLock(cell.lock, state.network)
            ? { ...cell, lock: { ...walletLockScript } }
            : cell
        ),
        wallet: {
          connected: true,
          address: addressObj.toString(),
          walletName,
          signerName,
          balance: emptyBalance,
          isConnecting: false,
          isRefreshingBalance: false,
          isSending: false,
          lastTxHash: null,
          explorerUrl: null,
          sendError: null,
          balanceError: null,
          lockScript: walletLockScript,
        },
      }))
      await get().refreshWalletBalance()
    } catch (e) {
      activeSigner = undefined
      set({
        wallet: {
          ...defaultWallet,
          sendError: getErrorMessage(e, 'Failed to connect wallet'),
        },
      })
    }
  },

  disconnectWallet: () => {
    activeSigner = undefined
    set({ wallet: { ...defaultWallet } })
  },

  refreshWalletBalance: async () => {
    const state = get()
    if (!state.wallet.connected) return

    if (!state.wallet.lockScript) {
      set({
        wallet: {
          ...state.wallet,
          isRefreshingBalance: false,
          balanceError: 'Wallet lock script is unavailable.',
        },
      })
      return
    }

    set({
      wallet: {
        ...state.wallet,
        isRefreshingBalance: true,
        balanceError: null,
      },
    })

    try {
      const balance = await getSpendableBalance(state.wallet.lockScript, state.network)
      set({
        wallet: {
          ...get().wallet,
          balance,
          isRefreshingBalance: false,
          balanceError: null,
        },
      })
    } catch (e) {
      set({
        wallet: {
          ...get().wallet,
          isRefreshingBalance: false,
          balanceError: getErrorMessage(e, 'Could not refresh wallet balance'),
        },
      })
    }
  },

  sendTransaction: async () => {
    const state = get()
    const hasDaoOutput = state.txOutputs.some((index) => {
      const type = state.cells[index]?.type
      return Boolean(type && isKnownScript(type, ccc.KnownScript.NervosDao, state.network))
    })
    if (state.wallet.isSending || !state.wallet.connected) return
    set({ wallet: { ...state.wallet, isSending: true, sendError: null, lastTxHash: null, explorerUrl: null } })

    try {
      const ckbSigner = activeSigner
      if (!ckbSigner) throw new Error('Wallet signer is unavailable. Reconnect your wallet and try again.')
      if (!(await ckbSigner.isConnected())) await ckbSigner.connect()
      const client = getClient(state.network)

      const outputs: ccc.CellOutput[] = []
      const outputsData: string[] = []
      const outputSelections = state.txOutputs
        .map((index) => ({ index, cell: state.cells[index] }))
        .filter((selection): selection is { index: number; cell: CellState } => selection.cell !== undefined)
      const outputIssues = validateOutputCells(outputSelections, state.network)
      if (outputIssues.length > 0) throw new Error(outputIssues[0])

      for (const { cell } of outputSelections) {

        const lock = ccc.Script.from({
          codeHash: ccc.hexFrom(cell.lock.codeHash || '0x0000000000000000000000000000000000000000000000000000000000000000'),
          hashType: cell.lock.hashType as ccc.HashType,
          args: ccc.hexFrom(cell.lock.args || '0x'),
        })
        const type = cell.type
          ? ccc.Script.from({
              codeHash: ccc.hexFrom(cell.type.codeHash),
              hashType: cell.type.hashType as ccc.HashType,
              args: ccc.hexFrom(cell.type.args || '0x'),
            })
          : undefined

        outputs.push(
          ccc.CellOutput.from({
            capacity: BigInt(cell.capacity),
            lock,
            ...(type ? { type } : {}),
          })
        )
        outputsData.push(ccc.hexFrom(cell.data || '0x'))
      }

      const tx = ccc.Transaction.from({ outputs, outputsData })

      if (hasDaoOutput) {
        await tx.addCellDepsOfKnownScripts(client, ccc.KnownScript.NervosDao)
      }

      if (tx.outputs.length === 0) throw new Error('No outputs assigned. Mark cells as outputs in Tx Flow view.')

      await tx.completeInputsByCapacity(ckbSigner)
      await tx.completeFeeBy(ckbSigner, 1000)
      const txHash = await ckbSigner.sendTransaction(tx)
      const explorerUrl = getExplorerUrl(state.network, txHash)

      set({
        wallet: {
          ...get().wallet,
          isSending: false,
          lastTxHash: txHash,
          explorerUrl,
          sendError: null,
        },
      })
      await get().refreshWalletBalance()
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Transaction failed'
      let friendly = raw

      if (raw.includes('Insufficient CKB')) {
        friendly = 'Insufficient CKB - claim testnet tokens from the faucet or reduce your output capacities.'
      } else if (raw.includes('ScriptNotFound')) {
        friendly = 'Script not found - a needed cell dep is missing or the script is undeployed on this network.'
      } else if (raw.includes('error code -1 on page')) {
        friendly = 'Invalid script args - the script expected a different arg length (for example, xUDT starts with a 32-byte owner lock hash).'
      } else if (raw.includes('error code -52') || raw.includes('ERROR_AMOUNT')) {
        friendly = 'Token amount mismatch - you need input Cells with the same token type to create xUDT outputs.'
      } else if (hasDaoOutput && raw.includes('error code -4')) {
        friendly = 'Invalid Nervos DAO output data. A new DAO deposit must contain exactly 8 zero bytes (0x0000000000000000).'
      }

      set({
        wallet: {
          ...get().wallet,
          isSending: false,
          sendError: friendly,
        },
      })
    }
  },
})
