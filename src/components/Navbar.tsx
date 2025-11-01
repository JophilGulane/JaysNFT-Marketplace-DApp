import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import WalletBar from './WalletBar'

const navItems = [
  { path: '/', label: 'Home', icon: (
    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { path: '/mint', label: 'Mint', icon: (
    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )},
  { path: '/nfts', label: 'My NFTs', icon: (
    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )},
  { path: '/market', label: 'Marketplace', icon: (
    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )},
  { path: '/admin', label: 'Admin', icon: (
    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
]

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm md:text-base font-medium transition-all duration-300 ${
      isActive
        ? 'text-white bg-gradient-to-r from-indigo-600/90 to-purple-600/90 shadow-lg shadow-indigo-500/30 scale-105'
        : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20 hover:scale-105'
    }`

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-b from-black/60 via-black/50 to-black/40 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50">
      {/* Animated gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-75"></div>
      
      <div className="container mx-auto px-3 py-2 md:px-12 md:py-3 flex items-center justify-between">
        {/* Logo with animation */}
        <Link
          to="/"
          className="group relative text-lg md:text-xl font-extrabold text-white tracking-wider transition-transform duration-300 hover:scale-105"
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="relative z-10 inline-block">
            Jays<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">NFT</span>
          </span>
          <span className="absolute inset-0 blur-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30 group-hover:opacity-50 transition-opacity duration-300"></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={linkClass}
              end={item.path === '/'}
            >
              <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                {item.icon}
              </span>
              <span className="relative">
                {item.label}
                {item.path === '/' && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                )}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center">
            <WalletBar />
          </div>
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative text-white focus:outline-none p-2 hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20 rounded-lg transition-all duration-300 group"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu with Animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-gradient-to-b from-black/95 via-black/90 to-black/95 backdrop-blur-xl border-t border-white/10 shadow-2xl">
          <nav className="container mx-auto px-3 py-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-indigo-600/90 to-purple-600/90 shadow-lg shadow-indigo-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20'
                  }`
                }
                end={item.path === '/'}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
            <div className="pt-3 mt-3 border-t border-white/10">
              <WalletBar />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
