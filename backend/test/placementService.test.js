import assert from 'node:assert/strict'
import test from 'node:test'
import Application from '../src/models/Application.js'
import Placement from '../src/models/Placement.js'
import { buildSearchPattern, listPlacementApplicants } from '../src/services/placementService.js'

test('search matches case-insensitive word starts without matching inside DevOps', () => {
  const pattern = new RegExp(buildSearchPattern('OPS'), 'i')

  assert.equal(pattern.test('OPS Engineer'), true)
  assert.equal(pattern.test('devops engineer'), false)
  assert.equal(new RegExp(buildSearchPattern('op'), 'i').test('Operating Systems'), true)
  assert.equal(new RegExp(buildSearchPattern('o'), 'i').test('Operating Systems'), true)
  assert.equal(new RegExp(buildSearchPattern('.*'), 'i').test('anything'), false)
})

test('host applicant results are scoped to the owning placement and sorted by requested score order', async () => {
  const originalPlacementFindOne = Placement.findOne
  const originalApplicationFind = Application.find
  const hostId = 'host-id'
  const placementId = 'placement-id'
  let applicationQuery
  let sortOrder

  Placement.findOne = (query) => {
    assert.deepEqual(query, { _id: placementId, createdBy: hostId })
    return {
      select() { return this },
      async lean() { return { questionCount: 5, registrationLimit: 20 } },
    }
  }

  Application.find = (query) => {
    applicationQuery = query
    return {
      select() { return this },
      populate() { return this },
      sort(order) { sortOrder = order; return this },
      async lean() {
        return [{
          _id: 'application-id',
          candidate: { fullName: 'Candidate One', email: 'candidate@example.test' },
          status: 'completed',
          score: 4,
          registeredAt: new Date('2026-10-29T00:00:00.000Z'),
          startedAt: null,
          completedAt: null,
          answers: [{ selectedOptionIndex: 3 }],
        }]
      },
    }
  }

  try {
    const result = await listPlacementApplicants(hostId, placementId, 'lowest')

    assert.deepEqual(applicationQuery, { placement: placementId })
    assert.deepEqual(sortOrder, { score: 1, registeredAt: 1 })
    assert.equal(result.registrationCount, 1)
    assert.equal(result.applicants[0].candidate.fullName, 'Candidate One')
    assert.equal(result.applicants[0].score, 4)
    assert.equal('answers' in result.applicants[0], false)
  } finally {
    Placement.findOne = originalPlacementFindOne
    Application.find = originalApplicationFind
  }
})
