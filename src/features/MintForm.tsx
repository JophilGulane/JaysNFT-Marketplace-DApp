import React from 'react'
import { Transaction } from '@mysten/sui/transactions'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, ConnectButton } from '@mysten/dapp-kit'
import { useTxInvalidation } from '../state/TxContext'
import { useToast } from '../components/Toasts'
import { APP_CONFIG } from '../config'
import Modal from '../components/Modal'
import { useNavigate } from 'react-router-dom'
import { uploadToPinata } from '../utils/pinataUpload'

type TxState = 'idle' | 'submitting' | 'success' | 'error' | 'uploading'

export default function MintForm() {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const navigate = useNavigate()
  const { mutate } = useSignAndExecuteTransaction()
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [imageUrl, setImageUrl] = React.useState('')
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string>('')
  const [uploadProgress, setUploadProgress] = React.useState<string>('')
  const [txState, setTxState] = React.useState<TxState>('idle')
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const [mintedNft, setMintedNft] = React.useState<{ id: string; name: string; imageUrl: string } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = React.useState(false)
  const [validationErrors, setValidationErrors] = React.useState<{ name?: string; description?: string; imageUrl?: string }>({})
  const { invalidate } = useTxInvalidation()
  const { showToast } = useToast()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Validation functions
  function validateName(value: string): string | undefined {
    if (!value.trim()) return 'Name is required'
    if (value.trim().length < 2) return 'Name must be at least 2 characters'
    if (value.trim().length > 100) return 'Name must be less than 100 characters'
    return undefined
  }

  function validateDescription(value: string): string | undefined {
    if (!value.trim()) return 'Description is required'
    if (value.trim().length < 5) return 'Description must be at least 5 characters'
    if (value.trim().length > 500) return 'Description must be less than 500 characters'
    return undefined
  }

  function validateImageUrl(value: string): string | undefined {
    // If imageFile exists, URL validation is not required
    if (imageFile) return undefined
    if (!value.trim()) return 'Image URL or file upload is required'
    try {
      const url = new URL(value.trim())
      if (!['http:', 'https:', 'ipfs:'].includes(url.protocol)) {
        return 'URL must use http, https, or ipfs protocol'
      }
      if (value.trim().length > 2048) return 'URL must be less than 2048 characters'
    } catch {
      return 'Please enter a valid URL'
    }
    return undefined
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      setValidationErrors(prev => ({ ...prev, imageUrl: 'Please select an image file' }))
      return
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('File size must be less than 100MB', 'error')
      setValidationErrors(prev => ({ ...prev, imageUrl: 'File size must be less than 100MB' }))
      return
    }

    setImageFile(file)
    setImageUrl('') // Clear URL input when file is selected
    setValidationErrors(prev => ({ ...prev, imageUrl: undefined }))

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveFile() {
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      setValidationErrors(prev => ({ ...prev, imageUrl: 'Please select an image file' }))
      return
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('File size must be less than 100MB', 'error')
      setValidationErrors(prev => ({ ...prev, imageUrl: 'File size must be less than 100MB' }))
      return
    }

    setImageFile(file)
    setImageUrl('') // Clear URL input when file is selected
    setValidationErrors(prev => ({ ...prev, imageUrl: undefined }))

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
  }

  async function handleUploadImage(): Promise<string> {
    if (!imageFile) {
      throw new Error('No file selected')
    }

    setUploadProgress('Uploading image to IPFS...')
    try {
      const result = await uploadToPinata(imageFile)
      setUploadProgress('')
      showToast('Image uploaded successfully!', 'success')
      // Use the gateway URL for the NFT
      return result.gatewayUrl
    } catch (error: any) {
      setUploadProgress('')
      throw error
    }
  }

  function validateAll(): boolean {
    const errors = {
      name: validateName(name),
      description: validateDescription(description),
      imageUrl: validateImageUrl(imageUrl),
    }
    setValidationErrors(errors)
    return !errors.name && !errors.description && !errors.imageUrl
  }

  async function onMint(e: React.FormEvent) {
    e.preventDefault()
    
    // Client-side validation
    if (!validateAll()) {
      setTxState('error')
      setErrorMessage('Please fix the validation errors before submitting')
      showToast('Please fix the form errors', 'error')
      return
    }
    
    if (!account) {
      setTxState('error')
      setErrorMessage('Connect your wallet first')
      showToast('Connect your wallet first', 'error')
      return
    }
    if (!APP_CONFIG.PACKAGE_ID) {
      setTxState('error')
      setErrorMessage('VITE_PACKAGE_ID is empty')
      showToast('VITE_PACKAGE_ID is empty', 'error')
      return
    }

    setTxState('uploading')
    setErrorMessage('')
    setMintedNft(null)

    let finalImageUrl = imageUrl

    // Upload image if file is selected
    if (imageFile) {
      try {
        finalImageUrl = await handleUploadImage()
      } catch (error: any) {
        setTxState('error')
        setErrorMessage(error?.message || 'Failed to upload image')
        showToast(error?.message || 'Failed to upload image', 'error')
        return
      }
    }

    if (!finalImageUrl) {
      setTxState('error')
      setErrorMessage('Image URL is required')
      showToast('Image URL is required', 'error')
      return
    }

    setTxState('submitting')
    setUploadProgress('')

    const txb = new Transaction()
    txb.moveCall({
      target: `${APP_CONFIG.PACKAGE_ID}::${APP_CONFIG.NFT_MODULE}::${APP_CONFIG.FUNCS.mint}`,
      arguments: [
        txb.pure.string(name),
        txb.pure.string(description),
        txb.pure.string(finalImageUrl),
      ],
    })

    mutate(
      { transaction: txb, chain: 'sui:testnet' },
      {
        onSuccess: async ({ digest }) => {
          try {
            const { effects } = await suiClient.waitForTransaction({
              digest,
              options: { showEffects: true },
            })
            const created = effects?.created?.[0]?.reference?.objectId
            if (created) {
              setMintedNft({ id: created, name, imageUrl: finalImageUrl })
              setTxState('success')
              setShowSuccessModal(true)
              setName(''); setDescription(''); setImageUrl('')
              setImageFile(null); setImagePreview('')
              setValidationErrors({})
              if (fileInputRef.current) fileInputRef.current.value = ''
              invalidate()
            } else {
              setTxState('error')
              setErrorMessage('NFT created but ID not found')
              showToast('Mint submitted, but NFT ID not found', 'error')
            }
          } catch (err: any) {
            setTxState('error')
            setErrorMessage(err?.message || 'Failed to fetch tx effects')
            showToast(err?.message || 'Failed to fetch tx effects', 'error')
          }
        },
        onError: (err: any) => {
          setTxState('error')
          setErrorMessage(err?.message || 'Mint failed')
          showToast(err?.message || 'Mint failed', 'error')
        },
      }
    )
  }

  if (!account) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 text-center shadow-lg shadow-black/30 backdrop-blur transform scale-[0.8] origin-top">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">Mint NFT</h2>
        <p className="text-base text-gray-300 mb-6">Connect your wallet to mint your first collectible.</p>
        <div className="flex justify-center"><ConnectButton connectText="Connect Wallet" /></div>
      </div>
    )
  }

  const isPending = txState === 'submitting' || txState === 'uploading'
  const hasValidationErrors = Object.values(validationErrors).some(err => err !== undefined)
  const hasImage = !!imageFile || !!imageUrl.trim()
  const canSubmit = (txState === 'idle' || txState === 'error') && !hasValidationErrors && name.trim() && description.trim() && hasImage

  return (
    <>
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/30 backdrop-blur transform scale-[0.8] origin-top">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">Mint NFT</h2>
          {(txState === 'submitting' || txState === 'uploading') && (
            <div className="flex items-center gap-2 text-indigo-400">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">
                {txState === 'uploading' ? uploadProgress || 'Uploading image...' : 'Submitting transaction...'}
              </span>
            </div>
          )}
        </div>

        {/* Transaction State Indicators */}
        {txState === 'error' && errorMessage && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
            <div className="text-lg">⚠️</div>
            <div className="flex-1">
              <div className="font-semibold text-base text-red-400 mb-1">Transaction Failed</div>
              <div className="text-sm text-gray-300">{errorMessage}</div>
            </div>
            <button onClick={() => { setTxState('idle'); setErrorMessage('') }} className="text-red-400 hover:text-red-300 text-lg">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={onMint} className="space-y-4">
            <div>
              <label className="block text-base font-semibold text-white mb-2">Name <span className="text-red-400">*</span></label>
              <input 
                type="text"
                maxLength={100}
                className={`w-full bg-gray-800/70 border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition ${
                  validationErrors.name 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
                placeholder="e.g. Galactic Voyager" 
                value={name} 
                onChange={e => {
                  setName(e.target.value)
                  if (validationErrors.name) {
                    const error = validateName(e.target.value)
                    setValidationErrors(prev => ({ ...prev, name: error }))
                  }
                }}
                onBlur={() => {
                  const error = validateName(name)
                  setValidationErrors(prev => ({ ...prev, name: error }))
                }}
                disabled={isPending} 
                required 
              />
              {validationErrors.name && (
                <p className="text-xs text-red-400 mt-1">{validationErrors.name}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{name.length}/100 characters</p>
            </div>
            <div>
              <label className="block text-base font-semibold text-white mb-2">Description <span className="text-red-400">*</span></label>
              <textarea
                rows={3}
                maxLength={500}
                className={`w-full bg-gray-800/70 border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition resize-none ${
                  validationErrors.description 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
                placeholder="A sci‑fi themed collectible" 
                value={description} 
                onChange={e => {
                  setDescription(e.target.value)
                  if (validationErrors.description) {
                    const error = validateDescription(e.target.value)
                    setValidationErrors(prev => ({ ...prev, description: error }))
                  }
                }}
                onBlur={() => {
                  const error = validateDescription(description)
                  setValidationErrors(prev => ({ ...prev, description: error }))
                }}
                disabled={isPending} 
                required 
              />
              {validationErrors.description && (
                <p className="text-xs text-red-400 mt-1">{validationErrors.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{description.length}/500 characters</p>
            </div>
            <div>
              <label className="block text-base font-semibold text-white mb-2">Image <span className="text-red-400">*</span></label>
              
              {/* File Upload Option */}
              <div className="mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isPending}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className={`block w-full border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition ${
                    imageFile
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                  } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {imageFile ? (
                    <div className="space-y-2">
                      <div className="text-sm text-indigo-400 font-semibold">✓ {imageFile.name}</div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleRemoveFile() }}
                        disabled={isPending}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="mx-auto h-8 w-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div className="text-sm text-gray-300">
                        <span className="text-indigo-400 font-semibold">Click to upload</span> or drag and drop
                      </div>
                      <div className="text-xs text-gray-400">PNG, JPG, GIF up to 100MB</div>
                    </div>
                  )}
                </label>
              </div>

              {/* URL Input Option (Alternative) */}
              <div className="relative">
                <div className="text-xs text-gray-300 mb-1.5 text-left">Or enter image URL:</div>
                <input 
                  type="url"
                  maxLength={2048}
                  className={`w-full bg-gray-800/70 border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition ${
                    validationErrors.imageUrl 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                  } ${imageFile ? 'opacity-50' : ''}`}
                  placeholder="https://... or ipfs://..." 
                  value={imageUrl} 
                  onChange={e => {
                    setImageUrl(e.target.value)
                    if (e.target.value) {
                      setImageFile(null)
                      setImagePreview('')
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }
                    if (validationErrors.imageUrl) {
                      const error = validateImageUrl(e.target.value)
                      setValidationErrors(prev => ({ ...prev, imageUrl: error }))
                    }
                  }}
                  onBlur={() => {
                    const error = validateImageUrl(imageUrl)
                    setValidationErrors(prev => ({ ...prev, imageUrl: error }))
                  }}
                  disabled={isPending || !!imageFile} 
                />
              </div>

              {validationErrors.imageUrl && (
                <p className="text-xs text-red-400 mt-1">{validationErrors.imageUrl}</p>
              )}
              
              {imageFile && (
                <p className="text-xs text-indigo-400 mt-2">✓ Image will be uploaded to IPFS when you mint</p>
              )}
              
              {!imageFile && (
                <p className="text-xs text-gray-400 mt-2">Tip: Upload a file to automatically pin to IPFS, or use an IPFS gateway URL.</p>
              )}
            </div>
            <div className="pt-2">
              <button 
                type="submit"
                disabled={!canSubmit} 
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {txState === 'submitting' && (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Minting...</span>
                  </>
                )}
                {txState !== 'submitting' && 'Mint Your NFT'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div>
              <div className="text-base font-semibold text-white mb-3">Live Preview</div>
              
              {/* Image Preview Area */}
              <div className="rounded-lg overflow-hidden bg-gray-800/60 border border-gray-700 mb-3">
                {imagePreview || imageUrl ? (
                  <img src={imagePreview || imageUrl} alt="Preview" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-sm text-gray-400 bg-gray-800/50">Image preview</div>
                )}
              </div>

              {/* NFT Card Preview */}
              <div className="rounded-lg overflow-hidden bg-gray-900/60 border border-gray-700">
                <div className="p-3 bg-gray-800/40">
                  <div className="text-sm font-bold text-white truncate mb-1">{name || 'Untitled NFT'}</div>
                  <div className="text-xs text-gray-400 line-clamp-2">{description || 'Description goes here'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal open={showSuccessModal} onClose={() => { setShowSuccessModal(false); setTxState('idle') }} title="">
        <div className="text-center py-6">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xl animate-pulse">
                ✨
              </div>
            </div>
          </div>
          
          <h3 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
            NFT Minted Successfully!
          </h3>
          <p className="text-gray-400 mb-6">Your collectible is now on the Sui blockchain</p>

          {mintedNft && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-6">
              {mintedNft.imageUrl && (
                <img src={mintedNft.imageUrl} alt={mintedNft.name} className="w-32 h-32 object-cover rounded-lg mx-auto mb-3" />
              )}
              <div className="font-semibold text-lg mb-2">{mintedNft.name}</div>
              <code className="text-xs text-gray-400 break-all">{mintedNft.id}</code>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setShowSuccessModal(false); setTxState('idle') }}
              className="bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-lg font-semibold transition"
            >
              Mint Another
            </button>
            <button
              onClick={() => { setShowSuccessModal(false); navigate('/nfts'); setTxState('idle') }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition"
            >
              View My NFTs
            </button>
            {mintedNft && (
              <button
                onClick={() => { setShowSuccessModal(false); navigate(`/nft/${mintedNft.id}`); setTxState('idle') }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-green-500/20 transition"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
