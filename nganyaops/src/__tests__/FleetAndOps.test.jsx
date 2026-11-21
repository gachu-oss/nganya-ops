import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FleetList from '../components/FleetList'
import CrewList from '../components/CrewList'
import TripLogs from '../components/TripLogs'
import MaintenanceLog from '../components/MaintenanceLog'

const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
const mockDeleteEq = vi.fn().mockResolvedValue({ error: null })

const mockVehicles = [
  {
    id: 1,
    plate_number: 'KDG 412X',
    nickname: 'Matrix',
    route: 'CBD - Kikuyu',
    daily_target: 10000,
    status: 'Active',
  },
  {
    id: 2,
    plate_number: 'KDB 900Z',
    nickname: 'Bumblebee',
    route: 'CBD - Thika',
    daily_target: 12000,
    status: 'Garage',
  },
]

const today = new Date().toISOString().split('T')[0]

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: (table) => {
      const resolveTable = () => {
        if (table === 'vehicles') {
          return { data: mockVehicles, error: null }
        }
        if (table === 'crew') {
          return {
            data: [
              {
                id: 1,
                full_name: 'Kamau Njoroge',
                role: 'Driver',
                phone: '0712345678',
                assigned_plate: 'KDG 412X',
              },
            ],
            error: null,
          }
        }
        if (table === 'trip_logs') {
          return {
            data: [
              {
                id: 1,
                plate_number: 'KDG 412X',
                trip_date: today,
                trips_count: 6,
                gross_revenue: 16000,
                fuel_cost: 3000,
                crew_allowance: 1500,
                other_expenses: 500,
              },
            ],
            error: null,
          }
        }
        if (table === 'maintenance_logs') {
          return {
            data: [
              {
                id: 1,
                plate_number: 'KDB 900Z',
                service_date: today,
                description: 'Brake pads',
                cost: 4500,
                status: 'Pending',
              },
            ],
            error: null,
          }
        }
        return { data: [], error: null }
      }

      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        then: (resolve) => resolve(resolveTable()),
        insert: mockInsert,
        update: () => ({ eq: mockUpdateEq }),
        delete: () => ({ eq: mockDeleteEq }),
      }
      return chain
    },
  },
}))

describe('Fleet and Operations Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('renders FleetList, filters by status/search, toggles status, and deletes vehicle', async () => {
    render(<FleetList />)

    await waitFor(() => {
      expect(screen.getByText('KDG 412X')).toBeInTheDocument()
      expect(screen.getByText('KDB 900Z')).toBeInTheDocument()
      expect(screen.getByText(/Target Hit/)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('Search by plate, nickname, manufacturer, or route...'), {
      target: { value: 'Kikuyu' },
    })

    expect(screen.getByText('KDG 412X')).toBeInTheDocument()
    expect(screen.queryByText('KDB 900Z')).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search by plate, nickname, manufacturer, or route...'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'Garage' } })
    expect(screen.queryByText('KDG 412X')).not.toBeInTheDocument()
    expect(screen.getByText('KDB 900Z')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Set Active' }))
    await waitFor(() => expect(mockUpdateEq).toHaveBeenCalledWith('id', 2))

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDeleteEq).toHaveBeenCalledWith('id', 2))
  })

  it('renders CrewList roster entries, registers a crew member, and deletes an entry', async () => {
    render(<CrewList />)

    await waitFor(() => {
      expect(screen.getByText('Kamau Njoroge')).toBeInTheDocument()
      expect(screen.getAllByText('Driver').length).toBeGreaterThan(0)
    })

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Otieno Ochieng' } })
    fireEvent.change(screen.getByLabelText('Crew Role'), { target: { value: 'Conductor' } })
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '0722111222' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Crew Member' }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([
        {
          full_name: 'Otieno Ochieng',
          role: 'Conductor',
          phone: '0722111222',
          assigned_plate: 'KDG 412X',
        },
      ])
    })

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDeleteEq).toHaveBeenCalledWith('id', 1))
  })

  it('renders TripLogs, logs a Cash/M-Pesa shift, filters, and deletes a log', async () => {
    render(<TripLogs />)

    await waitFor(() => {
      expect(screen.getByText('KES 16,000')).toBeInTheDocument()
      expect(screen.getByText('KES 11,000')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Trips Completed'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Gross Collection (KES)'), { target: { value: '12000' } })
    fireEvent.change(screen.getByLabelText('Cash Collected (KES)'), { target: { value: '7000' } })
    fireEvent.change(screen.getByLabelText('M-Pesa Till or PoChi (KES)'), { target: { value: '5000' } })
    fireEvent.change(screen.getByLabelText('Fuel Cost (KES)'), { target: { value: '3000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Shift Log' }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          plate_number: 'KDG 412X',
          driver_name: 'Kamau Njoroge',
          trips_count: 5,
          gross_revenue: 12000,
          cash_collected: 7000,
          mpesa_collected: 5000,
          fuel_cost: 3000,
        }),
      ])
    })

    fireEvent.change(screen.getByLabelText('Filter by Matatu'), { target: { value: 'KDG 412X' } })
    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDeleteEq).toHaveBeenCalledWith('id', 1))
  })

  it('renders MaintenanceLog, logs repair, toggles status, and deletes record', async () => {
    render(<MaintenanceLog />)

    await waitFor(() => {
      expect(screen.getByText('Brake pads')).toBeInTheDocument()
      expect(screen.getAllByText('KES 4,500').length).toBeGreaterThan(0)
    })

    fireEvent.change(screen.getByLabelText('Work Description'), { target: { value: 'Oil change' } })
    fireEvent.change(screen.getByLabelText('Repair Cost (KES)'), { target: { value: '2500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Maintenance Log' }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          plate_number: 'KDG 412X',
          description: 'Oil change',
          cost: 2500,
          status: 'Pending',
        }),
      ])
    })

    fireEvent.click(screen.getByRole('button', { name: 'Mark Completed' }))
    await waitFor(() => expect(mockUpdateEq).toHaveBeenCalledWith('id', 1))

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDeleteEq).toHaveBeenCalledWith('id', 1))
  })
})
