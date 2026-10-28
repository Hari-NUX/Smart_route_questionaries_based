import assert from 'node:assert/strict'
import test from 'node:test'
import { selectInitialQuestion, selectNextQuestion, updateDomainDifficulty } from '../src/services/adaptiveQuestionService.js'

const bank = [
  { domain: 'AI', difficulty: 'easy' },
  { domain: 'AI', difficulty: 'medium' },
  { domain: 'AI', difficulty: 'hard' },
  { domain: 'DBMS', difficulty: 'easy' },
  { domain: 'DBMS', difficulty: 'medium' },
  { domain: 'DBMS', difficulty: 'hard' },
]

test('starts at the host selected difficulty', () => {
  const index = selectInitialQuestion(bank, 'medium', () => 0)
  assert.equal(bank[index].difficulty, 'medium')
})

test('correct answers raise the next target difficulty', () => {
  const nextLevel = updateDomainDifficulty(1, true, 0, () => 0.5)
  const nextQuestionIndex = selectNextQuestion(bank, [1], 'AI', nextLevel, () => 0)
  assert.equal(bank[nextQuestionIndex].domain, 'AI')
  assert.equal(bank[nextQuestionIndex].difficulty, 'hard')
})

test('incorrect answers lower the next target difficulty', () => {
  const nextLevel = updateDomainDifficulty(1, false, 0, () => 0.5)
  const nextQuestionIndex = selectNextQuestion(bank, [1], 'AI', nextLevel, () => 0)
  assert.equal(bank[nextQuestionIndex].domain, 'AI')
  assert.equal(bank[nextQuestionIndex].difficulty, 'easy')
})

test('randomness can skip an additional level but difficulty stays bounded', () => {
  assert.equal(updateDomainDifficulty(1, true, 100, () => 0), 2)
  assert.equal(updateDomainDifficulty(2, true, 100, () => 0), 2)
  assert.equal(updateDomainDifficulty(1, false, 100, () => 0), 0)
  assert.equal(updateDomainDifficulty(0, false, 100, () => 0), 0)
})

test('does not repeat a previously served question', () => {
  const nextQuestionIndex = selectNextQuestion(bank, [1, 2], 'AI', 2, () => 0)
  assert.equal(nextQuestionIndex, 5)
  assert.equal(bank[nextQuestionIndex].difficulty, 'hard')
  assert.notEqual(nextQuestionIndex, 1)
  assert.notEqual(nextQuestionIndex, 2)
})
