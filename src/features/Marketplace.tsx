import React from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction, ConnectButton } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { APP_CONFIG } from '../config'
import { useTxInvalidation } from '../state/TxContext'
import { useToast } from '../components/Toasts'
import Modal from '../components/Modal'
import { useNavigate } from 'react-router-dom'
import StarBorder from '../components/StarBorder'

function extractUrl(fields: any): string {
  if (!fields) return ''
  if (typeof fields.url === 'string') return fields.url
  if (fields.url && typeof fields.url.url === 'string') return fields.url.url
  if (fields.image_url) return fields.image_url
  return ''
}

function formatSui(amountRaw: string | number): string {
  const n = Number(amountRaw) / 1_000_000_000
  if (!Number.isFinite(n)) return String(amountRaw)
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 3 })
  return n.toFixed(6)
}

type TxState = 'idle' | 'listing' | 'buying' | 'canceling'
type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high'

interface ListingCard {
  listingId: string
  price: string
  seller: string
  nftId: string
  name: string
  imageUrl: string
}

type MarketplaceProps = {
  onCreateListingClick?: () => void;
};

export default function Marketplace({}: MarketplaceProps = {}) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const navigate = useNavigate()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const [listings, setListings] = React.useState<ListingCard[]>([])
  const [price, setPrice] = React.useState<string>('')
  const [objectId, setObjectId] = React.useState<string>('')
  const [showForm, setShowForm] = React.useState(false)
  const [marketplaceId, setMarketplaceId] = React.useState<string | null>(import.meta.env.VITE_MARKETPLACE_OBJECT_ID || null)
  const [txState, setTxState] = React.useState<TxState>('idle')
  const [processingId, setProcessingId] = React.useState<string | null>(null)
  const [priceError, setPriceError] = React.useState<string>('')
  const { version, invalidate } = useTxInvalidation()
  const { showToast } = useToast()
  const objectIdRef = React.useRef<HTMLInputElement | null>(null)
  const [owned, setOwned] = React.useState<{ id: string; name: string; imageUrl: string; description: string }[]>([])
  const [ownedLoading, setOwnedLoading] = React.useState(false)

  // Expose function for external button (like navbar behavior)
  React.useEffect(() => {
    const handleCreateListing = () => {
      setShowForm(true);
      setTimeout(() => objectIdRef.current?.focus(), 50);
    };
    (window as any).__marketplaceCreateListing = handleCreateListing;
    return () => {
      delete (window as any).__marketplaceCreateListing;
    };
  }, []);

  // Search and filter states
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [minPrice, setMinPrice] = React.useState<string>('')
  const [maxPrice, setMaxPrice] = React.useState<string>('')
  const [sortBy, setSortBy] = React.useState<SortOption>('newest')
  const [showFilters, setShowFilters] = React.useState(false)

  // Price validation
  function validatePrice(value: string): string | undefined {
    if (!value.trim()) return 'Price is required'
    const num = Number(value.trim())
    if (isNaN(num)) return 'Price must be a valid number'
    if (num <= 0) return 'Price must be greater than 0'
    if (num > 1000000) return 'Price must be less than 1,000,000 SUI'
    // Check for too many decimal places (max 9 for SUI precision)
    const decimalParts = value.trim().split('.')
    if (decimalParts.length === 2 && decimalParts[1].length > 9) {
      return 'Price can have at most 9 decimal places'
    }
    return undefined
  }

  async function loadOwned() {
    if (!account || !APP_CONFIG.TYPES.nftType) { setOwned([]); return }
    setOwnedLoading(true)
    try {
      const res = await client.getOwnedObjects({
        owner: account.address,
        filter: { StructType: APP_CONFIG.TYPES.nftType },
        options: { showContent: true, showDisplay: true },
      })
      const data = (res.data || []).map((o: any) => {
        const id = o.data?.objectId as string
        const fields = o.data?.content?.fields || {}
        const display = o.data?.display?.data || {}
        const name = (fields.name as string) || (display.name as string) || 'NFT'
        const imageUrl = extractUrl(fields) || display.image_url || display.url || ''
        const description = (fields.description as string) || (display.description as string) || 'No description available'
        return { id, name, imageUrl, description }
      })
      setOwned(data)
      if (data.length > 0) setObjectId(data[0].id)
    } finally {
      setOwnedLoading(false)
    }
  }

  async function loadMarketplaceId() {
    // 0) If we already have and it validates, reuse
    if (marketplaceId) {
      try {
        const obj = await client.getObject({ id: marketplaceId, options: { showType: true } })
        const t = (obj as any)?.data?.type as string | undefined
        if (t && t.includes('::Marketplace')) return marketplaceId
      } catch { /* fall through */ }
    }
    // 1) Validate env, if provided
    const envId = import.meta.env.VITE_MARKETPLACE_OBJECT_ID as string | undefined
    if (envId) {
      try {
        const obj = await client.getObject({ id: envId, options: { showType: true } })
        const t = (obj as any)?.data?.type as string | undefined
        if (t && t.includes('::Marketplace')) {
          setMarketplaceId(envId)
          return envId
        }
      } catch { /* ignore invalid env */ }
    }
    // 2) Discover by type
    try {
      const res = await (client as any).queryObjects({
        filter: { StructType: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::Marketplace` },
        options: { showType: true },
        limit: 5,
      })
      const obj = (res.data || [])[0]
      if (obj?.data?.objectId) {
        setMarketplaceId(obj.data.objectId)
        return obj.data.objectId as string
      }
    } catch {
      // ignore
    }
    return null
  }

  // Discover marketplace object on mount
  React.useEffect(() => { loadMarketplaceId() }, [])
  React.useEffect(() => { loadOwned() }, [account])

  async function buildListingCards(objs: any[]) {
    const unique = new Map<string, any>()
    for (const it of objs) {
      const listingId = (it.data as any)?.objectId
      if (!listingId || unique.has(listingId)) continue
      unique.set(listingId, it)
    }
    const base = Array.from(unique.values())
    const withNft = await Promise.all(base.map(async (it): Promise<ListingCard> => {
      const fields = (it.data as any)?.content?.fields || {}
      const rawPrice = String(fields.price ?? '0')
      const seller = (fields.seller as string) || ''
      // New contract: NFT is embedded under fields.nft
      if (fields.nft && fields.nft.fields) {
        const nfields = fields.nft.fields
        return {
          listingId: (it.data as any)?.objectId,
          price: rawPrice,
          seller,
          nftId: (fields.nft as any)?.fields?.id?.id || '',
          name: (nfields.name as string) || 'NFT',
          imageUrl: extractUrl(nfields),
        }
      }
      // Fallback: older version with nft_id
      const nftId = fields.nft_id as string
      if (nftId) {
        try {
          const nft = await client.getObject({ id: nftId, options: { showContent: true } })
          const nfields = (nft as any)?.data?.content?.fields || {}
          return {
            listingId: (it.data as any)?.objectId,
            price: rawPrice,
            seller,
            nftId,
            name: (nfields.name as string) || 'NFT',
            imageUrl: extractUrl(nfields),
          }
        } catch { }
      }
      return {
        listingId: (it.data as any)?.objectId,
        price: rawPrice,
        seller,
        nftId: nftId || '',
        name: 'NFT',
        imageUrl: '',
      }
    }))
    setListings(withNft)
  }

  // Filter and sort listings
  const filteredAndSortedListings = React.useMemo(() => {
    let filtered = [...listings]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((l) =>
        l.name.toLowerCase().includes(query) ||
        l.nftId.toLowerCase().includes(query) ||
        l.listingId.toLowerCase().includes(query)
      )
    }

    // Apply price filters
    if (minPrice.trim()) {
      const min = Number(minPrice.trim()) * 1_000_000_000 // Convert to MIST
      if (!isNaN(min) && min > 0) {
        filtered = filtered.filter((l) => {
          const priceNum = Number(l.price)
          return !isNaN(priceNum) && priceNum >= min
        })
      }
    }

    if (maxPrice.trim()) {
      const max = Number(maxPrice.trim()) * 1_000_000_000 // Convert to MIST
      if (!isNaN(max) && max > 0) {
        filtered = filtered.filter((l) => {
          const priceNum = Number(l.price)
          return !isNaN(priceNum) && priceNum <= max
        })
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': {
          const priceA = Number(a.price) || 0
          const priceB = Number(b.price) || 0
          return priceA - priceB
        }
        case 'price-high': {
          const priceA = Number(a.price) || 0
          const priceB = Number(b.price) || 0
          return priceB - priceA
        }
        case 'newest':
          // Newest listings first (assuming listingId contains timestamp or we use array order)
          // Since we can't easily get timestamp, we'll sort by listingId descending (newer IDs tend to be later)
          return b.listingId.localeCompare(a.listingId)
        case 'oldest':
          return a.listingId.localeCompare(b.listingId)
        default:
          return 0
      }
    })

    return filtered
  }, [listings, searchQuery, minPrice, maxPrice, sortBy])

  async function refreshListings() {
    if (!APP_CONFIG.TYPES.listingType) { setListings([]); return }
    // 1) Try querying by StructType (best for shared objects)
    try {
      const res = await (client as any).queryObjects({
        filter: { StructType: APP_CONFIG.TYPES.listingType },
        options: { showContent: true, showOwner: true, showType: true },
        limit: 100,
      })
      const data = (res.data || []) as any[]
      if (data.length > 0) {
        await buildListingCards(data)
        return
      }
    } catch {
      // ignore, fallback below
    }

    // 2) Fallback: resolve recent listings from emitted events, then fetch objects
    try {
      const evtType = `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::ListNFTEvent`
      const evts = await client.queryEvents({
        query: { MoveEventType: evtType },
        limit: 100,
        order: 'descending',
      })
      const ids = (evts.data || []).map((e: any) => e.parsedJson?.listing_id).filter(Boolean)
      if (ids.length === 0) { setListings([]); return }
      const objs = await Promise.all(ids.map((id: string) => client.getObject({ id, options: { showContent: true, showOwner: true, showType: true } })))
      // keep only live Listing objects
      const live = objs.filter((o: any) => (o?.data?.type || '').includes('::Listing') && o?.data?.content)
      await buildListingCards(live)
      return
    } catch {
      // ignore; final fallback below
    }

    // 3) Final fallback (rare): attempt owned-by-admin or self (may miss shared objects)
    try {
      const res = await client.getOwnedObjects({
        owner: (APP_CONFIG.ADMIN_ADDRESS || account?.address || ''),
        filter: { StructType: APP_CONFIG.TYPES.listingType },
        options: { showContent: true, showType: true, showOwner: true },
      })
      await buildListingCards(res.data || [])
    } catch {
      setListings([])
    }
  }

  React.useEffect(() => { refreshListings() }, [account, version])

  // Auto-refresh every 15 seconds to pick up fresh listings
  React.useEffect(() => {
    const id = setInterval(() => {
      if (txState === 'idle') {
        refreshListings()
      }
    }, 15000)
    return () => clearInterval(id)
  }, [txState])

  async function listForSale(e: React.FormEvent) {
    e.preventDefault()
    if (!account || txState !== 'idle') {
      showToast('Connect wallet or transaction in progress', 'error');
      return
    }

    // Validate price
    const priceValidation = validatePrice(price)
    if (priceValidation) {
      setPriceError(priceValidation)
      showToast(priceValidation, 'error')
      return
    }

    if (!objectId) {
      showToast('Select an NFT', 'error')
      return
    }

    const p = Number(price.trim())
    if (!Number.isFinite(p) || p <= 0) {
      setPriceError('Price must be a positive number')
      showToast('Enter a positive price', 'error')
      return
    }

    setPriceError('')
    setTxState('listing')
    const tx = new Transaction()
    tx.moveCall({
      target: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::${APP_CONFIG.FUNCS.list}`,
      arguments: [tx.object(objectId), tx.pure.u64(BigInt(Math.floor(p * 10 ** 9)))],
    })
    try {
      const res = await signAndExecute({ transaction: tx, chain: 'sui:testnet' })
      showToast(`Listed: ${res.digest}`, 'success')
      setObjectId(''); setPrice('');
      invalidate()
      await refreshListings()
      setShowForm(false)
    } catch (e: any) {
      showToast(e?.message || 'List failed', 'error')
    } finally {
      setTxState('idle')
    }
  }

  async function buy(listingId: string, amountRaw: string) {
    if (!account || txState !== 'idle') return showToast('Connect wallet or transaction in progress', 'error')
    const mktId = await loadMarketplaceId()
    if (!mktId) {
      showToast('Marketplace object not found (set VITE_MARKETPLACE_OBJECT_ID to the shared Marketplace object, not the package ID)', 'error')
      return
    }

    setTxState('buying')
    setProcessingId(listingId)
    const tx = new Transaction()
    // Prepare payment coin equal to price
    const coin = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(amountRaw))])
    tx.moveCall({
      target: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::${APP_CONFIG.FUNCS.buy}`,
      arguments: [tx.object(listingId), coin, tx.object(mktId)],
    })
    try {
      const res = await signAndExecute({ transaction: tx, chain: 'sui:testnet' })
      showToast(`Bought: ${res.digest}`, 'success')
      invalidate()
      await refreshListings()
    } catch (e: any) {
      showToast(e?.message || 'Buy failed', 'error')
    } finally {
      setTxState('idle')
      setProcessingId(null)
    }
  }

  async function cancel(listingId: string) {
    if (!account || txState !== 'idle') return showToast('Connect wallet or transaction in progress', 'error')

    setTxState('canceling')
    setProcessingId(listingId)
    const tx = new Transaction()
    tx.moveCall({
      target: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::${APP_CONFIG.FUNCS.cancel}`,
      arguments: [tx.object(listingId)],
    })
    try {
      const res = await signAndExecute({ transaction: tx, chain: 'sui:testnet' })
      showToast(`Cancelled: ${res.digest}`, 'success')
      invalidate()
      await refreshListings()
    } catch (e: any) {
      showToast(e?.message || 'Cancel failed', 'error')
    } finally {
      setTxState('idle')
      setProcessingId(null)
    }
  }

  if (!account) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-6 text-center w-full">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-2 text-white">Marketplace</h2>
        <p className="text-gray-400 mb-4">Connect your wallet to list, buy, and cancel listings.</p>
        <div className="flex justify-center"><ConnectButton connectText="Connect Wallet" /></div>
      </div>
    )
  }

  return (
    <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl shadow-black/30 backdrop-blur pb-12 sm:pb-16 md:pb-24 w-full">
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">Marketplace</h2>
            {txState !== 'idle' && (
              <div className="flex items-center gap-2 text-indigo-400 text-sm bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/30">
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium text-xs">
                  {txState === 'listing' && 'Listing NFT...'}
                  {txState === 'buying' && 'Processing purchase...'}
                  {txState === 'canceling' && 'Canceling listing...'}
                </span>
              </div>
            )}
          </div>
          {/* Subtle auto-refresh indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Auto-refreshing</span>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, NFT ID, or listing ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Sort and Filter Controls */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-1 sm:flex-none bg-gray-900/70 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-gray-100 text-sm sm:text-base min-w-[140px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 sm:px-4 py-2.5 rounded-lg font-medium transition border text-sm sm:text-base whitespace-nowrap ${
                  showFilters || minPrice || maxPrice
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-gray-900/70 border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                </span>
              </button>

              {/* Clear filters button */}
              {(searchQuery || minPrice || maxPrice) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setMinPrice('')
                    setMaxPrice('')
                    setShowFilters(false)
                  }}
                  className="px-3 sm:px-4 py-2.5 rounded-lg font-medium transition bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 text-sm sm:text-base whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Price Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Min Price (SUI)</label>
                  <input
                    type="number"
                    step="0.000000001"
                    min="0"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Price (SUI)</label>
                  <input
                    type="number"
                    step="0.000000001"
                    min="0"
                    placeholder="No limit"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-gray-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-400">
            Showing {filteredAndSortedListings.length} of {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
            {(searchQuery || minPrice || maxPrice) && ' (filtered)'}
          </div>
        </div>
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setPrice(''); setPriceError(''); setObjectId('') }} title="Create a Listing">
        <div className="space-y-4">
          <div className="text-sm text-gray-400">Select one of your NFTs</div>
          {ownedLoading ? (
            <div className="text-gray-400">Loading your NFTs…</div>
          ) : owned.length === 0 ? (
            <div className="text-gray-400">No NFTs found in your wallet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[360px] overflow-auto pr-1">
              {owned.map((n) => {
                const isSelected = objectId === n.id
                return (
                  <button
                    key={n.id}
                    onClick={() => setObjectId(n.id)}
                    className={`group text-left rounded-xl overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-900 shadow-2xl shadow-indigo-500/30 scale-[1.02]'
                        : 'border border-gray-700 hover:border-gray-600 hover:shadow-lg hover:shadow-indigo-500/10'
                    }`}
                  >
                    <div className="relative">
                      {n.imageUrl ? (
                        <>
                          <img src={n.imageUrl} className={`w-full h-40 object-cover transition-transform duration-300 ${isSelected ? 'brightness-110' : 'group-hover:scale-105'}`} />
                          {isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent"></div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center text-gray-600 bg-gray-800">No image</div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-indigo-500 rounded-full p-1.5 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                      )}
                    </div>
                    <div className={`p-4 ${isSelected ? 'bg-gray-800/80' : 'bg-gray-800/50'} transition-colors`}>
                      <div className={`font-semibold mb-2 ${isSelected ? 'text-indigo-300' : 'text-white'}`}>{n.name}</div>
                      <div className="text-xs text-gray-400 leading-relaxed overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {n.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          <form onSubmit={listForSale} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Selected NFT</label>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-sm">
                {objectId ? (
                  <code className="text-gray-300">{objectId.slice(0, 12)}…{objectId.slice(-8)}</code>
                ) : (
                  <span className="text-gray-500">None selected</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Price (SUI) <span className="text-red-400">*</span></label>
              <input
                type="number"
                step="0.000000001"
                min="0.000000001"
                max="1000000"
                className={`w-full bg-gray-800/70 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition ${priceError
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                placeholder="0.0"
                value={price}
                onChange={e => {
                  const value = e.target.value
                  setPrice(value)
                  // Clear error on change, validate on blur
                  if (priceError) {
                    setPriceError('')
                  }
                }}
                onBlur={() => {
                  const error = validatePrice(price)
                  setPriceError(error || '')
                }}
                disabled={txState !== 'idle'}
                required
              />
              {priceError && (
                <p className="text-xs text-red-400 mt-1">{priceError}</p>
              )}
              {!priceError && price && (
                <p className="text-xs text-gray-500 mt-1">Minimum: 0.000000001 SUI</p>
              )}
            </div>
            <button
              disabled={txState !== 'idle' || !objectId || !price.trim() || !!priceError}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition"
            >
              {txState === 'listing' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Listing...</span>
                </>
              ) : (
                'List for sale'
              )}
            </button>
          </form>
        </div>
      </Modal>

      {listings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🛒</div>
          <div className="text-lg font-semibold mb-1">No listings yet</div>
          <div className="text-gray-400 mb-4">Be the first to list an item on the marketplace.</div>
          <button onClick={() => { setShowForm(true); setTimeout(() => objectIdRef.current?.focus(), 50) }} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded font-semibold">Create a listing</button>
        </div>
      ) : filteredAndSortedListings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <div className="text-lg font-semibold mb-1">No listings match your filters</div>
          <div className="text-gray-400 mb-4">Try adjusting your search or filter criteria.</div>
          <button
            onClick={() => {
              setSearchQuery('')
              setMinPrice('')
              setMaxPrice('')
              setShowFilters(false)
            }}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="transform md:scale-[0.8] md:origin-top" style={{ width: '100%', marginLeft: '0', marginRight: '0' }}>
          <div className="md:transform md:scale-[1.25] md:origin-top" style={{ width: '100%' }}>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6 items-stretch pb-8 sm:pb-12 md:pb-20">
          {filteredAndSortedListings.map((l) => {
            const isOwner = account?.address?.toLowerCase() === l.seller?.toLowerCase()
            return (
              <StarBorder
                as="div"
                className="w-full"
                color="cyan"
                speed="5s"
                style={{ width: '100%', height: '100%' }}
              >
                <div key={l.listingId} className="bg-gray-800/60 border border-gray-700 rounded-lg sm:rounded-xl overflow-hidden shadow-lg hover:shadow-indigo-500/20 hover:border-gray-600 transition-all flex flex-col h-full">
                  <div
                    className="cursor-pointer flex flex-col flex-grow"
                    onClick={() => {
                      if (l.nftId) {
                        navigate(`/nft/${l.nftId}`)
                      }
                    }}
                  >
                    {l.imageUrl ? (
                      <img src={l.imageUrl} className="w-full h-32 sm:h-48 md:h-64 object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-full h-32 sm:h-48 md:h-64 flex items-center justify-center text-gray-600 bg-gray-900/40 flex-shrink-0 text-xs sm:text-sm">No image</div>
                    )}
                    <div className="p-2 sm:p-3 md:p-5 flex-shrink-0">
                      <div className="font-bold text-xs sm:text-sm md:text-lg mb-1 sm:mb-2 truncate">{l.name || 'NFT'}</div>
                      <div className="text-base sm:text-xl md:text-2xl font-extrabold text-indigo-400">{formatSui(l.price)} SUI</div>
                    </div>
                  </div>
                  <div className="px-2 sm:px-3 md:px-5 pb-2 sm:pb-3 md:pb-5 flex-shrink-0 min-h-[48px] sm:min-h-[56px] flex items-end">
                    <div className="flex gap-1.5 sm:gap-2 md:gap-3 w-full">
                      {!isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            buy(l.listingId, l.price)
                          }}
                          disabled={txState !== 'idle'}
                          className="inline-flex items-center justify-center gap-1 sm:gap-2 flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm md:text-base shadow-lg shadow-green-500/20 transition h-[36px] sm:h-[40px] md:h-[44px]"
                        >
                          {txState === 'buying' && processingId === l.listingId ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Buying...</span>
                            </>
                          ) : (
                            'Buy'
                          )}
                        </button>
                      )}
                      {isOwner && (
                        <>
                          <div className="flex-1 bg-gray-700/50 border border-gray-600 rounded-md sm:rounded-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-center text-[10px] sm:text-xs md:text-sm text-gray-400 flex items-center justify-center h-[36px] sm:h-[40px] md:h-[44px]">
                            Your listing
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              cancel(l.listingId)
                            }}
                            disabled={txState !== 'idle'}
                            className="inline-flex items-center justify-center gap-1 sm:gap-2 bg-red-600/80 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm md:text-base border border-red-500/50 transition h-[36px] sm:h-[40px] md:h-[44px]"
                          >
                            {txState === 'canceling' && processingId === l.listingId ? (
                              <>
                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Cancel...</span>
                              </>
                            ) : (
                              'Cancel'
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </StarBorder>
            )
          })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
