import assert from 'node:assert/strict'
import test from 'node:test'
import { placementSchema } from '../src/controllers/placementController.js'
import { requireRole } from '../src/middleware/authenticate.js'
import Placement from '../src/models/Placement.js'

function validPlacement() {
  const opens = new Date(Date.now() + 60 * 60 * 1000)
  const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000)

  return {
    companyName: 'Northstar Labs',
    title: 'Graduate Software Engineer',
    description: 'Join our engineering team to build reliable products for customers.',
    location: 'Bengaluru',
    domainMode: 'specific',
    domains: ['CSE', 'DBMS'],
    registrationOpensAt: opens,
    registrationDeadline: deadline,
    registrationLimit: 40,
    questionCount: 5,
    difficulty: 'medium',
    randomnessPercent: 30,
  }
}

test('accepts a complete placement configuration', () => {
  const result = placementSchema.safeParse(validPlacement())
  assert.equal(result.success, true)
})

test('requires at least one domain when specific mode is selected', () => {
  const result = placementSchema.safeParse({ ...validPlacement(), domains: [] })
  assert.equal(result.success, false)
  assert.match(result.error.issues[0].message, /Choose at least one question domain/)
})

test('rejects a deadline before registration opens', () => {
  const values = validPlacement()
  values.registrationDeadline = new Date(values.registrationOpensAt.getTime() - 1000)
  const result = placementSchema.safeParse(values)
  assert.equal(result.success, false)
  assert.equal(result.error.issues.some((issue) => /Deadline must be after/.test(issue.message)), true)
})

test('accepts custom question counts from one through fifty', () => {
  const single = placementSchema.safeParse({ ...validPlacement(), questionCount: 1 })
  const extended = placementSchema.safeParse({ ...validPlacement(), questionCount: 50 })
  assert.equal(single.success, true)
  assert.equal(extended.success, true)
})

test('rejects question counts and registration limits outside their bounds', () => {
  const countTooLow = placementSchema.safeParse({ ...validPlacement(), questionCount: 0 })
  const countTooHigh = placementSchema.safeParse({ ...validPlacement(), questionCount: 51 })
  const noCapacity = placementSchema.safeParse({ ...validPlacement(), registrationLimit: 0 })
  assert.equal(countTooLow.success, false)
  assert.equal(countTooHigh.success, false)
  assert.equal(noCapacity.success, false)
})

test('blocks candidates from host-only placement actions', () => {
  let statusCode
  let responseBody
  let continued = false
  const response = {
    status(code) {
      statusCode = code
      return this
    },
    json(body) {
      responseBody = body
      return this
    },
  }

  requireRole('admin')({ user: { role: 'candidate' } }, response, () => {
    continued = true
  })

  assert.equal(statusCode, 403)
  assert.equal(responseBody.message, 'You do not have access to this resource')
  assert.equal(continued, false)
})

test('keeps the generated question bank excluded from normal placement reads', () => {
  assert.equal(Placement.schema.path('questionBank').options.select, false)
})
