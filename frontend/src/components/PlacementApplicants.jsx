import { useEffect, useState } from 'react'
import { getPlacementApplicants } from '../services/placementApi.js'

function PlacementApplicants({ placement, onCountChange }) {
  const [order, setOrder] = useState('highest')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPlacementApplicants(placement._id, order)
      .then((response) => {
        if (active) {
          setResult(response)
          onCountChange(placement._id, response.registrationCount)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [onCountChange, placement._id, order])

  function changeOrder(event) {
    setError('')
    setLoading(true)
    setOrder(event.target.value)
  }

  return (
    <section className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">Candidate registrations</h4>
          {result && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{result.registrationCount} of {result.registrationLimit} registered</p>}
        </div>
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sort by score
          <select aria-label="Sort candidates by score" className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" onChange={changeOrder} value={order}>
            <option value="highest">Highest first</option>
            <option value="lowest">Lowest first</option>
          </select>
        </label>
      </div>
      {loading && <p className="py-5 text-sm text-slate-500 dark:text-slate-400">Loading candidate registrations...</p>}
      {error && <p aria-live="polite" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
      {!loading && !error && result?.applicants.length === 0 && <p className="py-5 text-sm text-slate-500 dark:text-slate-400">No candidates have registered yet.</p>}
      {!loading && !error && result?.applicants.length > 0 && <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {result.applicants.map((applicant) => <article className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1" key={applicant.id}>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{applicant.candidate?.fullName || 'Candidate account unavailable'}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{applicant.candidate?.email} · Registered {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(applicant.registeredAt))}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-indigo-700 dark:text-indigo-300">{applicant.status === 'completed' ? `${applicant.score}/${result.questionCount}` : applicant.status === 'in_progress' ? `${applicant.score}/${result.questionCount} · In progress` : 'Not started'}</p>
            <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">{applicant.status.replace('_', ' ')}</p>
          </div>
        </article>)}
      </div>}
    </section>
  )
}

export default PlacementApplicants
