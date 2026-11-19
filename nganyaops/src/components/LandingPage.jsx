import matwanaBg from '../assets/matwana-bg.png'
import matatuChronicles from '../assets/matatu-chronicles.jpg'
import matatuMoxie from '../assets/matatu-moxie.jpg'
import matatuStreet from '../assets/matatu-street.jpg'

const showcaseImages = [
  { src: matatuChronicles, alt: 'Matatu Chronicles custom front exterior' },
  { src: matatuMoxie, alt: 'Moxie matatu illustration KDS 899V' },
  { src: matatuStreet, alt: 'Nganya matatu at city stage' },
]

export default function LandingPage({ onEnterApp }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <span className="font-bold text-lg tracking-tight">NganyaOps</span>
          <button
            onClick={onEnterApp}
            className="bg-gray-900 text-white px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0 hover:bg-gray-800"
          >
            Login / Sign Up
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          {/* Hero Section with Unobstructed Matwana Watermark */}
          <section className="relative overflow-hidden mb-8 sm:mb-10 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="relative z-10 max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                Simple Fleet &amp; Daily Operations Tracking for Matatus
              </h1>
              <p className="text-gray-700 leading-relaxed">
                NganyaOps replaces paper tally books with a straightforward digital ledger. 
                Keep track of your active fleet, log daily trip counts, monitor cash collections 
                against fuel costs, and see which vehicles hit their daily targets in real time.
              </p>
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 flex items-center justify-center md:static md:flex-1 md:justify-end"
            >
              <img
                src={matwanaBg}
                alt=""
                className="w-full max-w-xs sm:max-w-sm opacity-15 md:opacity-20 object-contain"
              />
            </div>
          </section>

          {/* 3 Fleet Showcase Images */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {showcaseImages.map((image) => (
              <div
                key={image.alt}
                className="bg-white border border-gray-300 overflow-hidden aspect-[3/4] w-full max-w-sm mx-auto sm:max-w-none"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-300 py-4 text-center text-xs text-gray-500">
        NganyaOps Fleet Management
      </footer>
    </div>
  )
}