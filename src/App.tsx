import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import MintPage from './pages/MintPage'
import MyNftsPage from './pages/MyNftsPage'
import MarketplacePage from './pages/MarketplacePage'
import AdminPage from './pages/AdminPage'
import ActivityPage from './pages/ActivityPage'
import NftDetailPage from './pages/NftDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0a0a] text-gray-100 pt-12 md:pt-16">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mint" element={<MintPage />} />
          <Route path="/nfts" element={<MyNftsPage />} />
          <Route path="/nft/:id" element={<NftDetailPage />} />
          <Route path="/market" element={<MarketplacePage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
