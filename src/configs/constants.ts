// Central constants shim (reads from .env)
// Prefer importing from this file if you want a single source of truth without APP_CONFIG.

// Package / Objects
export const CONTRACTPACKAGEID = import.meta.env.VITE_PACKAGE_ID || ''
export const MARKETPLACE_OBJECT_ID = import.meta.env.VITE_MARKETPLACE_OBJECT_ID || ''

// Modules
export const CONTRACTMODULENAME =
  import.meta.env.VITE_NFT_MODULE || import.meta.env.VITE_MARKETPLACE_MODULE || 'jays_nft_marketplace'
export const MARKETPLACE_MODULE = import.meta.env.VITE_MARKETPLACE_MODULE || CONTRACTMODULENAME
export const NFT_MODULE = import.meta.env.VITE_NFT_MODULE || CONTRACTMODULENAME

// Function names
export const CONTRACTMODULEMETHOD = import.meta.env.VITE_FUNC_MINT || 'mint_to_sender'
export const FUNC_MINT = import.meta.env.VITE_FUNC_MINT || 'mint_to_sender'
export const FUNC_LIST = import.meta.env.VITE_FUNC_LIST || 'list_nft_for_sale'
export const FUNC_BUY = import.meta.env.VITE_FUNC_BUY || 'buy_nft'
export const FUNC_CANCEL = import.meta.env.VITE_FUNC_CANCEL || 'cancel_listing'
export const FUNC_WITHDRAW = import.meta.env.VITE_FUNC_WITHDRAW || 'withdraw_marketplace_fees'

// Types
export const NFT_TYPE = import.meta.env.VITE_NFT_TYPE || ''
export const LISTING_TYPE = import.meta.env.VITE_LISTING_TYPE || ''

// Optional admin
export const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS || ''

// Convenience bundle if you prefer object notation
export const CONSTANTS = {
  PACKAGE_ID: CONTRACTPACKAGEID,
  MARKETPLACE_OBJECT_ID,
  MODULES: { MARKETPLACE_MODULE, NFT_MODULE },
  FUNCS: { FUNC_MINT, FUNC_LIST, FUNC_BUY, FUNC_CANCEL, FUNC_WITHDRAW },
  TYPES: { NFT_TYPE, LISTING_TYPE },
  ADMIN_ADDRESS,
}


