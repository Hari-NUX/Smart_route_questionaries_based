import { apiRequest } from './apiClient.js'

export async function signup(values) {
  const result = await apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(values) })
  localStorage.setItem('smartrouteToken', result.token)
  return result.user
}

export async function login(values) {
  const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(values) })
  localStorage.setItem('smartrouteToken', result.token)
  return result.user
}

export async function getCurrentUser() {
  const token = localStorage.getItem('smartrouteToken')

  if (!token) return null

  try {
    const result = await apiRequest('/auth/me', { token })
    return result.user
  } catch {
    localStorage.removeItem('smartrouteToken')
    return null
  }
}

export function logout() {
  localStorage.removeItem('smartrouteToken')
}
