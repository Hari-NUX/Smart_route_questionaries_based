import dotenv from 'dotenv'
import { generateQuestions } from '../src/services/geminiQuestionService.js'

dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true })

const questionBank = await generateQuestions({
  companyName: 'SmartRoute live verification',
  title: 'CSE placement question generation check',
  description: 'Generate an easy, medium, and hard computer science multiple choice question for validating adaptive quiz generation.',
  location: 'Remote',
  domainMode: 'specific',
  domains: ['CSE'],
  questionCount: 1,
  difficulty: 'medium',
  randomnessPercent: 0,
})

const difficultySet = [...new Set(questionBank.map((question) => question.difficulty))].sort()
process.stdout.write(`Live Gemini check passed: ${questionBank.length} validated questions across ${difficultySet.join(', ')}.\n`)
