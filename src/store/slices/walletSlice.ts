import type { StateCreator } from 'zustand'
import type { WalletState, ScriptState } from '@/types'
import type { StoreState } from '../sandbox'
import { getClient } from '@/lib/ccc'
import { getScriptCellDep } from '@/lib/script'
import { ccc } from '@ckb-ccc/ccc'

function getExplorerUrl(network: string, txHash: string): string {
  const base = network === 'mainnet'
    ? 'https://explorer.nervos.org'
    : 'https://pudge.explorer.nervos.org'
  return `${base}/transaction/${txHash}`
}

const signersByNetwork: Map<string, ccc.Signer> = new Map()

async function getCkbSigner(network: string): Promise<ccc.Signer> {
  const key = network
  let signer = signersByNetwork.get(key)
  if (signer) return signer

  const client = getClient(network as 'testnet' | 'mainnet')
  const signerList = ccc.JoyId.getJoyIdSigners(
    client,
    'Cell Sandbox',
    typeof window !== 'undefined' ? window.location.origin + '/favicon.ico' : '',
    []
  )
  signer = signerList.find((s: { name: string }) => s.name === 'CKB')?.signer
  if (!signer) throw new Error('CKB signer not available')
  signersByNetwork.set(key, signer)
  return signer
}

export const defaultWallet: WalletState = {
  connected: false,
  address: '',
  balance: { capacity: '0', occupied: '0', free: '0' },
  isConnecting: false,
  isSending: false,
  lastTxHash: null,
  explorerUrl: null,
  sendError: null,
}

export interface WalletSlice {
  wallet: WalletState
  showConfirmDialog: boolean

  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  sendTransaction: () => Promise<void>
  setShowConfirmDialog: (v: boolean) => void
}

export const createWalletSlice: StateCreator<StoreState, [], [], WalletSlice> = (set, get) => ({
  wallet: { ...defaultWallet },
  showConfirmDialog: false,

  setShowConfirmDialog: (showConfirmDialog) => set({ showConfirmDialog }),

  connectWallet: async () => {
    const state = get()
    if (state.wallet.isConnecting) return
    set({ wallet: { ...state.wallet, isConnecting: true, sendError: null } })

    try {
      const ckbSigner = await getCkbSigner(state.network)
      await ckbSigner.connect()
      const identity = await ckbSigner.getIdentity()
      const addressObjs = await ckbSigner.getAddressObjs()
      const addressStr = addressObjs[0]?.toString() ?? identity
      const addressScript = addressObjs[0]?.script

      set({
        wallet: {
          connected: true,
          address: addressStr,
          balance: { capacity: '0', occupied: '0', free: '0' },
          isConnecting: false,
          isSending: false,
          lastTxHash: null,
          explorerUrl: null,
          sendError: null,
          lockScript: addressScript
            ? { codeHash: addressScript.codeHash, hashType: addressScript.hashType as ScriptState['hashType'], args: addressScript.args }
            : undefined,
        },
      })
    } catch (e) {
      set({
        wallet: {
          ...get().wallet,
          isConnecting: false,
          sendError: e instanceof Error ? e.message : 'Failed to connect wallet',
        },
      })
    }
  },

  disconnectWallet: () => {
    signersByNetwork.clear()
    set({ wallet: { ...defaultWallet } })
  },

  sendTransaction: async () => {
    const state = get()
    if (state.wallet.isSending || !state.wallet.connected) return
    set({ wallet: { ...state.wallet, isSending: true, sendError: null, lastTxHash: null, explorerUrl: null } })

    try {
      const ckbSigner = await getCkbSigner(state.network)
      if (!(await ckbSigner.isConnected())) await ckbSigner.connect()

      const codeHashes = new Set<string>()
      const outputs: ccc.CellOutput[] = []
      const outputsData: string[] = []
      for (const ci of state.txOutputs) {
        const cell = state.cells[ci]
        if (!cell) continue

        if (cell.lock.codeHash) codeHashes.add(cell.lock.codeHash.toLowerCase())
        if (cell.type?.codeHash) codeHashes.add(cell.type.codeHash.toLowerCase())

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
            capacity: ccc.fixedPointFrom(Number(cell.capacity) / 1e8),
            lock,
            ...(type ? { type } : {}),
          })
        )
        outputsData.push(ccc.hexFrom(cell.data || '0x'))
      }

      const cellDeps: ccc.CellDep[] = []
      for (const ch of codeHashes) {
        const dep = getScriptCellDep(ch)
        if (dep) {
          cellDeps.push(
            ccc.CellDep.from({
              outPoint: ccc.OutPoint.from({
                txHash: ccc.hexFrom(dep.txHash),
                index: ccc.numFrom(dep.index),
              }),
              depType: dep.depType as ccc.DepType,
            })
          )
        }
      }

      const tx = ccc.Transaction.from({ outputs, outputsData, cellDeps })

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
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Transaction failed'
      let friendly = raw

      if (raw.includes('Insufficient CKB')) {
        friendly = 'Insufficient CKB — claim testnet tokens from the faucet or reduce your output capacities.'
      } else if (raw.includes('ScriptNotFound')) {
        friendly = 'Script not found — a needed cell dep is missing or the script is undeployed on this network.'
      } else if (raw.includes('error code -1 on page')) {
        friendly = 'Invalid script args — the script expected a specific arg length (e.g. xUDT needs 32 bytes for the token ID).'
      } else if (raw.includes('error code -52') || raw.includes('ERROR_AMOUNT')) {
        friendly = 'Token amount mismatch — you need an input cell with the same token type to send tokens.'
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
