import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { db } from '../lib/storage'
import { billingEnabled, planById } from '../lib/plans'
import { useAuth } from './AuthContext'

const PlanContext = createContext(null)
export const usePlan = () => useContext(PlanContext)

// AI-scan usage is counted per calendar month in localStorage. (A soft client
// limit; the Stripe-backed plan is the source of truth for what's allowed.)
const monthKey = () => `pl_scans_${new Date().toISOString().slice(0, 7)}`

export function PlanProvider({ children }) {
  const { user } = useAuth()
  // Billing off → everyone is "pro" so the app behaves exactly as before.
  const [plan, setPlan] = useState(billingEnabled ? 'free' : 'pro')
  const [scanCount, setScanCount] = useState(() => Number(localStorage.getItem(monthKey()) || 0))

  const refresh = useCallback(async () => {
    if (!billingEnabled) return setPlan('pro')
    try {
      setPlan((await db.getPlan?.()) || 'free')
    } catch {
      setPlan('free')
    }
  }, [])

  useEffect(() => {
    if (user) refresh()
  }, [user, refresh])

  const recordScan = useCallback(() => {
    setScanCount((c) => {
      const n = c + 1
      localStorage.setItem(monthKey(), String(n))
      return n
    })
  }, [])

  const info = planById(plan)
  const value = useMemo(() => {
    const scanLimit = info.limits.scansPerMonth
    return {
      plan,
      info,
      isPro: plan === 'pro',
      billingEnabled,
      scanCount,
      scanLimit,
      scansLeft: scanLimit === Infinity ? Infinity : Math.max(0, scanLimit - scanCount),
      can: (key) => Boolean(info.limits[key]), // gmailImport | cloudBackup
      canScan: () => scanCount < scanLimit,
      canAddAsset: (current) => current < info.limits.assets,
      recordScan,
      refresh,
    }
  }, [plan, info, scanCount, recordScan, refresh])

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
