import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { APP_CONFIG } from '../config'
import Modal from '../components/Modal'
import { useToast } from '../components/Toasts'

function extractUrl(fields: any): string {
  if (!fields) return ''
  if (typeof fields.url === 'string') return fields.url
  if (fields.url && typeof fields.url.url === 'string') return fields.url.url
  if (fields.image_url) return fields.image_url
  return ''
}

function formatSui(amountRaw: string | number): string {
  const num = Number(amountRaw)
  if (!Number.isFinite(num)) return String(amountRaw)
  const n = num / 1_000_000_000
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 3 })
  return n.toFixed(6)
}

function pickOwnerString(owner: any): string | undefined {
  if (!owner) return undefined
  if (typeof owner === 'string') return owner
  if (owner.AddressOwner) return owner.AddressOwner
  if (owner.ObjectOwner) return owner.ObjectOwner
  if (owner.Shared) return 'Shared'
  if (owner.Immutable) return 'Immutable'
  return undefined
}

function truncateAddress(addr: string, start = 10, end = 8): string {
  if (!addr || typeof addr !== 'string') return '—'
  if (addr.length <= start + end) return addr
  return `${addr.slice(0, start)}•••${addr.slice(-end)}`
}

type ListingInfo = {
  id: string
  price: string
  seller?: string
}

