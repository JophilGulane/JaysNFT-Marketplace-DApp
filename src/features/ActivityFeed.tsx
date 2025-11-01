import React from 'react'
import { useSuiClient } from '@mysten/dapp-kit'
import { APP_CONFIG } from '../config'

type ActivityItem = {
  id: string
  type: 'sale' | 'listing' | 'cancel'
  timestamp: number
  nftId: string
  listingId?: string // For listings, we should navigate to the listing
  nftName: string
  nftImageUrl: string
  price: string
  buyer?: string
  seller?: string
  txDigest: string
  isBurned?: boolean // True if NFT cannot be found (likely burned)
}

function formatSui(amountRaw: string | number): string {
  const n = Number(amountRaw) / 1_000_000_000
  if (!Number.isFinite(n)) return String(amountRaw)
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 3 })
  return n.toFixed(6)
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

function truncateAddress(addr: string, start = 6, end = 4): string {
  if (!addr || addr.length <= start + end) return addr
  return `${addr.slice(0, start)}...${addr.slice(-end)}`
}

function extractUrl(fields: any): string {
  if (!fields) return ''
  if (typeof fields.url === 'string') return fields.url
  if (fields.url && typeof fields.url.url === 'string') return fields.url.url
  if (fields.image_url) return fields.image_url
  return ''
}

