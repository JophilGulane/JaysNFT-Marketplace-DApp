import React from 'react'
import { useCurrentAccount, useSuiClient, ConnectButton, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { APP_CONFIG } from '../config'
import { useTxInvalidation } from '../state/TxContext'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toasts'
import Modal from '../components/Modal'
import StarBorder from '../components/StarBorder'

export default function OwnedNfts() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { version, invalidate } = useTxInvalidation()
  const [objects, setObjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const navigate = useNavigate()
  const { mutateAsync: signAndExecute, isPending: isBurning } = useSignAndExecuteTransaction()
  const { showToast } = useToast()
  const [burnModal, setBurnModal] = React.useState<{ open: boolean; nft: { id: string; name: string } | null }>({ open: false, nft: null })
  const [confirmText, setConfirmText] = React.useState('')

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      if (!account || !APP_CONFIG.TYPES.nftType) { setObjects([]); return }
      setLoading(true)
      try {
        const res = await client.getOwnedObjects({
          owner: account.address,
          filter: { StructType: APP_CONFIG.TYPES.nftType },
          options: { showContent: true, showType: true, showOwner: true },
        })
        if (!cancelled) setObjects(res.data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [account, client, version])

  async function burnNft() {
    if (!burnModal.nft || !account) return
    if (confirmText !== `delete ${burnModal.nft.name}`) {
      showToast('Confirmation text does not match', 'error')
      return
    }

    const tx = new Transaction()
    tx.moveCall({
      target: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.NFT_MODULE}::${APP_CONFIG.FUNCS.burn}`,
      arguments: [tx.object(burnModal.nft.id)],
    })

    try {
      await signAndExecute({ transaction: tx, chain: 'sui:testnet' })
      showToast('NFT burned successfully', 'success')
      setBurnModal({ open: false, nft: null })
      setConfirmText('')
      invalidate()
    } catch (err: any) {
      showToast(err?.message || 'Burn failed', 'error')
    }
  }

  if (!account) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center w-full">
        <h2 className="text-2xl font-semibold mb-2">Your NFTs</h2>
        <p className="text-gray-400 mb-4">Connect your wallet to view your NFTs.</p>
        <div className="flex justify-center"><ConnectButton connectText="Connect Wallet" /></div>
      </div>
    )
  }

  function extractUrl(fields: any): string {
    if (!fields) return ''
    if (typeof fields.url === 'string') return fields.url
    if (fields.url && typeof fields.url.url === 'string') return fields.url.url
    if (fields.image_url) return fields.image_url
    return ''
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/30 backdrop-blur w-full">
      <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">Your NFTs</h2>
      {loading && <p className="text-gray-400">Loading...</p>}
      {!loading && objects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🖼️</div>
          <div className="text-lg font-semibold mb-1">No NFTs yet</div>
          <div className="text-gray-400 mb-4">You haven’t minted anything. Create your first collectible now.</div>
          <button onClick={() => navigate('/mint')} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded font-semibold">Mint an NFT</button>
        </div>
      )}
      {!loading && objects.length > 0 && (
        <div className="transform scale-[0.8] origin-top" style={{ width: '125%', marginLeft: '-12.5%' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {objects.map((o) => {
            const id = (o.data as any)?.objectId
            const fields = (o.data as any)?.content?.fields || {}
            const url = extractUrl(fields)
            const name = (fields.name as string) || 'Unnamed'
            const description = (fields.description as string) || ''
            return (
              <StarBorder
                as="div"
                className="w-full"
                color="cyan"
                speed="5s"
                style={{ width: '100%', height: '100%' }}
              >
                <div key={id} className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden hover:border-indigo-500 hover:shadow-indigo-500/20 hover:shadow-2xl transition-all duration-300 group flex flex-col h-full">
                  <button onClick={() => navigate(`/nft/${id}`)} className="w-full text-left flex flex-col h-full">
                    {url ? (
                      <img src={url} className="w-full h-80 md:h-96 object-cover group-hover:scale-[1.02] transition-transform duration-500 flex-shrink-0" />
                    ) : (
                      <div className="w-full h-80 md:h-96 flex items-center justify-center text-gray-600 bg-gray-900/40 flex-shrink-0">No image</div>
                    )}
                    <div className="p-5 text-center bg-gradient-to-b from-gray-900/30 to-transparent flex-shrink-0">
                      <div className="text-xl font-extrabold tracking-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] mb-2">{name}</div>
                      <div className="text-sm text-gray-300/90 line-clamp-2 min-h-[3rem]">
                        {description || '\u00A0'}
                      </div>
                    </div>
                  </button>
                </div>
              </StarBorder>
            )
          })}
          </div>
        </div>
      )}

      <Modal open={burnModal.open} onClose={() => { setBurnModal({ open: false, nft: null }); setConfirmText('') }} title="Burn NFT">
        {burnModal.nft && (
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <div className="font-semibold text-red-400 mb-1">Permanent Deletion</div>
                  <div className="text-sm text-gray-400">
                    This action cannot be undone. The NFT will be permanently deleted from the blockchain.
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-300 mb-3">
                To confirm, type <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">delete {burnModal.nft.name}</span>
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`delete ${burnModal.nft.name}`}
                className="w-full bg-gray-800/70 border-2 border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                autoFocus
              />
              {confirmText && confirmText !== `delete ${burnModal.nft.name}` && (
                <div className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <span>✗</span> Text doesn't match
                </div>
              )}
              {confirmText === `delete ${burnModal.nft.name}` && (
                <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <span>✓</span> Confirmation matches
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setBurnModal({ open: false, nft: null }); setConfirmText('') }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={burnNft}
                disabled={confirmText !== `delete ${burnModal.nft.name}` || isBurning}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold shadow-lg shadow-red-600/20 transition disabled:shadow-none"
              >
                {isBurning ? 'Burning...' : '🔥 Burn NFT'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
