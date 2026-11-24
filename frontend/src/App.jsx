import { AnimatePresence, MotionConfig } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Workspace from './pages/Workspace.jsx'

function AnimatedRoutes() {
  const location = useLocation()
  // Keyed by section so /login <-> /register cross-fades, while the app shell isn't re-mounted by unrelated changes.
  const key = location.pathname === '/' ? 'app' : location.pathname
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={key}>
        <Route element={<ProtectedRoute invert />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Workspace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    // reducedMotion="user": framer-motion skips transform/layout animation when the OS asks for less motion.
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ style: { background: '#141b30', color: '#e2e8f0' } }} />
          <AnimatedRoutes />
        </BrowserRouter>
      </ErrorBoundary>
    </MotionConfig>
  )
}
