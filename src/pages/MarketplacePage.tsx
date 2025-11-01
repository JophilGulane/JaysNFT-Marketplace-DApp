import { useState } from 'react'
import Marketplace from '../features/Marketplace'
import ActivityFeed from '../features/ActivityFeed'
import ParticleBackground from '../components/ParticleBackground'

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'activity'>('marketplace')

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full">
      <ParticleBackground id="tsparticles-marketplace" />
      <div className="relative z-10 mx-auto px-3 py-4 md:px-12 md:py-8 w-full" style={{ maxWidth: '1920px' }}>
        {/* Tab Navigation */}
        <div className="mb-6 flex items-center gap-2 bg-gray-900/50 border border-gray-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm md:text-base transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'marketplace'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm md:text-base transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'marketplace' ? <Marketplace /> : <ActivityFeed />}
      </div>
      {/* Floating Action Button for Create Listing - positioned like navbar */}
      <button
        onClick={() => {
          const handler = (window as any).__marketplaceCreateListing;
          if (handler) {
            handler();
          }
        }}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed w-12 h-12 md:w-16 md:h-16 rounded-full font-semibold shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 flex items-center justify-center group hover:scale-110"
        title="Create a Listing"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 md:h-7 md:w-7 text-white group-hover:rotate-90 transition-transform duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        <span className="sr-only">Create a Listing</span>
      </button>
    </div>
  )
}
