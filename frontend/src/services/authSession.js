const tokenKey = 'smartrouteToken'

export function getAuthToken() {
  let token = sessionStorage.getItem(tokenKey)

  if (!token) {
    token = localStorage.getItem(tokenKey)
    if (token) {
      sessionStorage.setItem(tokenKey, token)
      localStorage.removeItem(tokenKey)
    }
  }

  return token
}

export function setAuthToken(token) {
  sessionStorage.setItem(tokenKey, token)
  localStorage.removeItem(tokenKey)
}

export function clearAuthToken() {
  sessionStorage.removeItem(tokenKey)
  localStorage.removeItem(tokenKey)
}