export default function NftDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const account = useCurrentAccount()
  const client = useSuiClient()
  const navigate = useNavigate()
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const { showToast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [nftData, setNftData] = React.useState<any>(null)
  const [listing, setListing] = React.useState<ListingInfo | null>(null)
  const [marketplaceId, setMarketplaceId] = React.useState<string | null>(null)
  const [buying, setBuying] = React.useState(false)
  const [burnOpen, setBurnOpen] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState('')
  const [editDescriptionOpen, setEditDescriptionOpen] = React.useState(false)
  const [newDescription, setNewDescription] = React.useState('')
  const [updating, setUpdating] = React.useState(false)

  // Load marketplace ID once
  React.useEffect(() => {
    async function loadMarketplace() {
      try {
        const envId = import.meta.env.VITE_MARKETPLACE_OBJECT_ID as string | undefined
        if (envId) {
          try {
            const obj = await client.getObject({ id: envId, options: { showType: true } })
            const type = (obj as any)?.data?.type as string | undefined
            if (type && type.includes('::Marketplace')) {
              setMarketplaceId(envId)
              return
            }
          } catch { }
        }
        // Fallback: discover by querying
        const res = await (client as any).queryObjects({
          filter: { StructType: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::Marketplace` },
          options: { showType: true },
          limit: 5,
        })
        const obj = (res.data || [])[0]
        if (obj?.data?.objectId) {
          setMarketplaceId(obj.data.objectId)
        }
      } catch (err) {
        console.error('Failed to load marketplace:', err)
      }
    }
    loadMarketplace()
  }, [client])

  // Load NFT data
  React.useEffect(() => {
    if (!id || id.trim() === '') {
      setError('No NFT ID provided')
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadNFT() {
      setLoading(true)
      setError(null)
      setNftData(null)
      setListing(null)

      try {
        // Try direct fetch first
        try {
          const obj = await client.getObject({
            id,
            options: { showContent: true, showOwner: true, showType: true, showDisplay: true },
          })

          if (cancelled) return

          const data = (obj as any)?.data
          if (!data) {
            throw new Error('Object has no data')
          }

          const objType = data.type as string | undefined
          const nftTypeSuffix = APP_CONFIG.TYPES.nftType?.split('::').pop() || ''

          // Check if it's an NFT
          const isNFT =
            (objType && objType.includes('NFT')) ||
            (objType && objType.includes(nftTypeSuffix)) ||
            (data.content?.fields?.name || data.content?.fields?.url)

          if (isNFT && !objType?.includes('Listing')) {
            setNftData(obj)
            // Check if owner is a listing
            const owner = pickOwnerString(data.owner)
            if (owner && owner.startsWith('0x')) {
              try {
                const ownerObj = await client.getObject({
                  id: owner,
                  options: { showType: true, showContent: true },
                })
                const ownerType = (ownerObj as any)?.data?.type as string | undefined
                if (ownerType && ownerType.includes('::Listing')) {
                  const fields = (ownerObj as any)?.data?.content?.fields || {}
                  setListing({
                    id: owner,
                    price: String(fields.price ?? '0'),
                    seller: fields.seller || '',
                  })
                }
              } catch { }
            }
            return
          }
        } catch (err) {
          console.log('Direct fetch failed, trying listings...')
        }

        // If direct fetch failed, search in listings
        const listingType = APP_CONFIG.TYPES.listingType
        if (listingType) {
          try {
            const listings = await (client as any).queryObjects({
              filter: { StructType: listingType },
              options: { showContent: true, showOwner: true, showType: true },
              limit: 200,
            })

            const normalizeId = (str: string) => (str || '').toLowerCase().trim()

            for (const listingObj of listings.data || []) {
              if (cancelled) return

              const listingFields = (listingObj as any)?.data?.content?.fields || {}
              const listingId = (listingObj as any)?.data?.objectId

              // Check if NFT is embedded
              if (listingFields.nft && listingFields.nft.fields) {
                const nftFields = listingFields.nft.fields
                const nftIdFromListing =
                  nftFields.id?.id || nftFields.id || ''

                if (normalizeId(nftIdFromListing) === normalizeId(id)) {
                  // Found it!
                  setNftData({
                    data: {
                      objectId: id,
                      content: { fields: nftFields },
                      owner: { ObjectOwner: listingId },
                    },
                  })
                  setListing({
                    id: listingId,
                    price: String(listingFields.price ?? '0'),
                    seller: listingFields.seller || '',
                  })
                  return
                }
              }

              // Check nft_id field (fallback)
              const nftId = listingFields.nft_id as string
              if (nftId && normalizeId(nftId) === normalizeId(id)) {
                try {
                  const nftObj = await client.getObject({
                    id,
                    options: { showContent: true, showOwner: true, showType: true },
                  })
                  if (cancelled) return
                  setNftData(nftObj)
                  setListing({
                    id: listingId,
                    price: String(listingFields.price ?? '0'),
                    seller: listingFields.seller || '',
                  })
                  return
                } catch { }
              }
            }
          } catch (err) {
            console.error('Error searching listings:', err)
          }
        }

        // Also try events
        try {
          const eventType = `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::ListNFTEvent`
          const events = await client.queryEvents({
            query: { MoveEventType: eventType },
            limit: 100,
            order: 'descending',
          })

          for (const event of events.data || []) {
            if (cancelled) return

            const parsed = (event as any).parsedJson || {}
            if (parsed.nft_id === id && parsed.listing_id) {
              try {
                const listingObj = await client.getObject({
                  id: parsed.listing_id,
                  options: { showContent: true },
                })
                const listingFields = (listingObj as any)?.data?.content?.fields || {}
                if (listingFields.nft && listingFields.nft.fields) {
                  setNftData({
                    data: {
                      objectId: id,
                      content: { fields: listingFields.nft.fields },
                      owner: { ObjectOwner: parsed.listing_id },
                    },
                  })
                  setListing({
                    id: parsed.listing_id,
                    price: String(listingFields.price ?? '0'),
                    seller: listingFields.seller || '',
                  })
                  return
                }
              } catch { }
            }
          }
        } catch (err) {
          console.error('Error querying events:', err)
        }

        // Not found
        setError('NFT not found')
      } catch (err: any) {
        console.error('Error loading NFT:', err)
        setError(err?.message || 'Failed to load NFT')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadNFT()

    return () => {
      cancelled = true
    }
  }, [id, client])

  // Extract NFT info safely
  const nftInfo = React.useMemo(() => {
    if (!nftData) return null

    try {
      const fields = (nftData as any)?.data?.content?.fields || {}
      const owner = (nftData as any)?.data?.owner

      return {
        name: (fields.name as string) || 'Untitled',
        description: (fields.description as string) || '',
        imageUrl: extractUrl(fields),
        owner: pickOwnerString(owner) || (listing ? 'Escrowed in Listing' : '—'),
        rawOwner: owner,
      }
    } catch (err) {
      console.error('Error extracting NFT info:', err)
      return null
    }
  }, [nftData, listing])

  // Check if user is owner
  const isOwner = React.useMemo(() => {
    if (!account || !nftInfo || listing) return false
    const owner = pickOwnerString(nftInfo.rawOwner)
    if (!owner || !owner.startsWith('0x')) return false
    return account.address.toLowerCase() === owner.toLowerCase()
  }, [account, nftInfo, listing])

  // Check if user can buy
  const canBuy = React.useMemo(() => {
    if (!account || !listing) return false
    if (listing.seller && account.address.toLowerCase() === listing.seller.toLowerCase()) {
      return false
    }
    return true
  }, [account, listing])

  // Buy handler
  async function handleBuy() {
    if (!account || !listing || !listing.id || !listing.price || !marketplaceId) {
      showToast('Unable to complete purchase', 'error')
      return
    }

    setBuying(true)
    try {
      const tx = new Transaction()
      const priceInMist = BigInt(listing.price)
      if (priceInMist === BigInt(0)) {
        showToast('Invalid listing price', 'error')
        return
      }
      const coin = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)])
      tx.moveCall({
        target: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::${APP_CONFIG.FUNCS.buy}`,
        arguments: [tx.object(listing.id), coin, tx.object(marketplaceId)],
      })
      await signAndExecute({ transaction: tx, chain: 'sui:testnet' })
      showToast('Successfully purchased NFT!', 'success')
      setTimeout(() => window.location.reload(), 2000)
    } catch (e: any) {
      showToast(e?.message || 'Purchase failed', 'error')
    } finally {
      setBuying(false)
    }
  }

  // Copy handler
  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      showToast(`${label} copied`, 'success')
    } catch {
      showToast('Failed to copy', 'error')
    }
  }

  // Update description handler
  async function handleUpdateDescription() {
    if (!account || !id || !newDescription.trim()) {
      showToast('Please enter a description', 'error')
      return
    }

    setUpdating(true)
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.NFT_MODULE}::${APP_CONFIG.FUNCS.updateDescription}`,
        arguments: [tx.object(id), tx.pure.string(newDescription.trim())],
      })
      await signAndExecute({ transaction: tx, chain: 'sui:testnet' })
      showToast('Description updated successfully!', 'success')
      setEditDescriptionOpen(false)
      setNewDescription('')
      // Reload NFT data after a short delay
      setTimeout(() => window.location.reload(), 1500)
    } catch (e: any) {
      showToast(e?.message || 'Failed to update description', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-16">
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-400">Loading NFT details…</div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error || !nftData || !nftInfo) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-extrabold mb-2">NFT Not Found</h2>
            <p className="text-gray-400 mb-4">{error || 'This NFT might have been burned or transferred.'}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render NFT details
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute -top-2 left-0 bg-gray-800/70 hover:bg-gray-700 text-sm px-3 py-1.5 rounded-full border border-gray-700 shadow-md"
        >
          ← Back
        </button>

        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/30 backdrop-blur">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{nftInfo.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="text-gray-400">{nftInfo.description || '—'}</div>
              {isOwner && !listing && (
                <button
                  onClick={() => {
                    setNewDescription(nftInfo.description || '')
                    setEditDescriptionOpen(true)
                  }}
                  className="ml-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                  title="Edit description"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Image */}
            <div className="rounded-xl overflow-hidden bg-gray-900/60 border border-gray-700">
              {nftInfo.imageUrl ? (
                <img src={nftInfo.imageUrl} alt={nftInfo.name} className="w-full h-[460px] object-cover" />
              ) : (
                <div className="w-full h-[460px] flex items-center justify-center text-gray-600">No image</div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col h-full">
              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-1.5">Object ID</div>
                  <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
                    <code className="text-xs font-mono text-gray-300 flex-1">{truncateAddress(id)}</code>
                    <button
                      onClick={() => copyToClipboard(id, 'Object ID')}
                      className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded border border-indigo-500 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-1.5">Owner's Address</div>
                  <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
                    {listing ? (
                      <>
                        <div className="flex-1">
                          <div className="text-xs text-gray-300">Escrowed</div>
                          <code className="text-xs font-mono text-blue-400">{truncateAddress(listing.id)}</code>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Price: {listing.price ? formatSui(listing.price) : '0'} SUI
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(listing.id, 'Listing ID')}
                          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded border border-indigo-500 transition"
                        >
                          Copy
                        </button>
                      </>
                    ) : (
                      <>
                        <code className="text-xs font-mono text-blue-400 flex-1">{truncateAddress(nftInfo.owner)}</code>
                        <button
                          onClick={() => copyToClipboard(nftInfo.owner, 'Owner address')}
                          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded border border-indigo-500 transition"
                        >
                          Copy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto pt-6 border-t border-gray-700">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {listing && canBuy && (
                    <button
                      onClick={handleBuy}
                      disabled={buying || isPending}
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-green-500/20 transition"
                    >
                      {buying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Buying...</span>
                        </>
                      ) : (
                        <>
                          <span>💰</span>
                          <span>Buy for {listing.price ? formatSui(listing.price) : '0'} SUI</span>
                        </>
                      )}
                    </button>
                  )}

                  <a
                    href={`https://suiexplorer.com/object/${id}?network=testnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2.5 rounded-lg font-medium transition"
                  >
                    View on Explorer
                  </a>

                  <button
                    onClick={() => navigate('/market')}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-4 py-2.5 rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition"
                  >
                    Go to Marketplace
                  </button>

                  {isOwner && !listing && (
                    <button
                      onClick={() => setBurnOpen(true)}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2.5 rounded-lg font-semibold shadow-lg shadow-red-600/20 transition"
                    >
                      Burn NFT
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Description Modal */}
      <Modal open={editDescriptionOpen} onClose={() => { setEditDescriptionOpen(false); setNewDescription('') }} title="Edit Description">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">New Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Enter a new description for your NFT"
              className="w-full bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition min-h-[120px] resize-y"
              maxLength={500}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">{newDescription.length}/500 characters</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditDescriptionOpen(false)
                setNewDescription('')
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateDescription}
              disabled={!newDescription.trim() || updating || isPending}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold shadow-lg shadow-indigo-600/20 transition"
            >
              {updating || isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </span>
              ) : (
                'Update Description'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Burn Modal */}
      <Modal open={burnOpen} onClose={() => { setBurnOpen(false); setConfirmText('') }} title="Burn NFT">
        <div className="space-y-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <div className="font-semibold text-red-400 mb-1">Permanent Deletion</div>
                <div className="text-sm text-gray-400">This cannot be undone. The NFT will be permanently deleted.</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-300 mb-3">
              Type <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">
                delete {nftInfo.name}
              </span>
            </div>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`delete ${nftInfo.name}`}
              className="w-full bg-gray-800/70 border-2 border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setBurnOpen(false)
                setConfirmText('')
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={confirmText !== `delete ${nftInfo.name}` || isPending}
              onClick={async () => {
                const tx = new Transaction()
                tx.moveCall({
                  target: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.NFT_MODULE}::${APP_CONFIG.FUNCS.burn}`,
                  arguments: [tx.object(id)],
                })
                try {
                  await signAndExecute({ transaction: tx, chain: 'sui:testnet' })
                  showToast('NFT burned', 'success')
                  setBurnOpen(false)
                  navigate('/nfts')
                } catch (e: any) {
                  showToast(e?.message || 'Burn failed', 'error')
                }
              }}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 px-4 py-3 rounded-lg font-semibold shadow-lg shadow-red-600/20"
            >
              {isPending ? 'Burning...' : '🔥 Burn NFT'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
