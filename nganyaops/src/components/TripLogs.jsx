import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function findAssignedCrew(crewList, plate) {
  if (!plate) return { driver: '', conductor: '' }
  const assignedDriver = crewList.find(
    (c) => c.assigned_plate === plate && c.role === 'Driver'
  )
  const assignedConductor = crewList.find(
    (c) => c.assigned_plate === plate && c.role === 'Conductor'
  )
  return {
    driver: assignedDriver ? assignedDriver.full_name : '',
    conductor: assignedConductor ? assignedConductor.full_name : '',
  }
}

function TripLogs() {
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [crewList, setCrewList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [plateNumber, setPlateNumber] = useState('')
  const [driverName, setDriverName] = useState('')
  const [conductorName, setConductorName] = useState('')
  const [tripDate, setTripDate] = useState(() => new Date().toISOString().split('T')[0])
  const [tripsCount, setTripsCount] = useState('')
  const [grossRevenue, setGrossRevenue] = useState('')
  const [cashCollected, setCashCollected] = useState('')
  const [mpesaCollected, setMpesaCollected] = useState('')
  const [fuelCost, setFuelCost] = useState('')
  const [crewAllowance, setCrewAllowance] = useState('')
  const [otherExpenses, setOtherExpenses] = useState('')

  const [filterPlate, setFilterPlate] = useState('All')
  const [filterDate, setFilterDate] = useState('')

  async function fetchLogs() {
    const { data, error } = await supabase
      .from('trip_logs')
      .select('*')
      .order('trip_date', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      setErrorMsg('Failed to load shift logs: ' + error.message)
      return
    }
    if (data) {
      setLogs(data)
    }
  }

  useEffect(() => {
    let active = true

    async function loadTripData() {
      const [logsRes, vehiclesRes, crewRes] = await Promise.all([
        supabase
          .from('trip_logs')
          .select('*')
          .order('trip_date', { ascending: false })
          .order('id', { ascending: false }),
        supabase
          .from('vehicles')
          .select('plate_number, status')
          .eq('status', 'Active')
          .order('plate_number', { ascending: true }),
        supabase
          .from('crew')
          .select('id, full_name, role, assigned_plate')
          .order('full_name', { ascending: true }),
      ])

      if (!active) return

      if (logsRes.error || vehiclesRes.error || crewRes.error) {
        setErrorMsg('Failed to load trip logs. Please try refreshing.')
      } else {
        setErrorMsg('')
      }

      if (logsRes.data) {
        setLogs(logsRes.data)
      }

      const loadedVehicles = vehiclesRes.data || []
      const loadedCrew = crewRes.data || []
      setVehicles(loadedVehicles)
      setCrewList(loadedCrew)

      if (loadedVehicles.length > 0) {
        const defaultPlate = loadedVehicles[0].plate_number
        setPlateNumber(defaultPlate)
        const assigned = findAssignedCrew(loadedCrew, defaultPlate)
        setDriverName(assigned.driver)
        setConductorName(assigned.conductor)
      }

      setLoading(false)
    }

    loadTripData()

    return () => {
      active = false
    }
  }, [])

  function handlePlateChange(nextPlate) {
    setPlateNumber(nextPlate)
    const assigned = findAssignedCrew(crewList, nextPlate)
    setDriverName(assigned.driver)
    setConductorName(assigned.conductor)
  }

  async function handleAddLog(e) {
    e.preventDefault()
    if (!plateNumber || !tripDate || !tripsCount || !grossRevenue) return
    setErrorMsg('')

    const gross = Number(grossRevenue)
    const hasSplit = cashCollected !== '' || mpesaCollected !== ''
    const cash = hasSplit ? Number(cashCollected || 0) : gross
    const mpesa = hasSplit ? Number(mpesaCollected || 0) : 0

    const { error } = await supabase.from('trip_logs').insert([
      {
        plate_number: plateNumber,
        driver_name: driverName || null,
        conductor_name: conductorName || null,
        trip_date: tripDate,
        trips_count: Number(tripsCount),
        gross_revenue: gross,
        cash_collected: cash,
        mpesa_collected: mpesa,
        fuel_cost: Number(fuelCost || 0),
        crew_allowance: Number(crewAllowance || 0),
        other_expenses: Number(otherExpenses || 0),
      },
    ])

    if (error) {
      setErrorMsg('Error saving shift log: ' + error.message)
      return
    }

    setTripsCount('')
    setGrossRevenue('')
    setCashCollected('')
    setMpesaCollected('')
    setFuelCost('')
    setCrewAllowance('')
    setOtherExpenses('')
    fetchLogs()
  }

  async function handleDeleteLog(id, plate, date) {
    const confirmed = window.confirm(`Delete shift log for ${plate} on ${date}?`)
    if (!confirmed) return
    setErrorMsg('')

    const { error } = await supabase.from('trip_logs').delete().eq('id', id)

    if (error) {
      setErrorMsg('Failed to delete shift log: ' + error.message)
      return
    }
    fetchLogs()
  }

  const drivers = crewList.filter((c) => c.role === 'Driver')
  const conductors = crewList.filter((c) => c.role === 'Conductor')

  const loggedPlates = [...new Set(logs.map((log) => log.plate_number))]

  const filteredLogs = logs.filter((log) => {
    const matchesPlate = filterPlate === 'All' || log.plate_number === filterPlate
    const matchesDate = !filterDate || log.trip_date === filterDate
    return matchesPlate && matchesDate
  })

  const totalCash = filteredLogs.reduce((sum, l) => sum + Number(l.cash_collected || 0), 0)
  const totalMpesa = filteredLogs.reduce((sum, l) => sum + Number(l.mpesa_collected || 0), 0)

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div role="alert" className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleAddLog} className="bg-white p-4 border border-gray-300">
        <h2 className="font-bold text-gray-900 mb-3">Log Daily Trip, Revenue & Expenses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <select
            aria-label="Matatu Plate"
            value={plateNumber}
            onChange={(e) => handlePlateChange(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm bg-white"
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
            aria-label="Trip Date"
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
            required
          />
          <input
            type="number"
            min="1"
            aria-label="Trips Completed"
            placeholder="Trips Completed (e.g. 6)"
            value={tripsCount}
            onChange={(e) => setTripsCount(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
            required
          />
          <input
            type="number"
            min="0"
            aria-label="Gross Collection (KES)"
            placeholder="Gross Collection (KES)"
            value={grossRevenue}
            onChange={(e) => setGrossRevenue(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <select
            aria-label="Shift Driver"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm bg-white"
          >
            <option value="">Driver (Auto / Unassigned)</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.full_name}>
                Driver: {d.full_name}
              </option>
            ))}
          </select>

          <select
            aria-label="Shift Conductor"
            value={conductorName}
            onChange={(e) => setConductorName(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm bg-white"
          >
            <option value="">Conductor (Auto / Unassigned)</option>
            {conductors.map((c) => (
              <option key={c.id} value={c.full_name}>
                Conductor: {c.full_name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            aria-label="Cash Collected (KES)"
            placeholder="Cash Collected (KES)"
            value={cashCollected}
            onChange={(e) => setCashCollected(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
          />

          <input
            type="number"
            min="0"
            aria-label="M-Pesa Till or PoChi (KES)"
            placeholder="M-Pesa Till / PoChi (KES)"
            value={mpesaCollected}
            onChange={(e) => setMpesaCollected(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <input
            type="number"
            min="0"
            aria-label="Fuel Cost (KES)"
            placeholder="Fuel Cost (KES)"
            value={fuelCost}
            onChange={(e) => setFuelCost(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
          />
          <input
            type="number"
            min="0"
            aria-label="Crew Allowance (KES)"
            placeholder="Crew Allowance (KES)"
            value={crewAllowance}
            onChange={(e) => setCrewAllowance(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
          />
          <input
            type="number"
            min="0"
            aria-label="Stage or Other Expenses (KES)"
            placeholder="Stage / Other Expenses (KES)"
            value={otherExpenses}
            onChange={(e) => setOtherExpenses(e.target.value)}
            className="w-full min-w-0 sm:col-span-2 md:col-span-1 border border-gray-300 px-3 py-2 text-base sm:text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={vehicles.length === 0}
          className="w-full sm:w-auto mt-3 bg-gray-900 text-white px-4 py-2.5 sm:py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          Save Shift Log
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-3 border border-gray-300 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-gray-500">Total Cash Remitted</span>
          <span className="font-mono font-bold text-gray-900">
            KES {totalCash.toLocaleString()}
          </span>
        </div>
        <div className="bg-white p-3 border border-gray-300 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-green-700">
            Total M-Pesa Till / PoChi
          </span>
          <span className="font-mono font-bold text-green-700">
            KES {totalMpesa.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-white p-3 border border-gray-300 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            aria-label="Filter by Matatu"
            value={filterPlate}
            onChange={(e) => setFilterPlate(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 px-3 py-2 text-base sm:text-sm bg-white"
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
            aria-label="Filter by Date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full sm:w-auto min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
          />
        </div>

        {(filterPlate !== 'All' || filterDate) && (
          <button
            type="button"
            onClick={() => {
              setFilterPlate('All')
              setFilterDate('')
            }}
            className="self-start sm:self-auto text-xs underline text-gray-700 hover:text-gray-900 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-300 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm responsive-table">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="p-3 font-semibold whitespace-nowrap">Date</th>
              <th className="p-3 font-semibold whitespace-nowrap">Matatu & Crew</th>
              <th className="p-3 font-semibold whitespace-nowrap">Trips</th>
              <th className="p-3 font-semibold whitespace-nowrap">Gross</th>
              <th className="p-3 font-semibold whitespace-nowrap">Cash / M-Pesa</th>
              <th className="p-3 font-semibold whitespace-nowrap">Expenses</th>
              <th className="p-3 font-semibold whitespace-nowrap">Net Profit</th>
              <th className="p-3 font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="p-4 text-gray-500 text-center">
                  Loading shift logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-4 text-gray-500 text-center">
                  No matching trip logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const gross = Number(log.gross_revenue || 0)
                const cash = Number(log.cash_collected || 0)
                const mpesa = Number(log.mpesa_collected || 0)
                const splitTotal = cash + mpesa
                const hasMismatch = splitTotal > 0 && splitTotal !== gross
                const fuel = Number(log.fuel_cost || 0)
                const otherTotal = Number(log.crew_allowance || 0) + Number(log.other_expenses || 0)
                const totalExpenses = fuel + otherTotal
                const net = gross - totalExpenses

                return (
                  <tr key={log.id} className="border-b border-gray-200">
                    <td data-label="Date" className="p-3 font-mono md:whitespace-nowrap">
                      {log.trip_date}
                    </td>
                    <td data-label="Matatu & Crew" className="p-3">
                      <div className="font-mono font-semibold">{log.plate_number}</div>
                      {(log.driver_name || log.conductor_name) && (
                        <div className="text-xs text-gray-600 mt-0.5">
                          {log.driver_name ? `D: ${log.driver_name}` : ''}
                          {log.driver_name && log.conductor_name ? ' | ' : ''}
                          {log.conductor_name ? `C: ${log.conductor_name}` : ''}
                        </div>
                      )}
                    </td>
                    <td data-label="Trips" className="p-3 md:whitespace-nowrap">
                      {log.trips_count}
                    </td>
                    <td data-label="Gross" className="p-3 font-mono md:whitespace-nowrap">
                      KES {gross.toLocaleString()}
                    </td>
                    <td data-label="Cash / M-Pesa" className="p-3 font-mono text-xs md:whitespace-nowrap">
                      <div>Cash: {cash.toLocaleString()}</div>
                      <div className="text-green-700 font-semibold">
                        M-Pesa: {mpesa.toLocaleString()}
                      </div>
                      {hasMismatch && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-900 font-sans font-semibold">
                          Split diff: KES {(gross - splitTotal).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td data-label="Expenses" className="p-3 font-mono text-gray-700 md:whitespace-nowrap">
                      KES {totalExpenses.toLocaleString()}
                    </td>
                    <td
                      data-label="Net Profit"
                      className={`p-3 font-mono font-semibold md:whitespace-nowrap ${
                        net >= 0 ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      KES {net.toLocaleString()}
                    </td>
                    <td data-label="Actions" className="p-3 md:whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id, log.plate_number, log.trip_date)}
                        className="text-xs underline text-red-600 hover:text-red-800 py-1"
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
