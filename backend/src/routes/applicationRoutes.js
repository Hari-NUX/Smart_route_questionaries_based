import { Router } from 'express'
import { listCandidateApplicationsHandler, startQuizHandler, submitQuizAnswerHandler } from '../controllers/applicationController.js'
import { authenticate, requireRole } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate, requireRole('candidate'))
router.get('/mine', listCandidateApplicationsHandler)
router.post('/:applicationId/start', startQuizHandler)
router.post('/:applicationId/answer', submitQuizAnswerHandler)

export default router
