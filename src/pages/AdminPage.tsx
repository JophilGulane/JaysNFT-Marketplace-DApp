import AdminPanel from '../features/AdminPanel'
import ParticleBackground from '../components/ParticleBackground'

export default function AdminPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <ParticleBackground id="tsparticles-admin" />
      <div className="relative z-10 container mx-auto px-3 py-4 md:px-12 md:py-8">
        <AdminPanel />
      </div>
    </div>
  )
}
