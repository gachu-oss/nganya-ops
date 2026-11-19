import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Dashboard from '../components/Dashboard'

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: (table) => {
      if (table === 'vehicles') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { plate_number: 'KDG 412X', nickname: 'Matrix', route: 'CBD - Kikuyu', status: 'Active' },
              { plate_number: 'KDA 100A', nickname: '-', route: 'CBD - Rongai', status: 'Garage' },
            ],
            error: null,
          }),
        }
      }
      if (table === 'trip_logs') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              {
                plate_number: 'KDG 412X',
                trips_count: 6,
                gross_revenue: 18000,
                fuel_cost: 4000,
                crew_allowance: 2000,
                other_expenses: 500,
              },
            ],
            error: null,
          }),
        }
      }
      if (table === 'maintenance_logs') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ plate_number: 'KDG 412X', cost: 1500 }],
            error: null,
          }),
        }
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
    },
  },
}))

describe('Dashboard Component', () => {
  it('calculates fleet KPIs and ranks vehicles by net profit', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getAllByText('KES 18,000').length).toBeGreaterThan(0)
      expect(screen.getAllByText('KES 8,000').length).toBeGreaterThan(0)
      expect(screen.getAllByText('KES 10,000').length).toBeGreaterThan(0)
      expect(screen.getByText('KDG 412X')).toBeInTheDocument()
    })
  })
})
