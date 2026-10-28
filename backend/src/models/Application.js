import mongoose from 'mongoose'
import { placementDomains } from './Placement.js'

const answerSchema = new mongoose.Schema(
  {
    questionPoolIndex: { type: Number, required: true },
    selectedOptionIndex: { type: Number, required: true, min: 0, max: 3 },
    isCorrect: { type: Boolean, required: true },
    domain: { type: String, enum: placementDomains, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    answeredAt: { type: Date, required: true },
  },
  { _id: false },
)

const domainDifficultySchema = new mongoose.Schema(
  {
    domain: { type: String, enum: placementDomains, required: true },
    level: { type: Number, min: 0, max: 2, required: true },
  },
  { _id: false },
)

const applicationSchema = new mongoose.Schema(
  {
    placement: { type: mongoose.Schema.Types.ObjectId, ref: 'Placement', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['registered', 'in_progress', 'completed'], default: 'registered', required: true },
    registeredAt: { type: Date, default: Date.now, required: true },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    currentQuestionIndex: { type: Number, default: -1, min: -1 },
    questionOrder: { type: [Number], default: [] },
    answers: { type: [answerSchema], default: [] },
    domainDifficulty: { type: [domainDifficultySchema], default: [] },
    score: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

applicationSchema.index({ candidate: 1, placement: 1 }, { unique: true })
applicationSchema.index({ placement: 1, score: -1 })

export default mongoose.model('Application', applicationSchema)
