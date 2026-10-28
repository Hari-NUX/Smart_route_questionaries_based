import { useCallback, useEffect, useState } from 'react'
import PlacementForm from './PlacementForm.jsx'
import PlacementApplicants from './PlacementApplicants.jsx'
import { getHostPlacements } from '../services/placementApi.js'

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function HostDashboard({ user, theme, onThemeToggle, onSignOut }) {
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [openApplicantsId, setOpenApplicantsId] = useState('')

  useEffect(() => {
    getHostPlacements()
      .then(setPlacements)
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false))
  }, [])

  function addPlacement(placement) {
    setPlacements((current) => [placement, ...current])
  }

  const updateRegistrationCount = useCallback((placementId, registrationCount) => {
    setPlacements((current) => current.map((placement) => placement._id === placementId
      ? { ...placement, registrationCount }
      : placement))
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <a className="text-2xl font-black tracking-tight text-indigo-700 dark:text-indigo-400" href="/">SmartRoute<span className="text-slate-400">.</span></a>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Host workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">{user.fullName}</span>
            <button aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" onClick={onThemeToggle}>{theme === 'dark' ? '☀ Light' : '☾ Dark'}</button>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" onClick={onSignOut}>Sign out</button>
          </div>
        </header>

        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 to-violet-700 p-7 text-white shadow-lg shadow-indigo-950/10 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Placement management</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Create your next opportunity, {user.fullName}.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">Publish placement details and configure the adaptive CSE assessment. Candidates can discover roles, register, and complete their quizzes from their workspace.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/15 px-4 py-2">{placements.length} {placements.length === 1 ? 'placement' : 'placements'} created</span>
            <span className="rounded-full bg-white/15 px-4 py-2">{user.email}</span>
          </div>
        </section>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <PlacementForm onCreated={addPlacement} />
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Your workspace</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Your placements</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{placements.length}</span>
            </div>

            {loading && <p className="py-8 text-sm text-slate-500 dark:text-slate-400">Loading placements...</p>}
            {loadError && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{loadError}</p>}
            {!loading && !loadError && placements.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-xl text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">＋</div><p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">No placements yet</p><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Complete the form to publish your first placement.</p></div>}
            <div className="space-y-4">
              {placements.map((placement) => <article className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700" key={placement._id}>
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{placement.companyName}</p><h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{placement.title}</h3></div><span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Published</span></div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{placement.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">{(placement.domainMode === 'random' ? ['Random CSE'] : placement.domains).map((domain) => <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" key={domain}>{domain}</span>)}</div>
                <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-slate-100 pt-4 text-xs dark:border-slate-800"><div><dt className="text-slate-500 dark:text-slate-400">Location</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{placement.location}</dd></div><div><dt className="text-slate-500 dark:text-slate-400">Candidates registered</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{placement.registrationCount || 0} / {placement.registrationLimit}</dd></div><div><dt className="text-slate-500 dark:text-slate-400">Opens</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{formatDate(placement.registrationOpensAt)}</dd></div><div><dt className="text-slate-500 dark:text-slate-400">Deadline</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{formatDate(placement.registrationDeadline)}</dd></div></dl>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{placement.questionCount} quiz questions · {placement.questionPoolSize || 0} generated choices · {placement.difficulty} start · {placement.randomnessPercent}% difficulty randomness</p>
                <button aria-expanded={openApplicantsId === placement._id} className="mt-5 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950" onClick={() => setOpenApplicantsId((current) => current === placement._id ? '' : placement._id)}>{openApplicantsId === placement._id ? 'Hide candidates' : 'View candidates and scores'}</button>
                {openApplicantsId === placement._id && <PlacementApplicants onCountChange={updateRegistrationCount} placement={placement} />}
              </article>)}
            </div>
          </section>
        </div>
        <p className="mx-auto mt-8 max-w-4xl text-center text-xs leading-5 text-slate-500 dark:text-slate-500">Placement creation, Gemini question generation, candidate discovery, registration enforcement, and adaptive quiz delivery are ready.</p>
      </div>
    </main>
  )
}

export default HostDashboard
