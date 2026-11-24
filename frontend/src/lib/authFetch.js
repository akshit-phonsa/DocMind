import { useAuthStore } from '../store/authStore.js'
import { handleUnauthorized } from './session.js'

/**
 * fetch() with the bearer token attached. Only used where axios can't: reading a
 * chunked response body (chat streaming).
 */
export async function authFetch(url, init = {}) {
  const token = useAuthStore.getState().token
  const res = await fetch(url, {
    ...init,
    headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (res.status === 401) handleUnauthorized()
  return res
}
