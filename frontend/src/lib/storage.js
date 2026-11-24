// Every per-user localStorage key lives under `docmind:{userId}:`. This module has no
// store imports so authStore can use it for logout cleanup without import cycles.
const prefix = (userId) => `docmind:${userId}:`

export const userKey = (userId, name) => `${prefix(userId)}${name}`

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota / private mode */ }
}

/** Remove every namespaced key belonging to one user. */
export function clearUserData(userId) {
  if (userId == null) return
  const p = prefix(userId)
  Object.keys(localStorage).filter((k) => k.startsWith(p)).forEach((k) => localStorage.removeItem(k))
}
