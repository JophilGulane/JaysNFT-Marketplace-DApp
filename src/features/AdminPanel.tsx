import React from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction, ConnectButton } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { APP_CONFIG } from '../config'
import { useTxInvalidation } from '../state/TxContext'
import { useToast } from '../components/Toasts'

function formatSui(mist: string | number): string {
  const num = typeof mist === 'string' ? BigInt(mist) : BigInt(mist)
  const sui = Number(num) / 1_000_000_000
  return sui.toFixed(4).replace(/\.?0+$/, '')
}

export default function AdminPanel() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const [feePercent, setFeePercent] = React.useState<string>('—')
  const [accumulated, setAccumulated] = React.useState<string>('—')
  const [loading, setLoading] = React.useState(true)
  const [withdrawAmount, setWithdrawAmount] = React.useState<string>('')
  const [withdrawError, setWithdrawError] = React.useState<string>('')
  const [marketplaceId, setMarketplaceId] = React.useState<string | null>(null)
  
  const isAdmin = !!(APP_CONFIG.ADMIN_ADDRESS && account?.address?.toLowerCase() === APP_CONFIG.ADMIN_ADDRESS.toLowerCase())

  // Validate withdrawal amount
  function validateWithdrawAmount(value: string): string | undefined {
    if (!value.trim()) return 'Amount is required'
    const num = Number(value.trim())
    if (isNaN(num)) return 'Amount must be a valid number'
    if (num <= 0) return 'Amount must be greater than 0'
    if (num > 1000000) return 'Amount must be less than 1,000,000 SUI'
    const availableNum = accumulated === '—' ? 0 : Number(accumulated)
    if (num > availableNum) {
      return `Cannot exceed available balance (${accumulated} SUI)`
    }
    // Check for too many decimal places (max 9 for SUI precision)
    const decimalParts = value.trim().split('.')
    if (decimalParts.length === 2 && decimalParts[1].length > 9) {
      return 'Amount can have at most 9 decimal places'
    }
    return undefined
  }
  const { invalidate, version } = useTxInvalidation()
  const { showToast } = useToast()

  // Find Marketplace object
  React.useEffect(() => {
    async function findMarketplace() {
      // First, check if env var is set (highest priority)
      if (import.meta.env.VITE_MARKETPLACE_OBJECT_ID) {
        setMarketplaceId(import.meta.env.VITE_MARKETPLACE_OBJECT_ID)
        return
      }
      
      // Otherwise, try to find it by querying
      if (!APP_CONFIG.PACKAGE_ID) return
      try {
        // Try to find shared Marketplace object
        const typeStr = `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::Marketplace`
        const res = await (client as any).queryObjects({
          filter: { StructType: typeStr },
          options: { showType: true, showOwner: true },
        })
        if (res.data.length > 0) {
          const id = (res.data[0] as any)?.data?.objectId
          if (id) setMarketplaceId(id)
        }
      } catch (err) {
        console.error('Failed to find Marketplace:', err)
      }
    }
    findMarketplace()
  }, [client])

  // Load marketplace balance and fee percent
  React.useEffect(() => {
    let cancelled = false
    async function load() {
      if (!marketplaceId) {
        if (!cancelled) {
          setLoading(false)
          setAccumulated('—')
        }
        return
      }
      
      setLoading(true)
      try {
        // Fetch marketplace object
        const obj = await client.getObject({
          id: marketplaceId,
          options: { showContent: true, showType: true },
        })
        
        if (cancelled) return
        
        // Extract balance from the Marketplace struct
        // The balance is stored in Balance<SUI> which has a value field
        const fields = (obj as any)?.data?.content?.fields
        let balanceValue = '0'
        
        if (fields?.balance) {
          // Try different possible structures for Balance<SUI>
          const balance = fields.balance
          if (balance?.value) {
            balanceValue = String(balance.value)
          } else if (balance?.fields?.value) {
            balanceValue = String(balance.fields.value)
          } else if (typeof balance === 'string') {
            balanceValue = balance
          }
        }
        
        setAccumulated(formatSui(balanceValue))

        // Fee percent appears to be hardcoded as 2% in the contract
        // (based on bytecode analysis: LdU64(2) * price / 100)
        setFeePercent('2.0')
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to load marketplace data:', err)
          showToast('Failed to load marketplace data', 'error')
          setAccumulated('—')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [marketplaceId, client, version])

  async function withdrawFees() {
    // Admin validation guard
    if (!account) {
      showToast('Connect your wallet first', 'error')
      return
    }
    
    if (!isAdmin) {
      showToast('Access denied: Only admin can withdraw fees', 'error')
      return
    }
    
    if (!APP_CONFIG.ADMIN_ADDRESS) {
      showToast('Admin address not configured', 'error')
      return
    }
    
    // Verify admin address matches (case-insensitive)
    if (account.address.toLowerCase() !== APP_CONFIG.ADMIN_ADDRESS.toLowerCase()) {
      showToast('Access denied: Wallet address does not match admin address', 'error')
      return
    }
    
    if (!marketplaceId) {
      showToast('Marketplace object not found', 'error')
      return
    }

    const amount = withdrawAmount.trim()
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showToast('Please enter a valid positive amount', 'error')
      return
    }
    
    // Check if amount exceeds available balance
    const amountNum = Number(amount)
    const availableNum = accumulated === '—' ? 0 : Number(accumulated)
    if (amountNum > availableNum) {
      showToast(`Cannot withdraw more than available balance (${accumulated} SUI)`, 'error')
      return
    }

    // Convert SUI to MIST
    const amountMist = BigInt(Math.floor(Number(amount) * 1_000_000_000))

    const tx = new Transaction()
    tx.moveCall({
      target: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::${APP_CONFIG.FUNCS.withdraw}`,
      arguments: [
        tx.object(marketplaceId),
        tx.pure.u64(amountMist.toString()),
        tx.pure.address(account.address),
      ],
    })
    
    try {
      await signAndExecute({ transaction: tx, chain: 'sui:testnet' })
      showToast(`Successfully withdrew ${amount} SUI`, 'success')
      setWithdrawAmount('')
      invalidate()
    } catch (e: any) {
      showToast(e?.message || 'Withdraw failed', 'error')
    }
  }

  if (!account) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 text-center shadow-xl shadow-black/30 backdrop-blur">
        <h2 className="text-3xl font-extrabold mb-2">Admin Panel</h2>
        <p className="text-gray-400 mb-4">Connect your wallet to access the admin panel.</p>
        <div className="flex justify-center"><ConnectButton connectText="Connect Wallet" /></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 text-center shadow-xl shadow-black/30 backdrop-blur">
        <h2 className="text-3xl font-extrabold mb-2">Admin Panel</h2>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-4">
          <div className="text-yellow-400 font-semibold">⚠️ Access Denied</div>
          <div className="text-gray-400 text-sm mt-1">Only the admin address can access this panel.</div>
          <div className="text-gray-500 text-xs mt-2">Your address: {account.address.slice(0, 6)}...{account.address.slice(-4)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/30 backdrop-blur">
      <h2 className="text-3xl font-extrabold mb-6">Admin Panel</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700 rounded-xl p-5">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Marketplace Fee</div>
          <div className="text-3xl font-extrabold text-indigo-400">{loading ? '...' : `${feePercent}%`}</div>
          <div className="text-xs text-gray-500 mt-1">Percentage charged per sale</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700 rounded-xl p-5">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Accumulated Fees</div>
          <div className="text-3xl font-extrabold text-green-400">{loading ? '...' : `${accumulated} SUI`}</div>
          <div className="text-xs text-gray-500 mt-1">Total fees collected</div>
        </div>
      </div>

      {/* Withdraw Section */}
      <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Withdraw Fees</h3>
        
        {!marketplaceId && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <div className="text-red-400 text-sm">Marketplace object not found. Set VITE_MARKETPLACE_OBJECT_ID in your .env</div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount to withdraw (SUI) <span className="text-red-400">*</span></label>
            <input
              type="number"
              step="0.000000001"
              min="0.000000001"
              max={accumulated === '—' ? undefined : accumulated}
              value={withdrawAmount}
              onChange={(e) => {
                setWithdrawAmount(e.target.value)
                if (withdrawError) {
                  setWithdrawError('')
                }
              }}
              onBlur={() => {
                const error = validateWithdrawAmount(withdrawAmount)
                setWithdrawError(error || '')
              }}
              placeholder="0.0"
              disabled={!isAdmin || isPending || loading}
              className={`w-full bg-gray-800/70 border-2 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                withdrawError 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
            {withdrawError && (
              <p className="text-xs text-red-400 mt-1">{withdrawError}</p>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Available: {loading ? '...' : `${accumulated} SUI`}
            </div>
            {!withdrawError && withdrawAmount && (
              <p className="text-xs text-gray-500 mt-1">Minimum: 0.000000001 SUI</p>
            )}
          </div>

          <button
            disabled={!marketplaceId || !isAdmin || isPending || loading || !withdrawAmount.trim() || !!withdrawError}
            onClick={withdrawFees}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition"
          >
            {isPending ? 'Withdrawing...' : '💰 Withdraw Fees'}
          </button>
        </div>
      </div>
    </div>
  )
}
