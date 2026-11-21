import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Dashboard from '../components/Dashboard'

let simulateError = false
const expiredDate = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]
const soonDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: (table) => {
      if (simulateError) {
        return {
          select: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB offline' } }),
        }
      }
      if (table === 'vehicles') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              {
                plate_number: 'KDG 412X',
                nickname: 'Matrix',
                route: 'CBD - Kikuyu',
                status: 'Active',
                insurance_expiry: expiredDate,
                ntsa_inspection_expiry: soonDate,
              },
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
  beforeEach(() => {
    simulateError = false
  })

  it('calculates fleet KPIs, compliance alerts, and ranks vehicles by net profit', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getAllByText('KES 18,000').length).toBeGreaterThan(0)
      expect(screen.getAllByText('KES 8,000').length).toBeGreaterThan(0)
      expect(screen.getAllByText('KES 10,000').length).toBeGreaterThan(0)
      expect(screen.getByText('KDG 412X')).toBeInTheDocument()
      expect(screen.getByText(/Compliance & Renewal Alerts/)).toBeInTheDocument()
    })

    expect(screen.getByText('Matatu Profitability Ranking')).toBeInTheDocument()
  })

  it('displays error banner when summary queries fail', async () => {
    simulateError = true
    render(<Dashboard />)

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load operational summary. Check your connection and try again.')
      ).toBeInTheDocument()
    })
  })
})
