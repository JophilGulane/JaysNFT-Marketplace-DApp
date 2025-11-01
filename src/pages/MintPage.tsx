import MintForm from '../features/MintForm'
import ParticleBackground from '../components/ParticleBackground'

export default function MintPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <ParticleBackground id="tsparticles-mint" />
      <div className="relative z-10 max-w-6xl mx-auto px-3 py-4 md:px-6 md:py-8">
        <MintForm />
      </div>
    </div>
  )
}
