import { Navigate, Outlet } from 'react-router-dom'
import { hasSession, useAuthStore } from '../store/authStore.js'

/** Wraps routes that need a session. `invert` makes it the public-only variant. */
export default function ProtectedRoute({ invert = false }) {
  const ok = useAuthStore(hasSession)
  if (invert) return ok ? <Navigate to="/" replace /> : <Outlet />
  return ok ? <Outlet /> : <Navigate to="/login" replace />
}
