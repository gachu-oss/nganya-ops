import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function TripLogs() {
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [plateNumber, setPlateNumber] = useState('')
  const [tripDate, setTripDate] = useState(() => new Date().toISOString().split('T')[0])
  const [tripsCount, setTripsCount] = useState('')
  const [grossRevenue, setGrossRevenue] = useState('')
  const [fuelCost, setFuelCost] = useState('')
  const [crewAllowance, setCrewAllowance] = useState('')
  const [otherExpenses, setOtherExpenses] = useState('')

  const [filterPlate, setFilterPlate] = useState('All')
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    fetchLogs()
    fetchActiveVehicles()
  }, [])

  async function fetchLogs() {
    const { data, error } = await supabase
      .from('trip_logs')
      .select('*')
      .order('trip_date', { ascending: false })
      .order('id', { ascending: false })

    if (!error && data) {
      setLogs(data)
    }
  }

  async function fetchActiveVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('plate_number, status')
      .eq('status', 'Active')
      .order('plate_number', { ascending: true })

    if (!error && data) {
      setVehicles(data)
      if (data.length > 0 && !plateNumber) {
        setPlateNumber(data[0].plate_number)
      }
    }
  }

  async function handleAddLog(e) {
    e.preventDefault()
    if (!plateNumber || !tripDate || !tripsCount || !grossRevenue) return

    const { error } = await supabase.from('trip_logs').insert([
      {
        plate_number: plateNumber,
        trip_date: tripDate,
        trips_count: Number(tripsCount),
        gross_revenue: Number(grossRevenue),
        fuel_cost: Number(fuelCost || 0),
        crew_allowance: Number(crewAllowance || 0),
        other_expenses: Number(otherExpenses || 0),
      },
    ])

    if (!error) {
      setTripsCount('')
      setGrossRevenue('')
      setFuelCost('')
      setCrewAllowance('')
      setOtherExpenses('')
      fetchLogs()
    }
  }

  async function handleDeleteLog(id, plate, date) {
    const confirmed = window.confirm(`Delete shift log for ${plate} on ${date}?`)
    if (!confirmed) return

    const { error } = await supabase.from('trip_logs').delete().eq('id', id)

    if (!error) {
      fetchLogs()
    }
  }

  const loggedPlates = [...new Set(logs.map((log) => log.plate_number))]

  const filteredLogs = logs.filter((log) => {
    const matchesPlate = filterPlate === 'All' || log.plate_number === filterPlate
    const matchesDate = !filterDate || log.trip_date === filterDate
    return matchesPlate && matchesDate
  })

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddLog} className="bg-white p-4 border border-gray-300">
        <h2 className="font-bold text-gray-900 mb-3">Log Daily Trip, Revenue & Expenses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
          <select
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm bg-white"
            required
          >
            {vehicles.length === 0 ? (
              <option value="">No active vehicles</option>
            ) : (
              vehicles.map((v) => (
                <option key={v.plate_number} value={v.plate_number}>
                  {v.plate_number}
                </option>
              ))
            )}
          </select>
          <input
            type="date"
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            min="1"
            placeholder="Trips Completed (e.g. 6)"
            value={tripsCount}
            onChange={(e) => setTripsCount(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Gross Collection (KES)"
            value={grossRevenue}
            onChange={(e) => setGrossRevenue(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="number"
            min="0"
            placeholder="Fuel Cost (KES)"
            value={fuelCost}
            onChange={(e) => setFuelCost(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Crew Allowance (KES)"
            value={crewAllowance}
            onChange={(e) => setCrewAllowance(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Stage / Other Expenses (KES)"
            value={otherExpenses}
            onChange={(e) => setOtherExpenses(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={vehicles.length === 0}
          className="mt-3 bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          Save Shift Log
        </button>
      </form>

      <div className="bg-white p-3 border border-gray-300 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={filterPlate}
            onChange={(e) => setFilterPlate(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="All">All Matatus</option>
            {loggedPlates.map((plate) => (
              <option key={plate} value={plate}>
                {plate}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {(filterPlate !== 'All' || filterDate) && (
          <button
            type="button"
            onClick={() => {
              setFilterPlate('All')
              setFilterDate('')
            }}
            className="text-xs underline text-gray-700 hover:text-gray-900"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-300 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Matatu</th>
              <th className="p-3 font-semibold">Trips</th>
              <th className="p-3 font-semibold">Gross</th>
              <th className="p-3 font-semibold">Fuel</th>
              <th className="p-3 font-semibold">Crew & Other</th>
              <th className="p-3 font-semibold">Net Profit</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-4 text-gray-500 text-center">
                  No matching trip logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const fuel = Number(log.fuel_cost || 0)
                const otherTotal = Number(log.crew_allowance || 0) + Number(log.other_expenses || 0)
                const net = Number(log.gross_revenue) - fuel - otherTotal

                return (
                  <tr key={log.id} className="border-b border-gray-200">
                    <td className="p-3 font-mono">{log.trip_date}</td>
                    <td className="p-3 font-mono font-semibold">{log.plate_number}</td>
                    <td className="p-3">{log.trips_count}</td>
                    <td className="p-3 font-mono">
                      KES {Number(log.gross_revenue).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-gray-700">
                      KES {fuel.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-gray-700">
                      KES {otherTotal.toLocaleString()}
                    </td>
                    <td
                      className={`p-3 font-mono font-semibold ${
                        net >= 0 ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      KES {net.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id, log.plate_number, log.trip_date)}
                        className="text-xs underline text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TripLogs
