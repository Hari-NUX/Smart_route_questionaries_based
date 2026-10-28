import { Router } from 'express'
import { createPlacementHandler, getPublicPlacementHandler, listHostPlacementsHandler, listPlacementApplicantsHandler, listPublicPlacementsHandler, registerCandidateHandler } from '../controllers/placementController.js'
import { authenticate, requireRole } from '../middleware/authenticate.js'

const router = Router()

router.get('/', listPublicPlacementsHandler)
router.get('/mine', authenticate, requireRole('admin'), listHostPlacementsHandler)
router.get('/:placementId/applicants', authenticate, requireRole('admin'), listPlacementApplicantsHandler)
router.get('/:placementId', getPublicPlacementHandler)
router.post('/', authenticate, requireRole('admin'), createPlacementHandler)
router.post('/:placementId/register', authenticate, requireRole('candidate'), registerCandidateHandler)

export default router
