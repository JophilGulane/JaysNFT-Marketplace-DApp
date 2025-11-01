import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ParticleBackground from './ParticleBackground'
import CircularGallery from './CircularGallery'
import ShootingStars from './ShootingStars'

// Tooltip Component
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl border border-gray-700 whitespace-nowrap z-50">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-900/95"></div>
          </div>
        </div>
      )}
    </div>
  )
}

const Hero: React.FC = () => {
  const navigate = useNavigate()
  return (
    <section id="explore" className="text-center flex flex-col justify-start pt-20 md:pt-32 pb-8 md:pb-12 mb-0 relative" style={{ overflow: 'hidden' }}>
      {/* Animated background glow - centered and smaller */}
      <div className="absolute top-0 left-0 -z-10 pointer-events-none" style={{
        width: '100vw',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 0,
        bottom: 0,
        overflow: 'visible'
      }}>
        {/* Much smaller glows centered in the Hero section */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] sm:w-[35vw] sm:h-[35vw] md:w-96 md:h-96 bg-indigo-500/10 sm:bg-indigo-500/8 md:bg-indigo-500/6 rounded-full blur-[40px] sm:blur-[60px] md:blur-3xl animate-pulse"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vw] sm:w-[30vw] sm:h-[30vw] md:w-72 md:h-72 bg-purple-500/12 sm:bg-purple-500/10 md:bg-purple-500/8 rounded-full blur-[35px] sm:blur-[50px] md:blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] sm:w-[25vw] sm:h-[25vw] md:w-64 md:h-64 bg-pink-500/10 sm:bg-pink-500/8 md:bg-pink-500/6 rounded-full blur-[30px] sm:blur-[40px] md:blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main heading */}
      <div className="relative z-10 space-y-4 mb-6 px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
          Discover, Collect, & Sell<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient">
            Extraordinary NFTs
          </span>
        </h2>

        {/* Badges */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6 flex-wrap px-4">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs sm:text-sm text-indigo-300 hover:bg-indigo-500/20 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-semibold">Powered by Sui</span>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-xs sm:text-sm text-green-300 hover:bg-green-500/20 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-semibold">Secure</span>
          </div>
        </div>
      </div>

      <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-6 md:mb-8 relative z-10 px-4">
        Jays NFT Marketplace is the premier destination for digital art and collectibles. Join thousands of creators and collectors.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-0 relative z-10 px-4">
        <button
          onClick={() => navigate('/market')}
          className="group relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 sm:py-3.5 sm:px-8 rounded-xl shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer"></span>
          <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="relative z-10 text-sm sm:text-base">Explore Marketplace</span>
        </button>
        <button
          onClick={() => navigate('/mint')}
          className="group relative overflow-hidden bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 hover:border-gray-600 text-white font-semibold py-3 px-6 sm:py-3.5 sm:px-8 rounded-xl shadow-lg shadow-gray-800/40 hover:shadow-gray-700/60 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 w-full max-w-[60%] sm:max-w-none sm:w-auto"
        >
          <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm sm:text-base">Mint NFT</span>
        </button>
      </div>
    </section>
  )
}

const NFTGallery: React.FC = () => {
  // Famous NFT collections - using actual IPFS links via Pinata gateway
  // Using Pinata IPFS gateway which supports CORS and reliable image loading
  const nftItems = [
    { image: 'https://apricot-select-wildebeest-7.mypinata.cloud/ipfs/bafkreih6tzbyapnqzliacr2dxvvv4kupzrlhja3gfpzshilmiu3xcvwac4', text: 'Bored Ape' },
    { image: 'https://apricot-select-wildebeest-7.mypinata.cloud/ipfs/bafkreig4akymreqol5h436jlpe5kkwna2qwamutz54g3on52ll2obusbke', text: 'CryptoPunk' },
    { image: 'https://apricot-select-wildebeest-7.mypinata.cloud/ipfs/bafkreigxmfedy3a35iuj7lhdqpxiytm76eeadlsy6aueqyea2aikmsocqu', text: 'Mutant Ape' },
    { image: 'https://apricot-select-wildebeest-7.mypinata.cloud/ipfs/bafkreiggwj6ja64xe42h4afly24eswhs6pyrqbtpd6gphmiejx2za2mhlm', text: 'Azuki' },
    { image: 'https://apricot-select-wildebeest-7.mypinata.cloud/ipfs/bafybeidyqp7rwfyq7awpagg4qxljxqwkyvzjxaqqu4pxzktlgzigf5oka4', text: 'Doodles' },
    { image: 'https://apricot-select-wildebeest-7.mypinata.cloud/ipfs/bafkreiaetnjptjitd74g36uw2t67vyuzh6rmvz73zplktfwkcurbdzlwfa', text: 'Pudgy Penguins' },
    { image: 'https://apricot-select-wildebeest-7.mypinata.cloud/ipfs/bafkreicfbaxtiate7h53qv3ggr3emfq2vsruexcg3moixx2yzapdbdxig4', text: 'Moonbirds' },
    { image: 'https://apricot-select-wildebeest-7.mypinata.cloud/ipfs/bafkreieofmwzibl5vnd6rdabpsxrpm227tgzgxrxtrqueujevheyp6nvbi', text: 'Cool Cats' }
  ];

  return (
    <section style={{
      paddingTop: '13rem',
      paddingBottom: '0',
      marginTop: '0',
      width: '100vw',
      position: 'relative',
      left: '50%',
      right: '50%',
      marginLeft: '-50vw',
      marginRight: '-50vw',
      paddingLeft: '0',
      paddingRight: '0',
      overflowX: 'visible'
    }}>
      <div className="bg-gray-900/40 backdrop-blur-sm py-8 md:py-10 border-t border-b border-gray-800/50" style={{ width: '100vw', maxWidth: 'none', marginLeft: '0', marginRight: '0', paddingLeft: '0', paddingRight: '0', boxSizing: 'border-box', minWidth: '100vw', position: 'relative' }}>
        <div className="text-center mb-2 md:mb-3 px-6 md:px-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2">
            Explore Collections
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Discover NFTs from the collections in the JaysNFT Marketplace
          </p>
        </div>
        <div style={{ height: '475px', position: 'relative', width: '100vw', maxWidth: 'none', marginLeft: '0', marginRight: '0' }}>
          <CircularGallery
            items={nftItems}
            bend={0}
            textColor="#ffffff"
            borderRadius={0.05}
            scrollEase={0.02}
            scrollSpeed={2}
          />
        </div>
      </div>
    </section>
  );
};

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: 'Set Up Your Wallet',
      description: 'Connect your Sui wallet to our platform. It\'s simple, secure, and takes only a few seconds.',
      gradient: 'from-indigo-500/20 to-purple-500/20',
      borderColor: 'border-indigo-500/30',
      iconBg: 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/20',
      iconColor: 'text-indigo-300',
      tooltip: 'Connect with Sui Wallet, Suiet, or any compatible wallet extension'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Create Your Collection',
      description: 'Upload your digital artwork, add a title and description, and customize properties to mint your unique NFTs.',
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
      iconBg: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-300',
      tooltip: 'Mint unlimited NFTs with customizable metadata and images'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'List Them For Sale',
      description: 'Set your price and list your NFTs on the marketplace. Buy, sell, and trade with ease on the Sui blockchain.',
      gradient: 'from-pink-500/20 to-indigo-500/20',
      borderColor: 'border-pink-500/30',
      iconBg: 'bg-gradient-to-br from-pink-500/20 to-pink-600/20',
      iconColor: 'text-pink-300',
      tooltip: 'Set your price in SUI and instantly list on the marketplace'
    }
  ]

  return (
    <section id="how-it-works" className="pt-8 pb-20 md:pt-12 md:pb-24 relative">
      {/* Section Header */}
      <div className="text-center mb-12 md:mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm text-indigo-300 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-semibold">Simple Process</span>
        </div>
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4">
          <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">How It Works</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Get started in three easy steps and join the future of digital ownership
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`group relative bg-gradient-to-br ${step.gradient} border ${step.borderColor} rounded-2xl p-6 md:p-8 text-center backdrop-blur-sm hover:scale-105 transition-all duration-300 cursor-pointer`}
          >
            {/* Animated background glow on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300`}></div>

            {/* Icon */}
            <div className={`relative h-16 w-16 mx-auto mb-5 rounded-full ${step.iconBg} ${step.iconColor} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">{step.icon}</div>
            </div>

            {/* Step Number */}
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-gray-300">
              {index + 1}
            </div>

            {/* Content */}
            <h3 className="text-xl md:text-2xl font-extrabold mb-3 relative z-10 group-hover:text-white transition-colors duration-300">
              {step.title}
            </h3>
            <p className="text-gray-400 leading-relaxed relative z-10 group-hover:text-gray-300 transition-colors duration-300">
              {step.description}
            </p>

            {/* Connecting Arrow */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                <svg className="w-8 h-8 text-indigo-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

const Footer: React.FC = () => (
  <footer className="border-t border-gray-800/50 bg-gradient-to-b from-transparent via-black/10 to-black/20 backdrop-blur-sm">
    <div className="container mx-auto px-6 py-12 md:px-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-12">
        {/* Brand */}
        <div className="flex flex-col">
          <div className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">
            <span className="inline-block">Jays</span>
            <span className="inline-block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent ml-1">NFT</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            The premier destination for digital art and collectibles on Sui blockchain.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col items-center">
          <h4 className="text-white font-bold text-base md:text-lg mb-5 tracking-wide uppercase text-xs md:text-sm w-full text-center">Quick Links</h4>
          <div className="flex flex-col space-y-3 items-center w-full">
            <a
              href="/market"
              className="text-gray-400 hover:text-indigo-400 text-sm transition-all duration-300 hover:translate-x-1 inline-flex items-center justify-center gap-2 group"
            >
              <span className="w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 group-hover:w-3 transition-all duration-300"></span>
              <span>Marketplace</span>
            </a>
            <a
              href="/mint"
              className="text-gray-400 hover:text-indigo-400 text-sm transition-all duration-300 hover:translate-x-1 inline-flex items-center justify-center gap-2 group"
            >
              <span className="w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 group-hover:w-3 transition-all duration-300"></span>
              <span>Mint NFT</span>
            </a>
            <a
              href="/nfts"
              className="text-gray-400 hover:text-indigo-400 text-sm transition-all duration-300 hover:translate-x-1 inline-flex items-center justify-center gap-2 group"
            >
              <span className="w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 group-hover:w-3 transition-all duration-300"></span>
              <span>My NFTs</span>
            </a>
            <a
              href="/market"
              className="text-gray-400 hover:text-indigo-400 text-sm transition-all duration-300 hover:translate-x-1 inline-flex items-center justify-center gap-2 group"
            >
              <span className="w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 group-hover:w-3 transition-all duration-300"></span>
              <span>Activity</span>
            </a>
          </div>
        </div>

        {/* Social */}
        <div className="flex flex-col items-center">
          <h4 className="text-white font-bold text-base md:text-lg mb-5 tracking-wide uppercase text-xs md:text-sm w-full text-center">Connect</h4>
          <div className="flex gap-3 justify-center">
            <Tooltip text="Follow us on X">
              <a
                target="_blank"
                href="https://x.com/JophilGulane"
                className="group relative w-11 h-11 bg-gradient-to-br from-gray-800/60 to-gray-900/60 hover:from-indigo-500/20 hover:to-purple-500/20 border border-gray-700/50 hover:border-indigo-500/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-300 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
            </Tooltip>
            <Tooltip text="Join our Discord">
              <a
                href="https://discord.gg/8xpgJrm2GB"
                className="group relative w-11 h-11 bg-gradient-to-br from-gray-800/60 to-gray-900/60 hover:from-indigo-500/20 hover:to-purple-500/20 border border-gray-700/50 hover:border-indigo-500/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-300 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
            </Tooltip>
            <Tooltip text="Visit our GitHub">
              <a
                href="https://github.com/JophilGulane"
                className="group relative w-11 h-11 bg-gradient-to-br from-gray-800/60 to-gray-900/60 hover:from-indigo-500/20 hover:to-purple-500/20 border border-gray-700/50 hover:border-indigo-500/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-300 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="pt-8 border-t border-gray-800/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs md:text-sm">
            &copy; {new Date().getFullYear()} <span className="text-gray-400 font-semibold">Jays NFT Marketplace</span>. All Rights Reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Built on</span>
            <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-indigo-400 font-semibold">Sui</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
)

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-gray-100" style={{ overflowX: 'visible', margin: 0, padding: 0 }}>
      <ParticleBackground />
      <ShootingStars />
      {/* Hero section - full width */}
      <div className="relative z-10" style={{
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        marginTop: 0,
        marginBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        overflowX: 'visible'
      }}>
        <div className="container mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 md:py-8">
          <Hero />
        </div>
      </div>
      <NFTGallery />
      <div className="relative z-10">
        <main className="container mx-auto px-3 py-4 md:px-12 md:py-8">
          <HowItWorks />
        </main>
        <Footer />
      </div>
    </div>
  )
}
