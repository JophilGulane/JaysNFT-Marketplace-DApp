export const APP_CONFIG = {
  PACKAGE_ID: import.meta.env.VITE_PACKAGE_ID || '0x317efbfcdc9a7a95c99e7bf9ae97061aaecf49136d44cc3828538bc27fddd64b',
  MODULE: import.meta.env.VITE_MARKETPLACE_MODULE || 'nft_marketplace',
  NFT_MODULE: import.meta.env.VITE_NFT_MODULE || 'nft_marketplace',
  FUNCS: {
    mint: import.meta.env.VITE_FUNC_MINT || 'mint_to_sender',
    list: import.meta.env.VITE_FUNC_LIST || 'list_nft_for_sale',
    buy: import.meta.env.VITE_FUNC_BUY || 'buy_nft',
    cancel: import.meta.env.VITE_FUNC_CANCEL || 'cancel_listing',
    withdraw: import.meta.env.VITE_FUNC_WITHDRAW || 'withdraw_marketplace_fees',
    burn: import.meta.env.VITE_FUNC_BURN || 'burn_nft',
    updateDescription: import.meta.env.VITE_FUNC_UPDATE_DESCRIPTION || 'update_nft_description',
  },
  TYPES: {
    nftType: import.meta.env.VITE_NFT_TYPE || '0x317efbfcdc9a7a95c99e7bf9ae97061aaecf49136d44cc3828538bc27fddd64b::nft_marketplace::DevNetNFT',
    listingType: import.meta.env.VITE_LISTING_TYPE || '0x317efbfcdc9a7a95c99e7bf9ae97061aaecf49136d44cc3828538bc27fddd64b::nft_marketplace::Listing',
  },
  ADMIN_ADDRESS: import.meta.env.VITE_ADMIN_ADDRESS || '',
};
