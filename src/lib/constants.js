export const CURRENCY = import.meta.env.VITE_CURRENCY || 'INR'
export const LOCALE = import.meta.env.VITE_LOCALE || 'en-IN'

export const PROPERTY_TYPES = [
  'Apartment / Flat',
  'Villa / House',
  'Commercial',
  'Office',
  'Shop / Retail',
  'Plot / Land',
  'Other',
]

export const CATEGORIES = [
  'Materials',
  'Labor / Contractors',
  'Permits & Legal',
  'Utilities',
  'Property Tax',
  'Maintenance & Repairs',
  'Insurance',
  'Loan / EMI',
  'Brokerage / Marketing',
  'Furnishing',
  'Other',
]

export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'UPI',
  'Cheque',
  'Credit Card',
  'Debit Card',
  'Other',
]

// Stable colour per category for charts/legends.
export const CATEGORY_COLORS = {
  'Materials': '#4f46e5',
  'Labor / Contractors': '#0ea5e9',
  'Permits & Legal': '#8b5cf6',
  'Utilities': '#14b8a6',
  'Property Tax': '#f59e0b',
  'Maintenance & Repairs': '#ef4444',
  'Insurance': '#ec4899',
  'Loan / EMI': '#6366f1',
  'Brokerage / Marketing': '#10b981',
  'Furnishing': '#f97316',
  'Other': '#64748b',
}

// General palette for charts keyed by index (e.g. per-property bars).
export const CHART_PALETTE = [
  '#4f46e5', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#10b981', '#f97316', '#6366f1',
  '#06b6d4', '#84cc16',
]

export const colorForCategory = (cat, i = 0) =>
  CATEGORY_COLORS[cat] || CHART_PALETTE[i % CHART_PALETTE.length]
