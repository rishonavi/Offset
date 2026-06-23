import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui'

export default function ProtectedRoute({ children }) {
  const { user, loading, isCloud } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Starting up…" />
      </div>
    )
  }

  if (isCloud && !user) {
    return <Navigate to="/welcome" replace />
  }

  return children
}
