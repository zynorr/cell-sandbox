'use client'

import { useState } from 'react'
import { useSandbox } from '@/store/sandbox'
import { TxConfirmDialog } from './TxConfirmDialog'

const SHANNONS_PER_CKB = BigInt(100000000)

export function WalletConnect() {
  const wallet = useSandbox((s) => s.wallet)
  const connectWallet = useSandbox((s) => s.connectWallet)
  const disconnectWallet = useSandbox((s) => s.disconnectWallet)
  const refreshWalletBalance = useSandbox((s) => s.refreshWalletBalance)
  const txOutputs = useSandbox((s) => s.txOutputs)
  const network = useSandbox((s) => s.network)
  const [faucetStatus, setFaucetStatus] = useState<'idle' | 'claiming' | 'done' | 'checking' | 'error' | null>(null)
  const [faucetMsg, setFaucetMsg] = useState('')
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null)

  const isMainnet = network === 'mainnet'

  function formatCkb(shannons: string): string {
    try {
      const value = BigInt(shannons || '0')
      const whole = value / SHANNONS_PER_CKB
      const fraction = value % SHANNONS_PER_CKB
      const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      const fractionText = fraction.toString().padStart(8, '0').replace(/0+$/, '').slice(0, 4)
      return `${wholeText}${fractionText ? `.${fractionText}` : ''} CKB`
    } catch {
      return '0 CKB'
    }
  }

  function getErrorMessage(data: unknown, fallback: string): string {
    if (data && typeof data === 'object' && 'error' in data) {
      const error = (data as { error?: unknown }).error
      if (typeof error === 'string' && error.length > 0) return error
    }
    return fallback
  }

  function scheduleBalanceRefreshes() {
    void refreshWalletBalance()
    window.setTimeout(() => void refreshWalletBalance(), 5000)
    window.setTimeout(() => void refreshWalletBalance(), 15000)
  }

  async function checkClaimStatus() {
    setFaucetStatus('checking')
    try {
      const res = await fetch(`/api/faucet?address=${encodeURIComponent(wallet.address)}`)
      const data = await res.json()
      if (!res.ok) {
        setFaucetStatus('error')
        setFaucetMsg(getErrorMessage(data, 'Status check failed'))
        return
      }

      const claims: Array<Record<string, unknown>> = data.claims ?? []
      const done = claims.find((c) => c.status === 'processed')
      if (done) {
        setFaucetStatus('done')
        setFaucetMsg('10,000 CKB received')
        setClaimTxHash(typeof done.txHash === 'string' ? done.txHash : null)
        scheduleBalanceRefreshes()
      } else if (claims.length > 0) {
        const latest = claims[claims.length - 1]
        setFaucetStatus('done')
        setFaucetMsg(`Claim ${latest.status ?? 'submitted'} - check again shortly`)
        setClaimTxHash(typeof latest.txHash === 'string' ? latest.txHash : null)
        scheduleBalanceRefreshes()
      } else {
        setFaucetStatus('done')
        setFaucetMsg('No claims found for this address')
        void refreshWalletBalance()
      }
    } catch {
      setFaucetStatus('error')
      setFaucetMsg('Status check failed')
    }
  }

  async function claimFaucet() {
    setFaucetStatus('claiming')
    setFaucetMsg('')
    setClaimTxHash(null)
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: wallet.address }),
      })
      const data = await res.json()
      if (res.ok && data.ok && data.claim) {
        const claimStatus = data.claim.status ? ` (${data.claim.status})` : ''
        setFaucetStatus('done')
        setFaucetMsg(`10,000 CKB claim submitted${claimStatus} - checking status...`)
        setClaimTxHash(typeof data.claim.txHash === 'string' ? data.claim.txHash : null)
        scheduleBalanceRefreshes()
        setTimeout(checkClaimStatus, 3000)
      } else {
        setFaucetStatus('error')
        setFaucetMsg(getErrorMessage(data, 'Faucet request failed'))
      }
    } catch {
      setFaucetStatus('error')
      setFaucetMsg('Could not reach faucet. Try https://faucet.nervos.org in your browser.')
    }
  }

  return (
    <>
      <div className="mt-3 space-y-2 border-t border-stone-800/80 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Wallet</p>
            <p className="mt-0.5 text-xs text-stone-400">
              {wallet.connected ? 'Connected and ready for signing' : 'Connect before faucet or send'}
            </p>
          </div>
          <span className="rounded-full border border-stone-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-stone-500">
            {network}
          </span>
        </div>
        {wallet.connected ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span className="truncate font-mono text-xs text-stone-300" title={wallet.address}>
                  {wallet.address.slice(0, 12)}...{wallet.address.slice(-6)}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="text-[10px] text-stone-500 transition-colors hover:text-stone-400"
              >
                Disconnect
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-stone-800 bg-stone-950/50 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-wider text-stone-500">Balance</p>
                  <button
                    type="button"
                    onClick={() => void refreshWalletBalance()}
                    disabled={wallet.isRefreshingBalance}
                    aria-label="Refresh wallet balance"
                    title="Refresh wallet balance"
                    className="rounded p-0.5 text-stone-500 transition-colors hover:text-stone-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg
                      className={`h-3 w-3 ${wallet.isRefreshingBalance ? 'animate-spin' : ''}`}
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M13 5.5A5.2 5.2 0 0 0 3.7 3.8L2.5 5" />
                      <path d="M2.5 2.2V5h2.8" />
                      <path d="M3 10.5a5.2 5.2 0 0 0 9.3 1.7l1.2-1.2" />
                      <path d="M13.5 13.8V11h-2.8" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 font-mono text-stone-300">
                  {wallet.isRefreshingBalance ? 'Refreshing...' : formatCkb(wallet.balance.free)}
                </p>
                {wallet.balanceError && <p className="mt-1 text-[10px] leading-4 text-red-400">{wallet.balanceError}</p>}
              </div>
              <div className="rounded-lg border border-stone-800 bg-stone-950/50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-wider text-stone-500">Signing</p>
                <p className="mt-1 text-emerald-300">Ready</p>
              </div>
            </div>

            {isMainnet ? (
              <div className="rounded-lg border border-amber-800/20 bg-amber-900/10 px-2.5 py-1.5 text-xs text-amber-400/70">
                Faucet is only available on testnet.{' '}
                <button
                  onClick={() => {
                    const s = useSandbox.getState()
                    s.setNetwork('testnet')
                  }}
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  Switch to testnet
                </button>
              </div>
            ) : (
              <button
                onClick={claimFaucet}
                disabled={faucetStatus === 'claiming'}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-amber-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {faucetStatus === 'claiming' ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse-soft" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 1v10M1 6h10M3 3l6 6M9 3l-6 6" />
                    </svg>
                    Get 10,000 CKB from Faucet
                  </>
                )}
              </button>
            )}

            {faucetStatus === 'done' && (
              <div className="space-y-0.5 rounded-lg border border-emerald-800/20 bg-emerald-900/15 px-2.5 py-1.5 text-xs text-emerald-400 animate-fade-in">
                <p>{faucetMsg}</p>
                {!claimTxHash && (
                  <button onClick={checkClaimStatus} className="text-stone-400 underline hover:text-stone-300">
                    Check status
                  </button>
                )}
                {claimTxHash && (
                  <a
                    href={`https://pudge.explorer.nervos.org/transaction/${claimTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-mono text-stone-500 hover:text-stone-400"
                  >
                    {claimTxHash.slice(0, 16)}...{claimTxHash.slice(-8)}
                  </a>
                )}
              </div>
            )}
            {faucetStatus === 'checking' && (
              <div className="text-xs text-stone-400 animate-fade-in">
                Checking claim status...
              </div>
            )}
            {faucetStatus === 'error' && (
              <div className="rounded-lg border border-red-800/20 bg-red-900/15 px-2.5 py-1.5 text-xs text-red-400 animate-fade-in">
                {faucetMsg}
              </div>
            )}

            <button
              onClick={() => useSandbox.getState().setShowConfirmDialog(true)}
              disabled={wallet.isSending || txOutputs.length === 0}
              className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                txOutputs.length === 0
                  ? 'cursor-not-allowed bg-stone-700/50 text-stone-500'
                  : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
              }`}
            >
              {wallet.isSending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse-soft" />
                  Sending...
                </span>
              ) : (
                txOutputs.length === 0
                  ? 'Select an Output first'
                  : `Send Tx (${txOutputs.length} output${txOutputs.length !== 1 ? 's' : ''})`
              )}
            </button>

            {wallet.lastTxHash && (
              <div className="text-xs animate-fade-in">
                <div className="mb-0.5 flex items-center gap-1.5 text-emerald-400">
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l2.5 2.5L10 3" />
                  </svg>
                  <span>Transaction sent</span>
                </div>
                <a
                  href={wallet.explorerUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-mono text-stone-500 hover:text-stone-400"
                >
                  {wallet.lastTxHash.slice(0, 16)}...{wallet.lastTxHash.slice(-8)}
                </a>
              </div>
            )}

            {wallet.sendError && (
              <div className="space-y-1 rounded-lg border border-red-800/20 bg-red-900/15 px-2.5 py-1.5 text-xs text-red-400 animate-fade-in">
                <p>{wallet.sendError}</p>
                {wallet.sendError.toLowerCase().includes('insufficient') && (
                  <p className="text-stone-400">
                    Get free testnet CKB from{' '}
                    <a
                      href="https://faucet.nervos.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      the faucet
                    </a>
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="rounded-lg border border-stone-800 bg-stone-950/50 p-3">
              <p className="text-xs font-medium text-stone-300">JoyID passkey wallet</p>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Use JoyID to sign testnet transactions and request faucet capacity for experiments.
              </p>
            </div>
            <button
              onClick={connectWallet}
              disabled={wallet.isConnecting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-700 px-3 py-2 text-xs font-medium text-stone-200 transition-all hover:bg-stone-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {wallet.isConnecting ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-stone-400 animate-pulse-soft" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="4" width="14" height="9" rx="1.5" />
                    <circle cx="8" cy="8.5" r="1.5" />
                  </svg>
                  Connect JoyID
                </>
              )}
            </button>
          </>
        )}
      </div>
      <TxConfirmDialog />
    </>
  )
}
