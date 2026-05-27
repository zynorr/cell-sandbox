'use client'

import { useSandbox } from '@/store/sandbox'
import { useState } from 'react'
import { TxConfirmDialog } from './TxConfirmDialog'

export function WalletConnect() {
  const wallet = useSandbox((s) => s.wallet)
  const connectWallet = useSandbox((s) => s.connectWallet)
  const disconnectWallet = useSandbox((s) => s.disconnectWallet)
  const txOutputs = useSandbox((s) => s.txOutputs)
  const network = useSandbox((s) => s.network)
  const [faucetStatus, setFaucetStatus] = useState<'idle' | 'claiming' | 'done' | 'checking' | 'error' | null>(null)
  const [faucetMsg, setFaucetMsg] = useState('')
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null)

  const isMainnet = network === 'mainnet'

  async function checkClaimStatus() {
    setFaucetStatus('checking')
    try {
      const res = await fetch(`/api/faucet?address=${encodeURIComponent(wallet.address)}`)
      const data = await res.json()
      const claims: Array<Record<string, unknown>> = data.claims ?? []
      const done = claims.find((c) => c.status === 'processed')
      if (done) {
        setFaucetStatus('done')
        setFaucetMsg(`10,000 CKB received`)
        setClaimTxHash(done.txHash as string)
      } else if (claims.length > 0) {
        const latest = claims[claims.length - 1]
        setFaucetStatus('done')
        setFaucetMsg(`Claim ${latest.status} — check again shortly`)
      } else {
        setFaucetMsg('No claims found for this address')
      }
    } catch {
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
      if (data.data?.attributes) {
        setFaucetStatus('done')
        setFaucetMsg('10,000 CKB claimed — checking status...')
        setTimeout(checkClaimStatus, 3000)
      } else {
        setFaucetStatus('error')
        setFaucetMsg(data.error ?? 'Faucet request failed')
      }
    } catch {
      setFaucetStatus('error')
      setFaucetMsg('Could not reach faucet. Try https://faucet.nervos.org in your browser.')
    }
  }

  return (
    <>
    <div className="border-t border-stone-800/80 pt-3 mt-3 space-y-2">
      {wallet.connected ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-mono text-stone-300 truncate" title={wallet.address}>
                {wallet.address.slice(0, 12)}...{wallet.address.slice(-6)}
              </span>
            </div>
            <button
              onClick={disconnectWallet}
              className="text-[10px] text-stone-500 hover:text-stone-400 transition-colors"
            >
              Disconnect
            </button>
          </div>

          {isMainnet ? (
            <div className="text-xs text-amber-400/70 bg-amber-900/10 border border-amber-800/20 rounded-lg px-2.5 py-1.5">
              Faucet is only available on testnet.{' '}
              <button
                onClick={() => {
                  const s = useSandbox.getState()
                  s.setNetwork('testnet')
                }}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Switch to testnet
              </button>
            </div>
          ) : (
            <button
              onClick={claimFaucet}
              disabled={faucetStatus === 'claiming'}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-all active:scale-95"
            >
              {faucetStatus === 'claiming' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse-soft" />
                  Claiming...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 1v10M1 6h10M3 3l6 6M9 3l-6 6" />
                  </svg>
                  Get 10,000 CKB from Faucet
                </>
              )}
            </button>
          )}

          {faucetStatus === 'done' && (
            <div className="text-xs text-emerald-400 bg-emerald-900/15 border border-emerald-800/20 rounded-lg px-2.5 py-1.5 animate-fade-in space-y-0.5">
              <p>{faucetMsg}</p>
              {!claimTxHash && (
                <button onClick={checkClaimStatus} className="text-stone-400 hover:text-stone-300 underline">
                  Check status
                </button>
              )}
              {claimTxHash && (
                <a
                  href={`https://pudge.explorer.nervos.org/transaction/${claimTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-stone-500 hover:text-stone-400 truncate font-mono"
                >
                  {claimTxHash.slice(0, 16)}...{claimTxHash.slice(-8)} ↗
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
            <div className="text-xs text-red-400 bg-red-900/15 border border-red-800/20 rounded-lg px-2.5 py-1.5 animate-fade-in">
              {faucetMsg}
            </div>
          )}

          <button
            onClick={() => useSandbox.getState().setShowConfirmDialog(true)}
            disabled={wallet.isSending || txOutputs.length === 0}
            className={`w-full text-xs font-medium px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
              txOutputs.length === 0
                ? 'bg-stone-700/50 text-stone-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            {wallet.isSending ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse-soft" />
                Sending...
              </span>
            ) : (
              `Send Tx (${txOutputs.length} output${txOutputs.length !== 1 ? 's' : ''})`
            )}
          </button>

          {wallet.lastTxHash && (
            <div className="text-xs animate-fade-in">
              <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l2.5 2.5L10 3" />
                </svg>
                <span>Transaction sent</span>
              </div>
              <a
                href={wallet.explorerUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-400 truncate block font-mono"
              >
                {wallet.lastTxHash.slice(0, 16)}...{wallet.lastTxHash.slice(-8)} ↗
              </a>
            </div>
          )}

          {wallet.sendError && (
            <div className="text-xs text-red-400 bg-red-900/15 border border-red-800/20 rounded-lg px-2.5 py-1.5 animate-fade-in space-y-1">
              <p>{wallet.sendError}</p>
              {wallet.sendError.toLowerCase().includes('insufficient') && (
                <p className="text-stone-400">
                  Get free testnet CKB from{' '}
                  <a
                    href="https://faucet.nervos.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    the faucet
                  </a>
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <button
          onClick={connectWallet}
          disabled={wallet.isConnecting}
          className="w-full flex items-center justify-center gap-2 text-xs font-medium bg-stone-700 hover:bg-stone-600 disabled:opacity-40 disabled:cursor-not-allowed text-stone-200 px-3 py-2 rounded-lg transition-all active:scale-95"
        >
          {wallet.isConnecting ? (
            <>
              <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse-soft" />
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="4" width="14" height="9" rx="1.5" />
                <circle cx="8" cy="8.5" r="1.5" />
              </svg>
              Connect Wallet (JoyID)
            </>
          )}
        </button>
      )}
    </div>
      <TxConfirmDialog />
    </>
  )
}
