import ActivityFeed from '../features/ActivityFeed'
import ParticleBackground from '../components/ParticleBackground'

export default function ActivityPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <ParticleBackground id="tsparticles-activity" />
      <div className="relative z-10 container mx-auto px-3 py-4 md:px-12 md:py-8">
        <ActivityFeed />
      </div>
    </div>
  )
}

