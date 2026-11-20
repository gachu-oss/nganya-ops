import { describe, it, expect } from 'vitest'
import { getExpiryStatus } from '../utils/compliance'

describe('Compliance Expiry Helper', () => {
  it('returns neutral status when date is missing', () => {
    expect(getExpiryStatus(null)).toEqual({
      label: 'Not Set',
      tone: 'neutral',
      daysLeft: null,
    })
  })

  it('flags past dates as danger (Expired)', () => {
    const past = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
    const result = getExpiryStatus(past)
    expect(result.tone).toBe('danger')
    expect(result.label).toContain('Expired')
  })

  it('flags dates within 14 days as warning (Expiring)', () => {
    const soon = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const result = getExpiryStatus(soon)
    expect(result.tone).toBe('warning')
    expect(result.label).toContain('Expiring in')
  })

  it('flags dates beyond 14 days as valid', () => {
    const future = new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0]
    const result = getExpiryStatus(future)
    expect(result.tone).toBe('valid')
    expect(result.label).toContain('Valid')
  })
})
