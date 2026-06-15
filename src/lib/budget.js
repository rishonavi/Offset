import { startOfMonth, format } from 'date-fns'

// Map of property_id -> amount spent in the current calendar month.
export function monthSpendByProperty(expenses, ref = new Date()) {
  const start = format(startOfMonth(ref), 'yyyy-MM-dd')
  const map = new Map()
  for (const e of expenses) {
    if ((e.date || '') >= start) {
      map.set(e.property_id, (map.get(e.property_id) || 0) + (Number(e.amount) || 0))
    }
  }
  return map
}

// Returns null when no budget is set, otherwise progress + alert level.
export function budgetStatus(spent, budget) {
  const b = Number(budget) || 0
  if (b <= 0) return null
  const pct = (spent / b) * 100
  const level = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok'
  return { spent, budget: b, pct, level, remaining: b - spent }
}

export const BUDGET_COLORS = { ok: '#10b981', warn: '#f59e0b', over: '#ef4444' }
