import { startOfMonth, subMonths, format, parseISO, isValid } from 'date-fns'

export function totalsByCategory(expenses) {
  const map = new Map()
  for (const e of expenses) {
    const k = e.category || 'Other'
    map.set(k, (map.get(k) || 0) + (Number(e.amount) || 0))
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function totalsByProperty(expenses, nameById) {
  const map = new Map()
  for (const e of expenses) {
    map.set(e.property_id, (map.get(e.property_id) || 0) + (Number(e.amount) || 0))
  }
  return [...map.entries()]
    .map(([id, value]) => ({ id, name: nameById(id) || 'Unknown', value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function monthlySeries(expenses, months = 12) {
  const buckets = new Map()
  const order = []
  const now = startOfMonth(new Date())
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(now, i)
    const key = format(d, 'yyyy-MM')
    buckets.set(key, 0)
    order.push({ key, label: format(d, 'MMM yy') })
  }
  for (const e of expenses) {
    if (!e.date) continue
    const d = parseISO(e.date)
    if (!isValid(d)) continue
    const key = format(d, 'yyyy-MM')
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + (Number(e.amount) || 0))
  }
  return order.map(({ key, label }) => ({ month: label, total: buckets.get(key) || 0 }))
}
