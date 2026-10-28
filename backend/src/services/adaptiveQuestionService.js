export const difficultyLevels = ['easy', 'medium', 'hard']

export function difficultyIndex(difficulty) {
  return difficultyLevels.indexOf(difficulty)
}

export function selectInitialQuestion(questionBank, difficulty, random = Math.random) {
  const candidates = questionBank
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => question.difficulty === difficulty)

  if (!candidates.length) {
    throw new Error(`Question bank is missing ${difficulty} questions`)
  }

  return candidates[Math.floor(random() * candidates.length)].index
}

export function updateDomainDifficulty(currentLevel, isCorrect, randomnessPercent, random = Math.random) {
  const jump = random() * 100 < randomnessPercent ? 2 : 1
  const direction = isCorrect ? 1 : -1
  return Math.max(0, Math.min(2, currentLevel + direction * jump))
}

export function selectNextQuestion(questionBank, usedIndexes, domain, targetLevel, random = Math.random) {
  const used = new Set(usedIndexes)
  const unusedQuestions = questionBank
    .map((question, index) => ({ question, index }))
    .filter(({ index }) => !used.has(index))

  if (!unusedQuestions.length) {
    throw new Error('Question bank has no unused questions')
  }

  const targetDifficulty = difficultyLevels[targetLevel]
  const sameDomainAtTarget = unusedQuestions.filter(({ question }) => question.domain === domain && question.difficulty === targetDifficulty)
  const anyDomainAtTarget = unusedQuestions.filter(({ question }) => question.difficulty === targetDifficulty)
  const sameDomain = unusedQuestions.filter(({ question }) => question.domain === domain)
  const preferred = sameDomainAtTarget.length
    ? sameDomainAtTarget
    : anyDomainAtTarget.length
      ? anyDomainAtTarget
      : sameDomain.length
        ? sameDomain
        : unusedQuestions
  const closestDistance = Math.min(...preferred.map(({ question }) => Math.abs(difficultyIndex(question.difficulty) - targetLevel)))
  const closest = preferred.filter(({ question }) => Math.abs(difficultyIndex(question.difficulty) - targetLevel) === closestDistance)

  return closest[Math.floor(random() * closest.length)].index
}
