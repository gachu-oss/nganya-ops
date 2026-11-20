import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { getExpiryStatus } from '../utils/compliance'

function badgeClasses(tone) {
  if (tone === 'danger') return 'bg-red-100 text-red-800'
  if (tone === 'warning') return 'bg-amber-100 text-amber-800'
  if (tone === 'valid') return 'bg-green-100 text-green-800'
  return 'bg-gray-100 text-gray-600'
}

function FleetList() {
  const [vehicles, setVehicles] = useState([])
  const [todayNetByPlate, setTodayNetByPlate] = useState({})
  const [plateNumber, setPlateNumber] = useState('')
  const [nickname, setNickname] = useState('')
  const [route, setRoute] = useState('')
  const [dailyTarget, setDailyTarget] = useState('')
  const [insuranceExpiry, setInsuranceExpiry] = useState('')
  const [ntsaExpiry, setNtsaExpiry] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    fetchVehicles()
    fetchTodayPerformance()
  }, [])

  async function fetchVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('id', { ascending: false })

    if (!error && data) {
      setVehicles(data)
    }
  }

  async function fetchTodayPerformance() {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('trip_logs')
      .select('plate_number, gross_revenue, fuel_cost, crew_allowance, other_expenses')
      .eq('trip_date', today)

    if (!error && data) {
      const totals = {}
      data.forEach((log) => {
        const net =
          Number(log.gross_revenue || 0) -
          Number(log.fuel_cost || 0) -
          Number(log.crew_allowance || 0) -
          Number(log.other_expenses || 0)
        totals[log.plate_number] = (totals[log.plate_number] || 0) + net
      })
      setTodayNetByPlate(totals)
    }
  }

  async function handleAddVehicle(e) {
    e.preventDefault()
    if (!plateNumber || !route || !dailyTarget) return

    const newVehicle = {
      plate_number: plateNumber.toUpperCase(),
      nickname: nickname || '-',
      route,
      daily_target: Number(dailyTarget),
      status: 'Active',
    }

    if (insuranceExpiry) newVehicle.insurance_expiry = insuranceExpiry
    if (ntsaExpiry) newVehicle.ntsa_inspection_expiry = ntsaExpiry

    const { error } = await supabase.from('vehicles').insert([newVehicle])

    if (error) {
      alert('Error saving vehicle: ' + error.message)
      return
    }

    setPlateNumber('')
    setNickname('')
    setRoute('')
    setDailyTarget('')
    setInsuranceExpiry('')
    setNtsaExpiry('')
    fetchVehicles()
  }

  async function toggleStatus(vehicle) {
    const nextStatus = vehicle.status === 'Active' ? 'Garage' : 'Active'
    const { error } = await supabase
      .from('vehicles')
      .update({ status: nextStatus })
      .eq('id', vehicle.id)

    if (!error) {
      fetchVehicles()
    }
  }

  async function handleDeleteVehicle(id, plate) {
    const confirmed = window.confirm(`Remove ${plate} from the fleet?`)
    if (!confirmed) return

    const { error } = await supabase.from('vehicles').delete().eq('id', id)

    if (!error) {
      fetchVehicles()
    }
  }

  const filteredVehicles = vehicles.filter((v) => {
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter
    const query = searchTerm.toLowerCase()
    const matchesSearch =
      v.plate_number.toLowerCase().includes(query) ||
      v.nickname.toLowerCase().includes(query) ||
      v.route.toLowerCase().includes(query)

    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddVehicle} className="bg-white p-4 border border-gray-300">
        <h2 className="font-bold text-gray-900 mb-3">Add Matatu to Fleet</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Plate (e.g. KDG 412X)"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
            required
          />
          <input
            type="text"
            placeholder="Nickname (Optional)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
          />
          <input
            type="text"
            placeholder="Route (e.g. CBD - Kikuyu)"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
            required
          />
          <input
            type="number"
            placeholder="Daily Target (KES)"
            value={dailyTarget}
            onChange={(e) => setDailyTarget(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label htmlFor="insurance-expiry" className="block text-xs text-gray-600 mb-1">
              Insurance Expiry Date (Optional)
            </label>
            <input
              id="insurance-expiry"
              type="date"
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
              className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm bg-white"
            />
          </div>
          <div>
            <label htmlFor="ntsa-expiry" className="block text-xs text-gray-600 mb-1">
              NTSA Inspection Expiry Date (Optional)
            </label>
            <input
              id="ntsa-expiry"
              type="date"
              value={ntsaExpiry}
              onChange={(e) => setNtsaExpiry(e.target.value)}
              className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto mt-3 bg-gray-900 text-white px-4 py-2.5 sm:py-2 text-sm font-medium hover:bg-gray-800"
        >
          Save Vehicle
        </button>
      </form>

      <div className="bg-white p-3 border border-gray-300 flex flex-col sm:flex-row gap-3 justify-between">
        <input
          type="text"
          placeholder="Search by plate, nickname, or route..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm sm:flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 px-3 py-2 text-base sm:text-sm bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Garage">In Garage</option>
        </select>
      </div>

      <div className="bg-white border border-gray-300 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm responsive-table">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="p-3 font-semibold whitespace-nowrap">Plate</th>
              <th className="p-3 font-semibold whitespace-nowrap">Nickname</th>
              <th className="p-3 font-semibold whitespace-nowrap">Route</th>
              <th className="p-3 font-semibold whitespace-nowrap">Daily Target</th>
              <th className="p-3 font-semibold whitespace-nowrap">Compliance</th>
              <th className="p-3 font-semibold whitespace-nowrap">Today&apos;s Target Check</th>
              <th className="p-3 font-semibold whitespace-nowrap">Status</th>
              <th className="p-3 font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-4 text-gray-500 text-center">
                  No matching vehicles found.
                </td>
              </tr>
            ) : (
              filteredVehicles.map((v) => {
                const hasLogsToday = Object.prototype.hasOwnProperty.call(
                  todayNetByPlate,
                  v.plate_number
                )
                const todayNet = todayNetByPlate[v.plate_number] || 0
                const target = Number(v.daily_target || 0)
                const hitTarget = todayNet >= target
                const insStatus = getExpiryStatus(v.insurance_expiry)
                const ntsaStatus = getExpiryStatus(v.ntsa_inspection_expiry)

                return (
                  <tr key={v.id} className="border-b border-gray-200">
                    <td data-label="Plate" className="p-3 font-mono font-semibold md:whitespace-nowrap">
                      {v.plate_number}
                    </td>
                    <td data-label="Nickname" className="p-3">
                      {v.nickname}
                    </td>
                    <td data-label="Route" className="p-3">
                      {v.route}
                    </td>
                    <td data-label="Daily Target" className="p-3 font-mono md:whitespace-nowrap">
                      KES {target.toLocaleString()}
                    </td>
                    <td data-label="Compliance" className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 w-fit ${badgeClasses(insStatus.tone)}`}>
                          Ins: {insStatus.label}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 w-fit ${badgeClasses(ntsaStatus.tone)}`}>
                          NTSA: {ntsaStatus.label}
                        </span>
                      </div>
                    </td>
                    <td data-label="Today's Target" className="p-3 md:whitespace-nowrap">
                      {!hasLogsToday ? (
                        <span className="text-xs text-gray-500">No logs today</span>
                      ) : hitTarget ? (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-800">
                          Target Hit (KES {todayNet.toLocaleString()})
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-800">
                          Shortfall (KES {todayNet.toLocaleString()})
                        </span>
                      )}
                    </td>
                    <td data-label="Status" className="p-3 md:whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 ${
                          v.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td data-label="Actions" className="p-3 md:whitespace-nowrap">
                      <div className="flex items-center justify-end md:justify-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleStatus(v)}
                          className="text-xs underline text-gray-700 hover:text-gray-900 py-1"
                        >
                          Set {v.status === 'Active' ? 'Garage' : 'Active'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVehicle(v.id, v.plate_number)}
                          className="text-xs underline text-red-600 hover:text-red-800 py-1"
                        >
                          Delete
                        </button>
                      </div>
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

export default FleetList
