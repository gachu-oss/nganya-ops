export default function LandingPage({ onEnterApp }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">NganyaOps</span>
          <button
            onClick={onEnterApp}
            className="bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
          >
            Login / Sign Up
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12 flex-1">
        {/* Brief System Description */}
        <div className="max-w-2xl mb-10">
          <h1 className="text-3xl font-bold mb-3">
            Simple Fleet &amp; Daily Operations Tracking for Matatus
          </h1>
          <p className="text-gray-700 leading-relaxed mb-6">
            NganyaOps replaces paper tally books with a straightforward digital ledger. 
            Keep track of your active fleet, log daily trip counts, monitor cash collections 
            against fuel costs, and see which vehicles hit their daily targets in real time.
          </p>
          <button
            onClick={onEnterApp}
            className="bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800"
          >
            Get Started
          </button>
        </div>

        {/* 3 Image Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-dashed border-gray-300 h-56 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-sm font-semibold text-gray-600">Image Placeholder 1</span>
            <span className="text-xs text-gray-400 mt-1">e.g., Fleet / Matatu exterior</span>
          </div>

          <div className="bg-white border-2 border-dashed border-gray-300 h-56 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-sm font-semibold text-gray-600">Image Placeholder 2</span>
            <span className="text-xs text-gray-400 mt-1">e.g., Route / Stage operations</span>
          </div>

          <div className="bg-white border-2 border-dashed border-gray-300 h-56 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-sm font-semibold text-gray-600">Image Placeholder 3</span>
            <span className="text-xs text-gray-400 mt-1">e.g., Daily collection ledger</span>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-300 py-4 text-center text-xs text-gray-500">
        NganyaOps Fleet Management
      </footer>
    </div>
  )
}