import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { db } from '../lib/storage'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

export const useData = () => useContext(DataContext)

const byNameAsc = (a, b) => (a.name || '').localeCompare(b.name || '')
const byDateDesc = (a, b) => (b.date || '').localeCompare(a.date || '')

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, e] = await Promise.all([db.getProperties(), db.getExpenses()])
      setProperties([...p].sort(byNameAsc))
      setExpenses([...e].sort(byDateDesc))
    } catch (err) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) refresh()
  }, [user, refresh])

  const propertyNameById = useCallback(
    (id) => properties.find((p) => p.id === id)?.name,
    [properties],
  )

  // ── Properties ──
  const addProperty = async (data) => {
    const row = await db.addProperty(data)
    setProperties((prev) => [...prev, row].sort(byNameAsc))
    return row
  }
  const updateProperty = async (id, data) => {
    const row = await db.updateProperty(id, data)
    setProperties((prev) => prev.map((p) => (p.id === id ? row : p)).sort(byNameAsc))
    return row
  }
  const deleteProperty = async (id) => {
    await db.deleteProperty(id)
    setProperties((prev) => prev.filter((p) => p.id !== id))
    setExpenses((prev) => prev.filter((e) => e.property_id !== id))
  }

  // ── Expenses ──
  const addExpense = async (data) => {
    const row = await db.addExpense(data)
    setExpenses((prev) => [row, ...prev].sort(byDateDesc))
    return row
  }
  const updateExpense = async (id, data) => {
    const row = await db.updateExpense(id, data)
    setExpenses((prev) => prev.map((e) => (e.id === id ? row : e)).sort(byDateDesc))
    return row
  }
  const deleteExpense = async (id) => {
    await db.deleteExpense(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const value = useMemo(
    () => ({
      properties,
      expenses,
      loading,
      error,
      refresh,
      propertyNameById,
      addProperty,
      updateProperty,
      deleteProperty,
      addExpense,
      updateExpense,
      deleteExpense,
    }),
    [properties, expenses, loading, error, refresh, propertyNameById],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
