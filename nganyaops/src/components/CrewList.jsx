import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function CrewList() {
  const [crew, setCrew] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('Driver')
  const [phone, setPhone] = useState('')
  const [assignedPlate, setAssignedPlate] = useState('')

  useEffect(() => {
    fetchCrew()
    fetchVehicles()
  }, [])

  async function fetchCrew() {
    const { data, error } = await supabase
      .from('crew')
      .select('*')
      .order('id', { ascending: false })

    if (!error && data) {
      setCrew(data)
    }
  }

  async function fetchVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('plate_number')
      .order('plate_number', { ascending: true })

    if (!error && data) {
      setVehicles(data)
      if (data.length > 0 && !assignedPlate) {
        setAssignedPlate(data[0].plate_number)
      }
    }
  }

  async function handleAddCrew(e) {
    e.preventDefault()
    if (!fullName || !phone || !assignedPlate) return

    const { error } = await supabase.from('crew').insert([
      {
        full_name: fullName,
        role,
        phone,
        assigned_plate: assignedPlate,
      },
    ])

    if (!error) {
      setFullName('')
      setPhone('')
      fetchCrew()
    }
  }

  async function handleDeleteCrew(id, name) {
    const confirmed = window.confirm(`Remove ${name} from the crew roster?`)
    if (!confirmed) return

    const { error } = await supabase.from('crew').delete().eq('id', id)

    if (!error) {
      fetchCrew()
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddCrew} className="bg-white p-4 border border-gray-300">
        <h2 className="font-bold text-gray-900 mb-3">Register Crew Member</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Full Name (e.g. Kamau Njoroge)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm bg-white"
          >
            <option value="Driver">Driver</option>
            <option value="Conductor">Conductor</option>
          </select>
          <input
            type="text"
            placeholder="Phone (e.g. 0712 345 678)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm"
            required
          />
          <select
            value={assignedPlate}
            onChange={(e) => setAssignedPlate(e.target.value)}
            className="w-full min-w-0 border border-gray-300 px-3 py-2 text-base sm:text-sm bg-white"
            required
          >
            {vehicles.length === 0 ? (
              <option value="">Add a vehicle first</option>
            ) : (
              vehicles.map((v) => (
                <option key={v.plate_number} value={v.plate_number}>
                  {v.plate_number}
                </option>
              ))
            )}
          </select>
        </div>
        <button
          type="submit"
          disabled={vehicles.length === 0}
          className="w-full sm:w-auto mt-3 bg-gray-900 text-white px-4 py-2.5 sm:py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          Save Crew Member
        </button>
      </form>

      <div className="bg-white border border-gray-300 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm responsive-table">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="p-3 font-semibold whitespace-nowrap">Name</th>
              <th className="p-3 font-semibold whitespace-nowrap">Role</th>
              <th className="p-3 font-semibold whitespace-nowrap">Phone</th>
              <th className="p-3 font-semibold whitespace-nowrap">Assigned Matatu</th>
              <th className="p-3 font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {crew.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-gray-500 text-center">
                  No crew members registered yet.
                </td>
              </tr>
            ) : (
              crew.map((member) => (
                <tr key={member.id} className="border-b border-gray-200">
                  <td data-label="Name" className="p-3 font-medium">
                    {member.full_name}
                  </td>
                  <td data-label="Role" className="p-3 md:whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 ${
                        member.role === 'Driver'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td data-label="Phone" className="p-3 font-mono md:whitespace-nowrap">
                    {member.phone}
                  </td>
                  <td
                    data-label="Assigned Matatu"
                    className="p-3 font-mono font-semibold md:whitespace-nowrap"
                  >
                    {member.assigned_plate}
                  </td>
                  <td data-label="Actions" className="p-3 md:whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleDeleteCrew(member.id, member.full_name)}
                      className="text-xs underline text-red-600 hover:text-red-800 py-1"
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

export default CrewList
