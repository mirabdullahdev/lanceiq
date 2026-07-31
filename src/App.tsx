import { Nav } from './components/layout/Nav'
import { Footer } from './components/layout/Footer'
import { Hero } from './components/sections/Hero'
import { Problem } from './components/sections/Problem'
import { HowItWorks } from './components/sections/HowItWorks'
import { Features } from './components/sections/Features'
import { Trust } from './components/sections/Trust'
import { Waitlist } from './components/sections/Waitlist'
import { BurnChip } from './components/ui/BurnChip'

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-full bg-mint px-5 py-3 text-sm font-medium text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
      >
        Skip to content
      </a>

      <Nav />

      <main id="main">
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Trust />
        <Waitlist />
      </main>

      <Footer />
      <BurnChip />
    </>
  )
}
