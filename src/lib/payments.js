import { todayISO } from './format'

// An entry is "settled" when an expense is paid or income is received.
// Missing status (older rows) is treated as settled.
export function isSettled(entry, kind) {
  const s = entry.status
  if (kind === 'income') return s == null || s === 'received'
  return s == null || s === 'paid'
}

export function isOverdue(entry, kind) {
  return !isSettled(entry, kind) && !!entry.due_date && entry.due_date < todayISO()
}

export function paymentMeta(entry, kind) {
  if (isSettled(entry, kind)) {
    return { settled: true, overdue: false, label: kind === 'income' ? 'Received' : 'Paid', color: '#2F8F6B' }
  }
  const overdue = isOverdue(entry, kind)
  return {
    settled: false,
    overdue,
    label: overdue ? 'Overdue' : kind === 'income' ? 'Pending' : 'Unpaid',
    color: overdue ? '#C0492F' : '#C5A059',
  }
}

// Sum of amounts that are not yet settled (payables for expenses,
// receivables for income).
export function outstandingTotal(entries, kind) {
  return entries
    .filter((e) => !isSettled(e, kind))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
}
