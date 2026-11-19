import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function MaintenanceLog() {
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [plateNumber, setPlateNumber] = useState('')
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')

  useEffect(() => {
    fetchRecords()
    fetchVehicles()
  }, [])

  async function fetchRecords() {
    const { data, error } = await supabase
      .from('maintenance_logs')
      .select('*')
      .order('service_date', { ascending: false })
      .order('id', { ascending: false })

    if (!error && data) {
      setRecords(data)
    }
  }

  async function fetchVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('plate_number')
      .order('plate_number', { ascending: true })

    if (!error && data) {
      setVehicles(data)
      if (data.length > 0 && !plateNumber) {
        setPlateNumber(data[0].plate_number)
      }
    }
  }

  async function handleAddRecord(e) {
    e.preventDefault()
    if (!plateNumber || !serviceDate || !description || !cost) return

    const { error } = await supabase.from('maintenance_logs').insert([
      {
        plate_number: plateNumber,
        service_date: serviceDate,
        description,
        cost: Number(cost),
        status: 'Pending',
      },
    ])

    if (!error) {
      setDescription('')
      setCost('')
      fetchRecords()
    }
  }

  async function toggleStatus(record) {
    const nextStatus = record.status === 'Pending' ? 'Completed' : 'Pending'
    const { error } = await supabase
      .from('maintenance_logs')
      .update({ status: nextStatus })
      .eq('id', record.id)

    if (!error) {
      fetchRecords()
    }
  }

  async function handleDeleteRecord(id, plate) {
    const confirmed = window.confirm(`Delete maintenance record for ${plate}?`)
    if (!confirmed) return

    const { error } = await supabase.from('maintenance_logs').delete().eq('id', id)

    if (!error) {
      fetchRecords()
    }
  }

  const totalCost = records.reduce((sum, item) => sum + Number(item.cost || 0), 0)

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddRecord} className="bg-white p-4 border border-gray-300">
        <h2 className="font-bold text-gray-900 mb-3">Log Garage / Maintenance Expense</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm bg-white"
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
          <input
            type="date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Issue / Work Done (e.g. Brake pads)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Repair Cost (KES)"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={vehicles.length === 0}
          className="mt-3 bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          Save Maintenance Log
        </button>
      </form>

      <div className="bg-white p-3 border border-gray-300 flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">Total Logged Garage Spend</span>
        <span className="font-mono font-bold text-gray-900">
          KES {totalCost.toLocaleString()}
        </span>
      </div>

      <div className="bg-white border border-gray-300 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Matatu</th>
              <th className="p-3 font-semibold">Work / Issue</th>
              <th className="p-3 font-semibold">Cost</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-gray-500 text-center">
                  No maintenance records logged yet.
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr key={rec.id} className="border-b border-gray-200">
                  <td className="p-3 font-mono">{rec.service_date}</td>
                  <td className="p-3 font-mono font-semibold">{rec.plate_number}</td>
                  <td className="p-3">{rec.description}</td>
                  <td className="p-3 font-mono">KES {Number(rec.cost).toLocaleString()}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 ${
                        rec.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="p-3 space-x-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(rec)}
                      className="text-xs underline text-gray-700 hover:text-gray-900"
                    >
                      Mark {rec.status === 'Pending' ? 'Completed' : 'Pending'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(rec.id, rec.plate_number)}
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

export default MaintenanceLog
