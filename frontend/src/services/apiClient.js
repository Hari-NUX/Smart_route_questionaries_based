import { getAuthToken } from './authSession.js'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function apiRequest(path, options = {}) {
  const token = options.token ?? getAuthToken()
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'The request could not be completed')
  }

  return result
}
