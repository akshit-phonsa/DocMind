import { useAuthStore } from '../store/authStore.js'

/**
 * Called on any 401 (axios or streaming). Logs out once and hard-navigates to /login.
 * The `token` guard makes parallel 401s (several requests in flight) a no-op after the
 * first, and the pathname guard prevents reload loops on the login page itself.
 */
export function handleUnauthorized() {
  if (!useAuthStore.getState().token) return
  useAuthStore.getState().logout()
  try { sessionStorage.setItem('docmind-session-expired', '1') } catch { /* ignore */ }
  if (!['/login', '/register'].includes(window.location.pathname)) window.location.assign('/login')
}
