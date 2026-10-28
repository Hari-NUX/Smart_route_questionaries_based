import Application from '../models/Application.js'
import { difficultyIndex, selectInitialQuestion, selectNextQuestion, updateDomainDifficulty } from './adaptiveQuestionService.js'

function serviceError(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}

async function loadApplicationForQuiz(applicationId, candidateId) {
  const application = await Application.findOne({ _id: applicationId, candidate: candidateId })
    .populate({ path: 'placement', select: '+questionBank' })

  if (!application) throw serviceError('Application not found', 404)
  if (!application.placement?.questionBank?.length) {
    throw serviceError('This placement has no generated question bank. Ask the host to create it again.', 409)
  }

  return application
}

function publicQuestion(question, questionNumber, totalQuestions) {
  return {
    questionNumber,
    totalQuestions,
    question: question.question,
    options: question.options,
    domain: question.domain,
    difficulty: question.difficulty,
  }
}

function currentQuestion(application) {
  const poolIndex = application.questionOrder[application.currentQuestionIndex]
  return publicQuestion(
    application.placement.questionBank[poolIndex],
    application.currentQuestionIndex + 1,
    application.placement.questionCount,
  )
}

export async function listCandidateApplications(candidateId) {
  return Application.find({ candidate: candidateId })
    .select('-answers -questionOrder -domainDifficulty')
    .populate('placement', 'companyName title description location domainMode domains registrationOpensAt registrationDeadline registrationLimit registrationCount questionCount difficulty randomnessPercent status')
    .sort({ registeredAt: -1 })
    .lean()
}

export async function startQuiz(applicationId, candidateId) {
  const application = await loadApplicationForQuiz(applicationId, candidateId)

  if (application.status === 'completed') {
    return { completed: true, score: application.score, totalQuestions: application.placement.questionCount }
  }

  if (application.status === 'in_progress') {
    return { completed: false, score: application.score, question: currentQuestion(application) }
  }

  if (application.status !== 'registered') {
    throw serviceError('This quiz cannot be started', 409)
  }

  const baseDifficulty = difficultyIndex(application.placement.difficulty)
  const domains = [...new Set(application.placement.questionBank.map((question) => question.domain))]
  const domainDifficulty = domains.map((domain) => ({ domain, level: baseDifficulty }))
  const firstQuestionIndex = selectInitialQuestion(
    application.placement.questionBank,
    application.placement.difficulty,
  )
  const startedAt = new Date()
  const started = await Application.findOneAndUpdate(
    { _id: application._id, candidate: candidateId, status: 'registered' },
    {
      $set: {
        status: 'in_progress',
        startedAt,
        currentQuestionIndex: 0,
        questionOrder: [firstQuestionIndex],
        domainDifficulty,
      },
    },
    { new: true },
  )

  if (!started) return startQuiz(applicationId, candidateId)

  return {
    completed: false,
    score: 0,
    question: publicQuestion(application.placement.questionBank[firstQuestionIndex], 1, application.placement.questionCount),
  }
}

export async function submitQuizAnswer(applicationId, candidateId, questionIndex, selectedOptionIndex) {
  const application = await loadApplicationForQuiz(applicationId, candidateId)

  if (application.status !== 'in_progress') {
    throw serviceError('This quiz is not accepting answers', 409)
  }

  if (application.currentQuestionIndex !== questionIndex) {
    throw serviceError('This question was already answered or is no longer current', 409)
  }

  const placement = application.placement
  const poolIndex = application.questionOrder[questionIndex]
  const question = placement.questionBank[poolIndex]

  if (!question || selectedOptionIndex > 3) {
    throw serviceError('Invalid answer for the current question', 400)
  }

  const isCorrect = selectedOptionIndex === question.correctOptionIndex
  const score = application.score + Number(isCorrect)
  const answerCount = application.answers.length + 1
  const answer = {
    questionPoolIndex: poolIndex,
    selectedOptionIndex,
    isCorrect,
    domain: question.domain,
    difficulty: question.difficulty,
    answeredAt: new Date(),
  }
  const usedQuestionIndexes = application.questionOrder.map(Number)
  const update = {
    $push: { answers: answer },
    $set: { score },
  }
  let nextQuestion = null
  let completed = answerCount >= placement.questionCount
  let nextSequenceIndex = questionIndex

  if (completed) {
    update.$set.status = 'completed'
    update.$set.completedAt = new Date()
  } else {
    const domainDifficulty = application.domainDifficulty.map((entry) => ({ domain: entry.domain, level: entry.level }))
    let domainState = domainDifficulty.find((entry) => entry.domain === question.domain)

    if (!domainState) {
      domainState = { domain: question.domain, level: difficultyIndex(question.difficulty) }
      domainDifficulty.push(domainState)
    }

    domainState.level = updateDomainDifficulty(domainState.level, isCorrect, placement.randomnessPercent)
    const nextPoolIndex = selectNextQuestion(
      placement.questionBank,
      usedQuestionIndexes,
      question.domain,
      domainState.level,
    )
    nextSequenceIndex += 1
    update.$push.questionOrder = nextPoolIndex
    update.$set.currentQuestionIndex = nextSequenceIndex
    update.$set.domainDifficulty = domainDifficulty
    nextQuestion = publicQuestion(placement.questionBank[nextPoolIndex], nextSequenceIndex + 1, placement.questionCount)
  }

  const updated = await Application.findOneAndUpdate(
    {
      _id: application._id,
      candidate: candidateId,
      status: 'in_progress',
      currentQuestionIndex: questionIndex,
    },
    update,
    { new: true },
  )

  if (!updated) throw serviceError('This question was already answered or is no longer current', 409)

  return {
    isCorrect,
    correctOptionIndex: question.correctOptionIndex,
    explanation: question.explanation,
    score,
    totalQuestions: placement.questionCount,
    completed,
    nextQuestion,
  }
}
