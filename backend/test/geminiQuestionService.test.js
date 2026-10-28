import assert from 'node:assert/strict'
import test from 'node:test'
import { generateQuestions, geminiFailure, questionSystemInstruction } from '../src/services/geminiQuestionService.js'

function values() {
  return {
    companyName: 'Northstar Labs',
    title: 'Graduate Software Engineer',
    description: 'Join our engineering team to build reliable products for customers.',
    location: 'Bengaluru',
    domainMode: 'specific',
    domains: ['AI', 'DBMS'],
    questionCount: 2,
    difficulty: 'medium',
    randomnessPercent: 40,
  }
}

function generatedQuestion(domain = 'AI', difficulty = 'medium', suffix = '') {
  return {
    question: `Which option best describes this computer science concept${suffix}?`,
    options: ['First choice', 'Second choice', 'Third choice', 'Fourth choice'],
    correctOptionIndex: 1,
    explanation: 'The second choice is correct because it matches the definition.',
    domain,
    difficulty,
  }
}

function validQuestionBank() {
  return [
    generatedQuestion('AI', 'easy', ' one'),
    generatedQuestion('DBMS', 'easy', ' two'),
    generatedQuestion('AI', 'medium', ' three'),
    generatedQuestion('DBMS', 'medium', ' four'),
    generatedQuestion('AI', 'hard', ' five'),
    generatedQuestion('DBMS', 'hard', ' six'),
  ]
}

function fakeClient(questions, capture) {
  return {
    models: {
      async generateContent(request) {
        capture.request = request
        return { text: JSON.stringify({ questions }) }
      },
    },
  }
}

test('creates a validated question set using Gemini structured output', async () => {
  const capture = {}
  const result = await generateQuestions(
    values(),
    fakeClient(validQuestionBank(), capture),
  )

  assert.equal(result.length, 6)
  assert.equal(result[0].correctOptionIndex, 1)
  assert.equal(capture.request.config.responseMimeType, 'application/json')
  assert.match(capture.request.config.systemInstruction, /exactly 6 questions/)
  assert.equal(capture.request.config.responseJsonSchema.properties.questions.type, 'array')
})

test('supports a one-question quiz by generating one question at each difficulty', async () => {
  const oneQuestion = { ...values(), domains: ['AI'], questionCount: 1 }
  const questionBank = [
    generatedQuestion('AI', 'easy'),
    generatedQuestion('AI', 'medium'),
    generatedQuestion('AI', 'hard'),
  ]
  const result = await generateQuestions(oneQuestion, fakeClient(questionBank, {}))

  assert.equal(result.length, 3)
  assert.deepEqual(result.map((question) => question.difficulty), ['easy', 'medium', 'hard'])
})

test('falls back to Gemini Flash-Lite when the configured model is temporarily unavailable', async () => {
  const modelsUsed = []
  const client = {
    models: {
      async generateContent(request) {
        modelsUsed.push(request.model)
        if (modelsUsed.length === 1) {
          const error = new Error('temporary provider failure')
          error.status = 503
          throw error
        }
        return { text: JSON.stringify({ questions: validQuestionBank() }) }
      },
    },
  }

  const result = await generateQuestions(values(), client)

  assert.equal(result.length, 6)
  assert.equal(modelsUsed.at(-1), 'gemini-3.5-flash-lite')
})

test('falls back when Gemini reports a gateway timeout', async () => {
  const modelsUsed = []
  const client = {
    models: {
      async generateContent(request) {
        modelsUsed.push(request.model)
        if (modelsUsed.length === 1) {
          const error = new Error('provider gateway timeout')
          error.status = 504
          throw error
        }
        return { text: JSON.stringify({ questions: validQuestionBank() }) }
      },
    },
  }

  const result = await generateQuestions(values(), client)

  assert.equal(result.length, 6)
  assert.equal(modelsUsed.length, 2)
})

test('rejects a question outside the selected domains', async () => {
  const questions = validQuestionBank()
  questions[0].domain = 'Blockchain'
  await assert.rejects(
    generateQuestions(values(), fakeClient(questions, {})),
    /invalid question bank/,
  )
})

test('rejects a generated bank with the wrong question count', async () => {
  await assert.rejects(
    generateQuestions(values(), fakeClient(validQuestionBank().slice(0, 5), {})),
    /invalid question bank/,
  )
})

test('rejects invalid answer choices and answer indexes', async () => {
  const bankWithDuplicateOptions = validQuestionBank()
  const duplicateOptions = bankWithDuplicateOptions[0]
  duplicateOptions.options[3] = duplicateOptions.options[2]
  await assert.rejects(
    generateQuestions(values(), fakeClient(bankWithDuplicateOptions, {})),
    /invalid question bank/,
  )

  const bankWithWrongIndex = validQuestionBank()
  const wrongIndex = bankWithWrongIndex[0]
  wrongIndex.correctOptionIndex = 4
  await assert.rejects(
    generateQuestions(values(), fakeClient(bankWithWrongIndex, {})),
    /invalid question bank/,
  )
})

test('requires balanced question difficulty for adaptive question selection', async () => {
  const bank = validQuestionBank()
  bank[0].difficulty = 'medium'
  await assert.rejects(
    generateQuestions(values(), fakeClient(bank, {})),
    /invalid question bank/,
  )
})

test('requires the backend Gemini API key when no client is injected', async () => {
  const existingKey = process.env.GEMINI_API_KEY
  delete process.env.GEMINI_API_KEY

  try {
    await assert.rejects(
      generateQuestions(values()),
      (error) => error.status === 503 && /GEMINI_API_KEY/.test(error.message),
    )
  } finally {
    if (existingKey) process.env.GEMINI_API_KEY = existingKey
  }
})

test('random mode instructs Gemini to distribute questions across supported domains', () => {
  const instruction = questionSystemInstruction({ ...values(), domainMode: 'random', domains: [] })
  assert.match(instruction, /Random domain mode is enabled/)
  assert.match(instruction, /Blockchain/)
})

test('maps Gemini access, quota, model, and network errors to useful messages', () => {
  assert.match(geminiFailure({ status: 403 }).message, /API key or project access/)
  assert.match(geminiFailure({ status: 429 }).message, /rate limit/)
  assert.match(geminiFailure({ status: 503 }).message, /right now/)
  assert.match(geminiFailure({ status: 504 }).message, /right now/)
  assert.match(geminiFailure({ response: { status: 503 } }).message, /right now/)
  assert.match(geminiFailure({ status: 404 }).message, /GEMINI_MODEL/)
  assert.match(geminiFailure({ cause: { code: 'ENOTFOUND' } }).message, /network connection/)
})
