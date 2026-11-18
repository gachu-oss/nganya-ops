import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function FleetList() {
  const [vehicles, setVehicles] = useState([])
  const [plateNumber, setPlateNumber] = useState('')
  const [nickname, setNickname] = useState('')
  const [route, setRoute] = useState('')
  const [dailyTarget, setDailyTarget] = useState('')

  useEffect(() => {
    fetchVehicles()
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

  async function handleAddVehicle(e) {
    e.preventDefault()
    if (!plateNumber || !route || !dailyTarget) return

    const { error } = await supabase.from('vehicles').insert([
      {
        plate_number: plateNumber.toUpperCase(),
        nickname: nickname || '-',
        route,
        daily_target: Number(dailyTarget),
        status: 'Active',
      },
    ])

    if (!error) {
      setPlateNumber('')
      setNickname('')
      setRoute('')
      setDailyTarget('')
      fetchVehicles()
    }
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddVehicle} className="bg-white p-4 border border-gray-300">
        <h2 className="font-bold text-gray-900 mb-3">Add Matatu to Fleet</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Plate (e.g. KDG 412X)"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Nickname (Optional)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Route (e.g. CBD - Kikuyu)"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            placeholder="Daily Target (KES)"
            value={dailyTarget}
            onChange={(e) => setDailyTarget(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="mt-3 bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
        >
          Save Vehicle
        </button>
      </form>

      <div className="bg-white border border-gray-300 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="p-3 font-semibold">Plate</th>
              <th className="p-3 font-semibold">Nickname</th>
              <th className="p-3 font-semibold">Route</th>
              <th className="p-3 font-semibold">Daily Target</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-gray-500 text-center">
                  No vehicles added yet.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} className="border-b border-gray-200">
                  <td className="p-3 font-mono font-semibold">{v.plate_number}</td>
                  <td className="p-3">{v.nickname}</td>
                  <td className="p-3">{v.route}</td>
                  <td className="p-3 font-mono">KES {Number(v.daily_target).toLocaleString()}</td>
                  <td className="p-3">
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
                  <td className="p-3 space-x-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(v)}
                      className="text-xs underline text-gray-700 hover:text-gray-900"
                    >
                      Set {v.status === 'Active' ? 'Garage' : 'Active'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(v.id, v.plate_number)}
                      className="text-xs underline text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
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

export default FleetList