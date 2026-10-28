import { apiRequest } from './apiClient.js'

export async function createPlacement(values) {
  const result = await apiRequest('/placements', {
    method: 'POST',
    body: JSON.stringify(values),
  })
  return result.placement
}

export async function getHostPlacements() {
  const result = await apiRequest('/placements/mine')
  return result.placements
}

export async function getPlacementApplicants(placementId, order = 'highest') {
  return apiRequest(`/placements/${placementId}/applicants?order=${order}`)
}

export async function getCandidatePlacements({ search = '', sort = 'recent' } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('sort', sort)
  const result = await apiRequest(`/placements?${params.toString()}`)
  return result.placements
}

export async function registerForPlacement(placementId) {
  const result = await apiRequest(`/placements/${placementId}/register`, { method: 'POST' })
  return result.application
}

export async function getCandidateApplications() {
  const result = await apiRequest('/applications/mine')
  return result.applications
}

export async function startCandidateQuiz(applicationId) {
  return apiRequest(`/applications/${applicationId}/start`, { method: 'POST' })
}

export async function submitCandidateAnswer(applicationId, questionIndex, selectedOptionIndex) {
  return apiRequest(`/applications/${applicationId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ questionIndex, selectedOptionIndex }),
  })
}
