export function getExpiryStatus(dateString) {
  if (!dateString) {
    return { label: 'Not Set', tone: 'neutral', daysLeft: null }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(dateString + 'T00:00:00')
  const diffMs = target - today
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return {
      label: `Expired (${Math.abs(daysLeft)}d ago)`,
      tone: 'danger',
      daysLeft,
    }
  }

  if (daysLeft <= 14) {
    return {
      label: daysLeft === 0 ? 'Expires Today' : `Expiring in ${daysLeft}d`,
      tone: 'warning',
      daysLeft,
    }
  }

  return {
    label: `Valid (${dateString})`,
    tone: 'valid',
    daysLeft,
  }
}
