import React from 'react'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { useSuiClient } from '@mysten/dapp-kit'

function formatSuiBalance(totalBalance: string): string {
  const n = Number(totalBalance) / 1_000_000_000
  if (!Number.isFinite(n)) return '0'
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 3 })
  return n.toFixed(6)
}

export default function WalletBar() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const [balance, setBalance] = React.useState<string>('0')

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      if (!account) {
        setBalance('0')
        return
      }
      try {
        const bal = await client.getBalance({ owner: account.address })
        if (!cancelled) {
          setBalance(bal.totalBalance)
        }
      } catch {
        if (!cancelled) {
          setBalance('0')
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [account, client])

  return (
    <div className="flex items-center gap-3">
      {account ? (
        <div className="group relative">
          {/* Balance Display with Premium Styling */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 rounded-xl backdrop-blur-sm shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105">
            {/* SUI Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-sm opacity-50 animate-pulse"></div>
              <svg
                className="w-6 h-6 md:w-7 md:h-7 text-indigo-300 relative z-10 transition-transform duration-300 group-hover:rotate-12"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            
            {/* Balance Text */}
            <div className="flex flex-col">
              <div className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Balance
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg md:text-xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {formatSuiBalance(balance)}
                </span>
                <span className="text-xs md:text-sm font-bold text-indigo-300">SUI</span>
              </div>
            </div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-300"></div>
          </div>
        </div>
      ) : null}
      <div className="relative">
        <ConnectButton
          connectText={
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Connect Wallet</span>
            </span>
          }
        />
      </div>
    </div>
  )
}
