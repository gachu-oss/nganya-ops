import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FleetList from '../components/FleetList'
import CrewList from '../components/CrewList'
import TripLogs from '../components/TripLogs'
import MaintenanceLog from '../components/MaintenanceLog'

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
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        delete: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }
      return chain
    },
  },
}))

describe('Fleet and Operations Components', () => {
  it('renders FleetList, displays target hit badge, and filters by search term', async () => {
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
  })

  it('renders CrewList roster entries', async () => {
    render(<CrewList />)

    await waitFor(() => {
      expect(screen.getByText('Kamau Njoroge')).toBeInTheDocument()
      expect(screen.getAllByText('Driver').length).toBeGreaterThan(0)
    })
  })

  it('renders TripLogs and calculates net profit per shift', async () => {
    render(<TripLogs />)

    await waitFor(() => {
      expect(screen.getByText('KES 16,000')).toBeInTheDocument()
      expect(screen.getByText('KES 11,000')).toBeInTheDocument()
    })
  })

  it('renders MaintenanceLog and displays total garage spend', async () => {
    render(<MaintenanceLog />)

    await waitFor(() => {
      expect(screen.getByText('Brake pads')).toBeInTheDocument()
      expect(screen.getAllByText('KES 4,500').length).toBeGreaterThan(0)
    })
  })
})
