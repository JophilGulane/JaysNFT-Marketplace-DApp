import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SuiClientProvider, createNetworkConfig } from '@mysten/dapp-kit'
import { WalletProvider } from '@mysten/dapp-kit'
import '@mysten/dapp-kit/dist/index.css'
import { TxProvider } from './state/TxContext'
import { ToastProvider } from './components/Toasts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const { networkConfig } = createNetworkConfig({
  testnet: { url: import.meta.env.VITE_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443' },
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <TxProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </TxProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </StrictMode>,
)
