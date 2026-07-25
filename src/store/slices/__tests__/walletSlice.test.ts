import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ccc } from '@ckb-ccc/ccc'
import { SECP256K1_BLAKE160_CODE_HASH } from '@/lib/cellValidation'
import { useSandbox } from '../../sandbox'

const { getBalanceSingle } = vi.hoisted(() => ({
  getBalanceSingle: vi.fn(),
}))

vi.mock('@/lib/ccc', () => ({
  getClient: () => ({ getBalanceSingle }),
}))

function createSigner(addresses: unknown[]): ccc.Signer {
  return {
    isConnected: vi.fn().mockResolvedValue(true),
    connect: vi.fn().mockResolvedValue(undefined),
    getAddressObjs: vi.fn().mockResolvedValue(addresses),
  } as unknown as ccc.Signer
}

describe('wallet connector state', () => {
  beforeEach(() => {
    getBalanceSingle.mockReset().mockResolvedValue(BigInt(12_300_000_000))
    useSandbox.getState().disconnectWallet()
  })

  it('stores the selected CCC wallet, signer, address, and balance', async () => {
    const lockScript = {
      codeHash: `0x${'1'.repeat(64)}`,
      hashType: 'type' as const,
      args: `0x${'2'.repeat(40)}`,
    }
    const signer = createSigner([
      {
        script: lockScript,
        toString: () => 'ckt1qselectedwallet',
      },
    ])

    await useSandbox.getState().connectWallet(signer, 'MetaMask', 'CKB')

    const wallet = useSandbox.getState().wallet
    expect(wallet.connected).toBe(true)
    expect(wallet.walletName).toBe('MetaMask')
    expect(wallet.signerName).toBe('CKB')
    expect(wallet.address).toBe('ckt1qselectedwallet')
    expect(wallet.lockScript).toEqual(lockScript)
    expect(wallet.balance.free).toBe('12300000000')
  })

  it('fills empty Secp256k1 template locks when a wallet connects', async () => {
    const lockScript = {
      codeHash: `0x${'3'.repeat(64)}`,
      hashType: 'type' as const,
      args: `0x${'4'.repeat(40)}`,
    }
    useSandbox.setState({
      cells: [{
        capacity: '6100000000',
        lock: { codeHash: SECP256K1_BLAKE160_CODE_HASH, hashType: 'type', args: '0x' },
        type: null,
        data: '0x',
        dataMode: 'hex',
      }],
    })
    const signer = createSigner([{
      script: lockScript,
      toString: () => 'ckt1qselectedwallet',
    }])

    await useSandbox.getState().connectWallet(signer, 'JoyID', 'CKB')

    expect(useSandbox.getState().cells[0].lock).toEqual(lockScript)
  })

  it('rejects a connector signer without a CKB address', async () => {
    const signer = createSigner([])

    await useSandbox.getState().connectWallet(signer, 'Unsupported Wallet', 'Unknown')

    const wallet = useSandbox.getState().wallet
    expect(wallet.connected).toBe(false)
    expect(wallet.isConnecting).toBe(false)
    expect(wallet.sendError).toBe('The selected wallet did not provide a CKB address for this network.')
  })

  it('clears connector metadata on disconnect', async () => {
    const signer = createSigner([
      {
        script: { codeHash: `0x${'1'.repeat(64)}`, hashType: 'type', args: '0x' },
        toString: () => 'ckt1qselectedwallet',
      },
    ])
    await useSandbox.getState().connectWallet(signer, 'JoyID Passkey', 'CKB')

    useSandbox.getState().disconnectWallet()

    expect(useSandbox.getState().wallet).toMatchObject({
      connected: false,
      address: '',
      walletName: '',
      signerName: '',
    })
  })
})
