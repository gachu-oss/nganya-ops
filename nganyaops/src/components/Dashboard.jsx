import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function Dashboard() {
  const [stats, setStats] = useState({
    activeVehicles: 0,
    garageVehicles: 0,
    totalGross: 0,
    tripExpenses: 0,
    garageExpenses: 0,
    netProfit: 0,
  })

  useEffect(() => {
    loadSummary()
  }, [])

  async function loadSummary() {
    const [vehiclesRes, tripsRes, maintRes] = await Promise.all([
      supabase.from('vehicles').select('status'),
      supabase
        .from('trip_logs')
        .select('gross_revenue, fuel_cost, crew_allowance, other_expenses'),
      supabase.from('maintenance_logs').select('cost'),
    ])

    const vehicles = vehiclesRes.data || []
    const trips = tripsRes.data || []
    const maintenance = maintRes.data || []

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
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-gray-300">
          <p className="text-xs text-gray-500 uppercase font-semibold">Active Fleet</p>
          <p className="text-2xl font-bold font-mono mt-1">{stats.activeVehicles}</p>
          <p className="text-xs text-gray-600 mt-1">{stats.garageVehicles} currently in garage</p>
        </div>

        <div className="bg-white p-4 border border-gray-300">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Gross Revenue</p>
          <p className="text-2xl font-bold font-mono mt-1">
            KES {stats.totalGross.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">All logged shifts</p>
        </div>

        <div className="bg-white p-4 border border-gray-300">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Expenses</p>
          <p className="text-2xl font-bold font-mono mt-1">
            KES {(stats.tripExpenses + stats.garageExpenses).toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Ops: {stats.tripExpenses.toLocaleString()} | Garage:{' '}
            {stats.garageExpenses.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 border border-gray-300">
          <p className="text-xs text-gray-500 uppercase font-semibold">Net Profit</p>
          <p
            className={`text-2xl font-bold font-mono mt-1 ${
              stats.netProfit >= 0 ? 'text-green-700' : 'text-red-600'
            }`}
          >
            KES {stats.netProfit.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">After fuel, crew & repairs</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
