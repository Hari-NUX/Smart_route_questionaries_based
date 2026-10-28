import { apiRequest } from './apiClient.js'
import { clearAuthToken, getAuthToken, setAuthToken } from './authSession.js'

export async function signup(values) {
  const result = await apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(values) })
  setAuthToken(result.token)
  return result.user
}

export async function login(values) {
  const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(values) })
  setAuthToken(result.token)
  return result.user
}

export async function getCurrentUser() {
  const token = getAuthToken()

  if (!token) return null

  try {
    const result = await apiRequest('/auth/me', { token })
    return result.user
  } catch {
    clearAuthToken()
    return null
  }
}

export function logout() {
  clearAuthToken()
}
