import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { getExpiryStatus } from '../utils/compliance'

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [stats, setStats] = useState({
    activeVehicles: 0,
    garageVehicles: 0,
    totalGross: 0,
    tripExpenses: 0,
    garageExpenses: 0,
    netProfit: 0,
  })
  const [rankings, setRankings] = useState([])
  const [complianceAlerts, setComplianceAlerts] = useState([])

  useEffect(() => {
    loadSummary()
  }, [])

  async function loadSummary() {
    setLoading(true)
    setErrorMsg('')

    const [vehiclesRes, tripsRes, maintRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('plate_number, nickname, route, status, insurance_expiry, ntsa_inspection_expiry'),
      supabase
        .from('trip_logs')
        .select('plate_number, trips_count, gross_revenue, fuel_cost, crew_allowance, other_expenses'),
      supabase.from('maintenance_logs').select('plate_number, cost'),
    ])

    if (vehiclesRes.error || tripsRes.error || maintRes.error) {
      setErrorMsg('Failed to load operational summary. Check your connection and try again.')
      setLoading(false)
      return
    }

    const vehicles = vehiclesRes.data || []
    const trips = tripsRes.data || []
    const maintenance = maintRes.data || []

    const alerts = []
    vehicles.forEach((v) => {
      const ins = getExpiryStatus(v.insurance_expiry)
      if (ins.tone === 'danger' || ins.tone === 'warning') {
        alerts.push({
          id: `${v.plate_number}-ins`,
          plate: v.plate_number,
          docType: 'Insurance',
          status: ins,
        })
      }
      const ntsa = getExpiryStatus(v.ntsa_inspection_expiry)
      if (ntsa.tone === 'danger' || ntsa.tone === 'warning') {
        alerts.push({
          id: `${v.plate_number}-ntsa`,
          plate: v.plate_number,
          docType: 'NTSA Inspection',
          status: ntsa,
        })
      }
    })
    setComplianceAlerts(alerts)

    const activeVehicles = vehicles.filter((v) => v.status === 'Active').length
    const garageVehicles = vehicles.filter((v) => v.status === 'Garage').length

    const totalGross = trips.reduce((sum, t) => sum + Number(t.gross_revenue || 0), 0)
    const tripExpenses = trips.reduce(
      (sum, t) =>
        sum +
        Number(t.fuel_cost || 0) +
        Number(t.crew_allowance || 0) +
        Number(t.other_expenses || 0),
      0
    )
    const garageExpenses = maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0)
    const netProfit = totalGross - tripExpenses - garageExpenses

    setStats({
      activeVehicles,
      garageVehicles,
      totalGross,
      tripExpenses,
      garageExpenses,
      netProfit,
    })

    const rankedVehicles = vehicles
      .map((v) => {
        const vehicleTrips = trips.filter((t) => t.plate_number === v.plate_number)
        const vehicleMaint = maintenance.filter((m) => m.plate_number === v.plate_number)

        const totalTrips = vehicleTrips.reduce((sum, t) => sum + Number(t.trips_count || 0), 0)
        const gross = vehicleTrips.reduce((sum, t) => sum + Number(t.gross_revenue || 0), 0)
        const opsCost = vehicleTrips.reduce(
          (sum, t) =>
            sum +
            Number(t.fuel_cost || 0) +
            Number(t.crew_allowance || 0) +
            Number(t.other_expenses || 0),
          0
        )
        const repairCost = vehicleMaint.reduce((sum, m) => sum + Number(m.cost || 0), 0)
        const net = gross - opsCost - repairCost

        return {
          ...v,
          totalTrips,
          gross,
          opsCost,
          repairCost,
          net,
        }
      })
      .sort((a, b) => b.net - a.net)

    setRankings(rankedVehicles)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-bold text-gray-900 text-base">Operational Overview</h1>
        <button
          type="button"
          onClick={loadSummary}
          disabled={loading}
          className="text-xs border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 text-sm">
          {errorMsg}
        </div>
      )}

      {!loading && complianceAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-4 space-y-2">
          <h2 className="text-sm font-bold text-amber-900">
            Compliance & Renewal Alerts ({complianceAlerts.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {complianceAlerts.map((item) => (
              <span
                key={item.id}
                className={`text-xs font-semibold px-2.5 py-1 ${
                  item.status.tone === 'danger'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {item.plate} — {item.docType}: {item.status.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-gray-300">
          <p className="text-xs text-gray-500 uppercase font-semibold">Active Fleet</p>
          <p className="text-xl sm:text-2xl font-bold font-mono mt-1 break-words">
            {loading ? '...' : stats.activeVehicles}
          </p>
          <p className="text-xs text-gray-600 mt-1">{stats.garageVehicles} currently in garage</p>
        </div>

        <div className="bg-white p-4 border border-gray-300">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Gross Revenue</p>
          <p className="text-xl sm:text-2xl font-bold font-mono mt-1 break-words">
            {loading ? '...' : `KES ${stats.totalGross.toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-600 mt-1">All logged shifts</p>
        </div>

        <div className="bg-white p-4 border border-gray-300">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Expenses</p>
          <p className="text-xl sm:text-2xl font-bold font-mono mt-1 break-words">
            {loading ? '...' : `KES ${(stats.tripExpenses + stats.garageExpenses).toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Ops: {stats.tripExpenses.toLocaleString()} | Garage:{' '}
            {stats.garageExpenses.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 border border-gray-300">
          <p className="text-xs text-gray-500 uppercase font-semibold">Net Profit</p>
          <p
            className={`text-xl sm:text-2xl font-bold font-mono mt-1 break-words ${
              stats.netProfit >= 0 ? 'text-green-700' : 'text-red-600'
            }`}
          >
            {loading ? '...' : `KES ${stats.netProfit.toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-600 mt-1">After fuel, crew & repairs</p>
        </div>
      </div>

      <div className="bg-white border border-gray-300 overflow-x-auto">
        <div className="p-4 border-b border-gray-300">
          <h2 className="font-bold text-gray-900">Matatu Profitability Ranking</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Ranked by total net profit after shift expenses and garage repairs
          </p>
        </div>
        <table className="w-full text-left border-collapse text-sm responsive-table">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="p-3 font-semibold whitespace-nowrap">Rank</th>
              <th className="p-3 font-semibold whitespace-nowrap">Matatu</th>
              <th className="p-3 font-semibold whitespace-nowrap">Route</th>
              <th className="p-3 font-semibold whitespace-nowrap">Trips</th>
              <th className="p-3 font-semibold whitespace-nowrap">Gross</th>
              <th className="p-3 font-semibold whitespace-nowrap">Shift Ops</th>
              <th className="p-3 font-semibold whitespace-nowrap">Garage</th>
              <th className="p-3 font-semibold whitespace-nowrap">Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="p-4 text-gray-500 text-center">
                  Loading profitability ranking...
                </td>
              </tr>
            ) : rankings.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-4 text-gray-500 text-center">
                  Add vehicles and shift logs to see profitability rankings.
                </td>
              </tr>
            ) : (
              rankings.map((v, idx) => (
                <tr key={v.plate_number} className="border-b border-gray-200">
                  <td data-label="Rank" className="p-3 font-mono font-semibold md:whitespace-nowrap">
                    #{idx + 1}
                  </td>
                  <td data-label="Matatu" className="p-3 md:whitespace-nowrap">
                    <div>
                      <span className="font-mono font-semibold">{v.plate_number}</span>
                      {v.nickname && v.nickname !== '-' && (
                        <span className="text-xs text-gray-600 ml-2">({v.nickname})</span>
                      )}
                    </div>
                  </td>
                  <td data-label="Route" className="p-3">
                    {v.route}
                  </td>
                  <td data-label="Trips" className="p-3 font-mono md:whitespace-nowrap">
                    {v.totalTrips}
                  </td>
                  <td data-label="Gross" className="p-3 font-mono md:whitespace-nowrap">
                    KES {v.gross.toLocaleString()}
                  </td>
                  <td data-label="Shift Ops" className="p-3 font-mono text-gray-700 md:whitespace-nowrap">
                    KES {v.opsCost.toLocaleString()}
                  </td>
                  <td data-label="Garage" className="p-3 font-mono text-gray-700 md:whitespace-nowrap">
                    KES {v.repairCost.toLocaleString()}
                  </td>
                  <td
                    data-label="Net Profit"
                    className={`p-3 font-mono font-semibold md:whitespace-nowrap ${
                      v.net >= 0 ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    KES {v.net.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard
