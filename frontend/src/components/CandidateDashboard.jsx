import { useEffect, useRef, useState } from 'react'
import {
  getCandidateApplications,
  getCandidatePlacements,
  registerForPlacement,
  startCandidateQuiz,
  submitCandidateAnswer,
} from '../services/placementApi.js'

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function CandidateDashboard({ user, theme, onThemeToggle, onSignOut }) {
  const [placements, setPlacements] = useState([])
  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const [tab, setTab] = useState('browse')
  const [placementsLoading, setPlacementsLoading] = useState(true)
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyPlacement, setBusyPlacement] = useState('')
  const [quizApplication, setQuizApplication] = useState(null)
  const [quizSession, setQuizSession] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [answering, setAnswering] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const searchRequest = useRef(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    getCandidateApplications()
      .then(setApplications)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setApplicationsLoading(false))
  }, [])

  useEffect(() => {
    const requestNumber = ++searchRequest.current
    const timer = setTimeout(() => {
      getCandidatePlacements({ search, sort })
        .then((result) => {
          if (searchRequest.current === requestNumber) setPlacements(result)
        })
        .catch((requestError) => {
          if (searchRequest.current === requestNumber) setError(requestError.message)
        })
        .finally(() => {
          if (searchRequest.current === requestNumber) setPlacementsLoading(false)
        })
    }, 200)

    return () => clearTimeout(timer)
  }, [search, sort])

  async function register(placement) {
    setError('')
    setBusyPlacement(placement._id)

    try {
      const application = await registerForPlacement(placement._id)
      setPlacements((current) => current.map((item) => item._id === placement._id
        ? { ...item, registrationCount: (item.registrationCount || 0) + 1 }
        : item))
      const updated = await getCandidateApplications()
      setApplications(updated)
      setTab('applications')
      setError('')
      return application
    } catch (requestError) {
      setError(requestError.message)
      return null
    } finally {
      setBusyPlacement('')
    }
  }

  async function startQuiz(application) {
    setQuizApplication(application)
    setQuizSession(null)
    setQuizError('')
    setFeedback(null)
    setQuizLoading(true)

    try {
      setQuizSession(await startCandidateQuiz(application._id))
    } catch (requestError) {
      setQuizError(requestError.message)
    } finally {
      setQuizLoading(false)
    }
  }

  async function answer(selectedOptionIndex) {
    if (!quizApplication || !quizSession?.question || answering) return
    setAnswering(true)
    setQuizError('')

    try {
      const result = await submitCandidateAnswer(
        quizApplication._id,
        quizSession.question.questionNumber - 1,
        selectedOptionIndex,
      )
      setFeedback(result)
      setQuizSession(result.completed
        ? { completed: true, score: result.score, totalQuestions: result.totalQuestions }
        : { completed: false, score: result.score, question: result.nextQuestion })

      if (result.completed) {
        setApplications((current) => current.map((item) => item._id === quizApplication._id
          ? { ...item, status: 'completed', score: result.score }
          : item))
      }
    } catch (requestError) {
      setQuizError(requestError.message)
    } finally {
      setAnswering(false)
    }
  }

  function applicationFor(placementId) {
    return applications.find((item) => item.placement?._id === placementId)
  }

  function closeQuiz() {
    setQuizApplication(null)
    setQuizSession(null)
    setQuizError('')
    setFeedback(null)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div><a className="text-2xl font-black tracking-tight text-indigo-700 dark:text-indigo-400" href="/">SmartRoute<span className="text-slate-400">.</span></a><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Candidate workspace</p></div>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">{user.fullName}</span><button aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" onClick={onThemeToggle}>{theme === 'dark' ? '☀ Light' : '☾ Dark'}</button><button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" onClick={onSignOut}>Sign out</button></div>
        </header>

        <section className="mb-8 rounded-3xl bg-gradient-to-r from-indigo-700 to-violet-700 p-7 text-white shadow-lg shadow-indigo-950/10 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Your next opportunity</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Build your placement path, {user.fullName}.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">Find a placement, register before the deadline, and take its adaptive question assessment.</p>
        </section>

        <div className="mb-6 flex gap-2 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-900 sm:w-fit">
          <button className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${tab === 'browse' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`} onClick={() => setTab('browse')}>Explore placements</button>
          <button className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${tab === 'applications' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`} onClick={() => setTab('applications')}>My applications <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{applications.length}</span></button>
        </div>

        {error && <p aria-live="polite" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</p>}

        {tab === 'browse' && <>
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="sr-only" htmlFor="placement-search">Search placements</label>
            <input className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-950" id="placement-search" onChange={(event) => { setError(''); setPlacementsLoading(true); setSearch(event.target.value) }} placeholder="Search by company, role, or description" value={search} />
            <select aria-label="Sort placements" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" onChange={(event) => { setPlacementsLoading(true); setSort(event.target.value) }} value={sort}><option value="recent">Recently posted</option><option value="deadline">Deadline soonest</option></select>
          </div>
          {placementsLoading && <p className="py-8 text-sm text-slate-500 dark:text-slate-400">Loading placements...</p>}
          {!placementsLoading && placements.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700"><p className="font-semibold text-slate-800 dark:text-slate-200">No open placements found</p><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try another search or check again when new roles are published.</p></div>}
          <div className="grid gap-5 lg:grid-cols-2">
            {placements.map((placement) => {
              const application = applicationFor(placement._id)
              const opens = new Date(placement.registrationOpensAt)
              const deadline = new Date(placement.registrationDeadline)
              const now = currentTime
              const full = (placement.registrationCount || 0) >= placement.registrationLimit
              const available = now >= opens.getTime() && now < deadline.getTime() && !full

              return <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7" key={placement._id}>
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">{placement.companyName}</p><h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">{placement.title}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{placement.location}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${application ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200' : full ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : available ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>{application ? 'Registered' : full ? 'Full' : available ? 'Open' : 'Upcoming'}</span></div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{placement.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">{(placement.domainMode === 'random' ? ['Random CSE domains'] : placement.domains).map((domain) => <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" key={domain}>{domain}</span>)}</div>
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs dark:bg-slate-950"><div><p className="text-slate-500 dark:text-slate-400">Register by</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{formatDate(placement.registrationDeadline)}</p></div><div><p className="text-slate-500 dark:text-slate-400">Available seats</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{Math.max(0, placement.registrationLimit - (placement.registrationCount || 0))} of {placement.registrationLimit}</p></div><div><p className="text-slate-500 dark:text-slate-400">Assessment</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{placement.questionCount} questions</p></div><div><p className="text-slate-500 dark:text-slate-400">Starts at</p><p className="mt-1 font-semibold capitalize text-slate-800 dark:text-slate-200">{placement.difficulty}</p></div></div>
                <div className="mt-5">{application ? <button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700" onClick={() => startQuiz(application)}>{application.status === 'completed' ? `View score · ${application.score}/${placement.questionCount}` : application.status === 'in_progress' ? 'Resume assessment' : 'Start assessment'}</button> : <button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={!available || busyPlacement === placement._id} onClick={() => register(placement)}>{busyPlacement === placement._id ? 'Registering...' : full ? 'Registration full' : available ? 'Register for placement' : now < opens.getTime() ? `Opens ${formatDate(placement.registrationOpensAt)}` : 'Registration closed'}</button>}</div>
              </article>
            })}
          </div>
        </>}

        {tab === 'applications' && <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your applications</h2>{applicationsLoading && <p className="py-8 text-sm text-slate-500 dark:text-slate-400">Loading applications...</p>}{!applicationsLoading && applications.length === 0 && <p className="py-10 text-sm text-slate-500 dark:text-slate-400">You have not registered for a placement yet.</p>}<div className="mt-5 grid gap-4 md:grid-cols-2">{applications.map((application) => <article className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700" key={application._id}><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{application.placement?.companyName}</p><h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{application.placement?.title}</h3><p className="mt-2 text-sm capitalize text-slate-500 dark:text-slate-400">Status: {application.status.replace('_', ' ')}</p>{application.status === 'completed' && <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Score: {application.score}/{application.placement?.questionCount}</p>}<button className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white" onClick={() => startQuiz(application)}>{application.status === 'completed' ? 'View result' : application.status === 'in_progress' ? 'Resume assessment' : 'Start assessment'}</button></article>)}</div></section>}

        {quizApplication && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" role="presentation"><section aria-labelledby="quiz-title" aria-modal="true" className="my-6 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-9" role="dialog"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Adaptive placement quiz</p><h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white" id="quiz-title">{quizApplication.placement?.title}</h2></div><button aria-label="Close assessment" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300" onClick={closeQuiz}>Close</button></div>
          {quizLoading && <p className="py-14 text-center text-sm text-slate-500 dark:text-slate-400">Preparing your question...</p>}
          {quizError && <p aria-live="polite" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{quizError}</p>}
          {!quizLoading && quizSession?.completed && <div className="py-10 text-center"><p className="text-sm font-bold uppercase tracking-[0.15em] text-emerald-600">Assessment complete</p><p className="mt-4 text-5xl font-black text-slate-900 dark:text-white">{quizSession.score}<span className="text-2xl text-slate-400">/{quizSession.totalQuestions}</span></p><p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Your final score has been saved.</p><button className="mt-7 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white" onClick={closeQuiz}>Return to placements</button></div>}
          {!quizLoading && !quizSession?.completed && quizSession?.question && <div className="mt-7"><div className="mb-5 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400"><span>Question {quizSession.question.questionNumber} of {quizSession.question.totalQuestions}</span><span>{quizSession.question.domain} · <span className="capitalize">{quizSession.question.difficulty}</span></span></div><div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${(quizSession.question.questionNumber / quizSession.question.totalQuestions) * 100}%` }} /></div>{feedback && <div className={`mb-5 rounded-2xl border p-4 text-sm ${feedback.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'}`}><p className="font-bold">{feedback.isCorrect ? 'Correct' : `Not quite · correct answer ${String.fromCharCode(65 + feedback.correctOptionIndex)}`}</p><p className="mt-1 leading-6">{feedback.explanation}</p></div>}<h3 className="text-lg font-semibold leading-7 text-slate-900 dark:text-white">{quizSession.question.question}</h3><div className="mt-5 space-y-3">{quizSession.question.options.map((option, index) => <button className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 px-4 py-4 text-left text-sm leading-6 text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-950" disabled={answering} key={`${quizSession.question.questionNumber}-${index}`} onClick={() => answer(index)}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold dark:bg-slate-800">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div>{answering && <p aria-live="polite" className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">Checking your answer and selecting the next question...</p>}{quizError && <button className="mt-4 text-sm font-semibold text-indigo-600" onClick={() => startQuiz(quizApplication)}>Reload current question</button>}<p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Current score: {quizSession.score}/{quizSession.question.totalQuestions}</p></div>}
        </section></div>}
      </div>
    </main>
  )
}

export default CandidateDashboard
