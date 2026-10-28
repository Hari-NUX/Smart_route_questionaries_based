import { z } from 'zod'
import mongoose from 'mongoose'
import { placementDomains } from '../models/Placement.js'
import { createPlacement, getPublicPlacement, listHostPlacements, listPlacementApplicants, listPublicPlacements, registerCandidate } from '../services/placementService.js'

export const placementSchema = z.object({
  companyName: z.string().trim().min(2).max(100),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(3000),
  location: z.string().trim().min(2).max(120),
  domainMode: z.enum(['specific', 'random']),
  domains: z.array(z.enum(placementDomains)).max(placementDomains.length),
  registrationOpensAt: z.coerce.date(),
  registrationDeadline: z.coerce.date(),
  registrationLimit: z.coerce.number().int().min(1).max(1000),
  questionCount: z.coerce.number().int().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  randomnessPercent: z.coerce.number().int().min(0).max(100),
}).superRefine((values, context) => {
  if (values.domainMode === 'specific' && values.domains.length === 0) {
    context.addIssue({ code: 'custom', path: ['domains'], message: 'Choose at least one question domain' })
  }

  if (values.domainMode === 'random' && values.domains.length > 0) {
    context.addIssue({ code: 'custom', path: ['domains'], message: 'Random domain mode cannot include selected domains' })
  }

  if (values.registrationOpensAt <= new Date()) {
    context.addIssue({ code: 'custom', path: ['registrationOpensAt'], message: 'Registration start must be in the future' })
  }

  if (values.registrationDeadline <= values.registrationOpensAt) {
    context.addIssue({ code: 'custom', path: ['registrationDeadline'], message: 'Deadline must be after registration opens' })
  }
})

function parsePlacement(body) {
  const result = placementSchema.safeParse(body)

  if (!result.success) {
    const error = new Error(result.error.issues[0]?.message || 'Invalid placement details')
    error.status = 400
    throw error
  }

  return result.data
}

export async function createPlacementHandler(req, res) {
  const values = parsePlacement(req.body)
  const placement = await createPlacement(req.user.id, values)
  res.status(201).json({ placement })
}

export async function listHostPlacementsHandler(req, res) {
  const placements = await listHostPlacements(req.user.id)
  res.json({ placements })
}

export async function listPlacementApplicantsHandler(req, res) {
  if (!mongoose.isValidObjectId(req.params.placementId)) {
    return res.status(400).json({ message: 'Invalid placement id' })
  }

  const order = req.query.order === 'lowest' ? 'lowest' : 'highest'
  const result = await listPlacementApplicants(req.user.id, req.params.placementId, order)
  res.json(result)
}

export async function listPublicPlacementsHandler(req, res) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : ''
  const domain = typeof req.query.domain === 'string' ? req.query.domain : ''
  const sort = req.query.sort === 'deadline' ? 'deadline' : 'recent'

  if (domain && !placementDomains.includes(domain)) {
    return res.status(400).json({ message: 'Unsupported placement domain' })
  }

  const placements = await listPublicPlacements({ search, domain, sort })
  res.json({ placements })
}

export async function getPublicPlacementHandler(req, res) {
  if (!mongoose.isValidObjectId(req.params.placementId)) {
    return res.status(400).json({ message: 'Invalid placement id' })
  }

  const placement = await getPublicPlacement(req.params.placementId)
  if (!placement) return res.status(404).json({ message: 'Placement not found' })
  res.json({ placement })
}

export async function registerCandidateHandler(req, res) {
  if (!mongoose.isValidObjectId(req.params.placementId)) {
    return res.status(400).json({ message: 'Invalid placement id' })
  }

  const application = await registerCandidate(req.params.placementId, req.user.id)
  res.status(201).json({ application: { id: application.id, status: application.status, registeredAt: application.registeredAt } })
}
