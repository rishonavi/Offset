import { createContext, useContext, useEffect, useState } from 'react'
import { db, isCloud } from '../lib/storage'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = db.onAuthStateChange((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    user,
    loading,
    isCloud,
    signIn: (creds) => db.signIn(creds),
    signUp: (creds) => db.signUp(creds),
    signInWithProvider: (provider) => db.signInWithProvider(provider),
    signOut: async () => {
      await db.signOut()
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
