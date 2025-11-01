/**
 * Upload file to Pinata IPFS pinning service
 * Returns the IPFS CID which can be used as a URL
 */

export interface PinataUploadResult {
  cid: string
  ipfsUrl: string
  gatewayUrl: string
}

export async function uploadToPinata(file: File): Promise<PinataUploadResult> {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT || ''
  const pinataGateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'
  
  if (!pinataJwt) {
    throw new Error('VITE_PINATA_JWT is not set in environment variables. Please add your Pinata JWT token to .env file.')
  }

  // Validate file
  if (!file) {
    throw new Error('No file provided')
  }

  // Check file size (max 100MB for Pinata free tier)
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
  }

  // Create FormData
  const formData = new FormData()
  formData.append('file', file)

  // Pinata metadata
  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      uploadedAt: new Date().toISOString(),
    },
  })
  formData.append('pinataMetadata', metadata)

  // Options for pinning
  const options = JSON.stringify({
    cidVersion: 0,
  })
  formData.append('pinataOptions', options)

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error?.message || errorData.error || `Upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    const cid = data.IpfsHash

    if (!cid) {
      throw new Error('No CID returned from Pinata')
    }

    // Return CID and URLs
    return {
      cid,
      ipfsUrl: `ipfs://${cid}`,
      gatewayUrl: `https://${pinataGateway}/ipfs/${cid}`,
    }
  } catch (error: any) {
    if (error.message) {
      throw error
    }
    throw new Error(`Failed to upload to Pinata: ${error.message || 'Unknown error'}`)
  }
}

