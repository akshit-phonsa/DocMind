import axios from 'axios'
import { errMsg } from '../lib/utils.js'

// Deliberately a bare instance: no auth interceptor, so a wrong password (401) shows an
// error on the form instead of triggering the global "session expired" redirect.
const http = axios.create({ baseURL: '/api/v1/auth' })

async function call(p) {
  try {
    return (await p).data // auth endpoints are NOT wrapped in the { success, data } envelope
  } catch (e) {
    throw new Error(errMsg(e))
  }
}

export const authApi = {
  /** @returns {Promise<import('../types').LoginResponse>} */
  login: (username, password) => call(http.post('/login', { username, password })),
  /** @returns {Promise<import('../types').UserDto>} */
  register: (username, email, password) => call(http.post('/register', { username, email, password })),
}
