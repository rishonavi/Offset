import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { Spinner } from './components/ui'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Properties = lazy(() => import('./pages/Properties'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Reports = lazy(() => import('./pages/Reports'))

export default function App() {
  const { isCloud } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isCloud ? (
            <Suspense fallback={<FullScreen />}>
              <Login />
            </Suspense>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DataProvider>
              <Layout />
            </DataProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function FullScreen() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner />
    </div>
  )
}
