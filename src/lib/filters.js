export const emptyFilters = { propertyId: '', category: '', from: '', to: '', q: '' }

export function applyFilters(expenses, f = emptyFilters) {
  const q = (f.q || '').trim().toLowerCase()
  return expenses.filter((e) => {
    if (f.propertyId && e.property_id !== f.propertyId) return false
    if (f.category && e.category !== f.category) return false
    if (f.from && (e.date || '') < f.from) return false
    if (f.to && (e.date || '') > f.to) return false
    if (q) {
      const hay = `${e.vendor || ''} ${e.description || ''} ${e.category || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export const sumAmount = (expenses) =>
  expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

export const hasActiveFilters = (f = emptyFilters) =>
  Boolean(f.propertyId || f.category || f.from || f.to || (f.q && f.q.trim()))
