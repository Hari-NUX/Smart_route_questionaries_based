import mongoose from 'mongoose'
import { z } from 'zod'
import { listCandidateApplications, startQuiz, submitQuizAnswer } from '../services/applicationService.js'

const answerSchema = z.object({
  questionIndex: z.number().int().min(0).max(49),
  selectedOptionIndex: z.number().int().min(0).max(3),
})

function validateApplicationId(applicationId, res) {
  if (!mongoose.isValidObjectId(applicationId)) {
    res.status(400).json({ message: 'Invalid application id' })
    return false
  }

  return true
}

export async function listCandidateApplicationsHandler(req, res) {
  const applications = await listCandidateApplications(req.user.id)
  res.json({ applications })
}

export async function startQuizHandler(req, res) {
  if (!validateApplicationId(req.params.applicationId, res)) return
  const session = await startQuiz(req.params.applicationId, req.user.id)
  res.json(session)
}

export async function submitQuizAnswerHandler(req, res) {
  if (!validateApplicationId(req.params.applicationId, res)) return
  const result = answerSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0]?.message || 'Invalid answer' })
  }

  const response = await submitQuizAnswer(
    req.params.applicationId,
    req.user.id,
    result.data.questionIndex,
    result.data.selectedOptionIndex,
  )
  res.json(response)
}
