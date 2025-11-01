import OwnedNfts from '../features/OwnedNfts'
import ParticleBackground from '../components/ParticleBackground'

export default function MyNftsPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full">
      <ParticleBackground id="tsparticles-nfts" />
      <div className="relative z-10 mx-auto px-3 py-4 md:px-12 md:py-8 w-full" style={{ maxWidth: '1920px' }}>
        <OwnedNfts />
      </div>
    </div>
  )
}