export default function ActivityFeed() {
  const client = useSuiClient()
  const [activities, setActivities] = React.useState<ActivityItem[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function loadActivities() {
      if (!APP_CONFIG.PACKAGE_ID || !APP_CONFIG.MODULE) {
        if (!cancelled) {
          setLoading(false)
          setActivities([])
        }
        return
      }

      setLoading(true)
      try {
        const purchaseEventType = `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::PurchaseNFTEvent`
        const listEventType = `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::ListNFTEvent`
        const cancelEventType = `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.MODULE}::DelistNFTEvent`

        // Fetch purchase, listing, and cancel events - increased limit to ensure we don't lose historical events
        // Fetch 200 events per type to have enough buffer and ensure all activities are captured
        const [purchaseEvents, listEvents, cancelEvents] = await Promise.all([
          client.queryEvents({
            query: { MoveEventType: purchaseEventType },
            limit: 200,
            order: 'descending',
          }).catch(() => ({ data: [] })),
          client.queryEvents({
            query: { MoveEventType: listEventType },
            limit: 200,
            order: 'descending',
          }).catch(() => ({ data: [] })),
          client.queryEvents({
            query: { MoveEventType: cancelEventType },
            limit: 200,
            order: 'descending',
          }).catch(() => ({ data: [] })),
        ])

        if (cancelled) return

        // Combine and process events
        const allEvents: any[] = [
          ...(purchaseEvents.data || []).map((e: any) => ({ ...e, eventType: 'sale' })),
          ...(listEvents.data || []).map((e: any) => ({ ...e, eventType: 'listing' })),
          ...(cancelEvents.data || []).map((e: any) => ({ ...e, eventType: 'cancel' })),
        ]

        // Fetch transaction details to get timestamps
        const eventWithTx = await Promise.all(
          allEvents.map(async (event: any) => {
            try {
              const txDigest = event.id?.txDigest
              if (txDigest) {
                const tx = await client.getTransactionBlock({
                  digest: txDigest,
                  options: { showEvents: false },
                })
                const timestamp = (tx as any).timestampMs || Date.now()
                return { ...event, timestamp }
              }
              return { ...event, timestamp: Date.now() }
            } catch {
              return { ...event, timestamp: Date.now() }
            }
          })
        )

        // Sort by timestamp (most recent first)
        eventWithTx.sort((a, b) => {
          return b.timestamp - a.timestamp
        })

        // Remove duplicates based on unique transaction digest + event sequence to prevent same event appearing twice
        // Important: We use txDigest + eventSeq + eventType to ensure each event is unique
        // This means the same NFT can have multiple listings/sales and all will be preserved
        const seenEvents = new Set<string>()
        const uniqueEvents = eventWithTx.filter((event: any) => {
          // Ensure we have proper event identification
          const txDigest = event.id?.txDigest || ''
          const eventSeq = event.id?.eventSeq || ''
          const eventType = event.eventType || ''
          
          // Create truly unique key - each event should have unique txDigest+eventSeq combination
          const uniqueKey = `${txDigest}-${eventSeq}-${eventType}`
          
          if (seenEvents.has(uniqueKey)) {
            console.log('Duplicate event filtered:', uniqueKey)
            return false
          }
          seenEvents.add(uniqueKey)
          return true
        })

        // Take top 100 most recent (increased from 50 to preserve even more history)
        // All events should be preserved regardless of NFT ID - same NFT can have multiple activities
        const recentEvents = uniqueEvents.slice(0, 100)

        // Cache for NFT metadata (nftId -> { name, imageUrl, isBurned })
        // This ensures consistency when the same NFT appears in multiple events
        const nftCache = new Map<string, { name: string; imageUrl: string; isBurned?: boolean }>()

          // Helper function to fetch and cache NFT metadata
        async function fetchNftMetadata(nftId: string, listingId?: string, eventType?: string): Promise<{ name: string; imageUrl: string; isBurned: boolean }> {
          // Check cache first
          if (nftCache.has(nftId)) {
            const cached = nftCache.get(nftId)!
            return { ...cached, isBurned: cached.isBurned || false }
          }

          let nftName = 'NFT'
          let nftImageUrl = ''
          let found = false

          // Strategy 1: For listing events, try to get NFT from listing object first
          if (eventType === 'listing' && listingId) {
            try {
              const listingObj = await client.getObject({
                id: listingId,
                options: { showContent: true, showOwner: true },
              })
              const listingFields = (listingObj as any)?.data?.content?.fields || {}

              // New contract: NFT is embedded under fields.nft
              if (listingFields.nft) {
                // Try multiple paths for embedded NFT
                let nftFields = listingFields.nft.fields || listingFields.nft

                // If nested, get the actual fields
                if (nftFields && typeof nftFields === 'object' && !nftFields.name && nftFields.fields) {
                  nftFields = nftFields.fields
                }

                if (nftFields) {
                  const name = nftFields.name
                  const url = extractUrl(nftFields)
                  if (name && name !== 'NFT') {
                    nftName = name as string
                    found = true
                  }
                  if (url) {
                    nftImageUrl = url
                    found = true
                  }
                }
              }
            } catch (err) {
              console.log(`Listing ${listingId} fetch failed, trying direct NFT fetch:`, err)
            }
          }

          // Strategy 2: Try direct NFT fetch (works for both listing and sale events)
          if (!found && nftId) {
            try {
              const nftObj = await client.getObject({
                id: nftId,
                options: { showContent: true, showDisplay: true },
              })
              const data = (nftObj as any)?.data

              if (data) {
                found = true
                // Try content fields first
                const fields = data.content?.fields || data.display?.data || {}

                if (!nftName || nftName === 'NFT') {
                  const nameFromFields = fields.name || data.display?.name
                  if (nameFromFields && nameFromFields !== 'NFT') {
                    nftName = nameFromFields as string
                  }
                }
                if (!nftImageUrl) {
                  const url = extractUrl(fields) || data.display?.image_url || data.display?.url
                  if (url) nftImageUrl = url
                }
              }
            } catch (err) {
              console.log(`Direct NFT ${nftId} fetch failed:`, err)

              // Strategy 3: For any event with listing_id, try fetching listing as fallback
              if (listingId) {
                try {
                  const listingObj = await client.getObject({
                    id: listingId,
                    options: { showContent: true },
                  })
                  const listingFields = (listingObj as any)?.data?.content?.fields || {}

                  // Try embedded NFT in listing
                  if (listingFields.nft) {
                    found = true
                    let nftFields = listingFields.nft.fields || listingFields.nft
                    if (nftFields && typeof nftFields === 'object' && !nftFields.name && nftFields.fields) {
                      nftFields = nftFields.fields
                    }

                    if (nftFields) {
                      if (!nftName || nftName === 'NFT') {
                        const name = nftFields.name
                        if (name && name !== 'NFT') nftName = name as string
                      }
                      if (!nftImageUrl) {
                        const url = extractUrl(nftFields)
                        if (url) nftImageUrl = url
                      }
                    }
                  }
                } catch {
                  // All strategies failed - NFT likely burned
                  found = false
                }
              } else {
                // No listing ID and direct fetch failed - NFT likely burned
                found = false
              }
            }
          }

          // Cache the result (even if it's the default fallback)
          const result = { name: nftName, imageUrl: nftImageUrl, isBurned: !found }
          nftCache.set(nftId, result)
          return result
        }

        // Fetch NFT details for each event
        const activityItems = await Promise.all(
          recentEvents.map(async (event: any): Promise<ActivityItem | null> => {
            try {
              const parsed = event.parsedJson || {}
              const nftId = parsed.nft_id || ''

              if (!nftId) return null

              // Fetch NFT metadata (uses cache for consistency)
              const listingId = parsed.listing_id || ''
              const { name: nftName, imageUrl: nftImageUrl, isBurned } = await fetchNftMetadata(nftId, listingId, event.eventType)

              const priceRaw = parsed.price || '0'
              const price = formatSui(priceRaw)
              const seller = parsed.seller || ''
              const buyer = parsed.buyer || ''
              const timestamp = event.timestamp || Date.now()
              const txDigest = event.id?.txDigest || ''

              // Create unique ID that includes event type AND event sequence to ensure each event is unique
              // Using txDigest + eventSeq + eventType ensures uniqueness even for same NFT
              const uniqueId = `${txDigest}-${event.id?.eventSeq || ''}-${event.eventType || ''}`
              
              // Determine activity type
              let activityType: 'sale' | 'listing' | 'cancel' = 'listing'
              if (event.eventType === 'sale') {
                activityType = 'sale'
              } else if (event.eventType === 'cancel') {
                activityType = 'cancel'
              } else {
                activityType = 'listing'
              }
              
              return {
                id: uniqueId,
                type: activityType,
                timestamp,
                nftId,
                listingId,
                nftName,
                nftImageUrl,
                price: activityType === 'cancel' ? '0' : price, // Cancels don't have price
                buyer: activityType === 'sale' ? buyer : undefined,
                seller: activityType === 'cancel' ? undefined : seller, // Cancels might not have seller in parsed data
                txDigest,
                isBurned,
              }
            } catch (err) {
              console.error('Error processing activity:', err)
              return null
            }
          })
        )

        if (cancelled) return

        // Filter out nulls and set activities
        const validActivities = activityItems.filter((item): item is ActivityItem => item !== null)
        setActivities(validActivities)
      } catch (err: any) {
        console.error('Failed to load activities:', err)
        if (!cancelled) setActivities([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadActivities()

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [client])

  if (loading && activities.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/30 backdrop-blur">
        <h2 className="text-3xl font-extrabold mb-6">Activity Feed</h2>
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-400">Loading recent activity...</div>
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/30 backdrop-blur">
        <h2 className="text-3xl font-extrabold mb-6">Activity Feed</h2>
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📊</div>
          <div className="text-lg font-semibold mb-1">No activity yet</div>
          <div className="text-gray-400">Recent sales and listings will appear here.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-extrabold">Activity Feed</h2>
        <div className="text-xs text-gray-500">Updates every 30s</div>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 transition-all"
          >
            <div className="flex items-start gap-4">
              {/* NFT Image */}
              <div className="flex-shrink-0 relative">
                {activity.nftImageUrl && !activity.isBurned ? (
                  <img
                    src={activity.nftImageUrl}
                    alt={activity.nftName}
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-gray-700"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-900/60 border border-gray-700 rounded-lg flex items-center justify-center text-gray-600 text-xs relative">
                    {activity.isBurned ? (
                      <>
                        <span className="text-2xl">🔥</span>
                        <div className="absolute inset-0 bg-red-900/20 rounded-lg"></div>
                      </>
                    ) : (
                      'NFT'
                    )}
                  </div>
                )}
                {activity.isBurned && (
                  <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-red-700">
                    BURNED
                  </div>
                )}
              </div>

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {activity.type === 'sale' ? (
                        <>
                          <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-1 rounded">
                            <span>💰</span>
                            <span>SOLD</span>
                          </span>
                        </>
                      ) : activity.type === 'cancel' ? (
                        <>
                          <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 text-xs font-semibold px-2 py-1 rounded">
                            <span>❌</span>
                            <span>CANCELLED</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-2 py-1 rounded">
                            <span>📝</span>
                            <span>LISTED</span>
                          </span>
                        </>
                      )}
                      <span className="text-gray-400 text-xs">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                    <div className="font-semibold text-white truncate flex items-center gap-2">
                      {activity.isBurned && (
                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 text-xs font-semibold px-2 py-0.5 rounded">
                          <span>🔥</span>
                          <span>BURNED</span>
                        </span>
                      )}
                      <span className={activity.isBurned ? 'line-through text-gray-500' : ''}>
                        {activity.nftName}
                      </span>
                    </div>
                  </div>
                  {activity.type !== 'cancel' && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-extrabold text-indigo-400">{activity.price} SUI</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  {activity.type === 'sale' ? (
                    <>
                      <div>
                        <span className="text-gray-600">Buyer:</span>{' '}
                        <code className="text-blue-400">{truncateAddress(activity.buyer || '')}</code>
                      </div>
                      <div>
                        <span className="text-gray-600">Seller:</span>{' '}
                        <code className="text-purple-400">{truncateAddress(activity.seller || '')}</code>
                      </div>
                    </>
                  ) : activity.type === 'listing' && activity.seller ? (
                    <div>
                      <span className="text-gray-600">Seller:</span>{' '}
                      <code className="text-purple-400">{truncateAddress(activity.seller)}</code>
                    </div>
                  ) : null}
                  {activity.txDigest && (
                    <a
                      href={`https://suiexplorer.com/transaction/${activity.txDigest}?network=testnet`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      View Tx
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

