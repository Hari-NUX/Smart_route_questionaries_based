import { useState } from 'react'
import { createPlacement } from '../services/placementApi.js'

const domains = [
  'CSE', 'Data Structures', 'Algorithms', 'DSA', 'OOP', 'Java', 'Python', 'C', 'C++',
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express.js', 'HTML & CSS',
  'Full-Stack Development', 'REST APIs', 'DBMS', 'SQL', 'Operating Systems',
  'Computer Networks', 'Computer Architecture', 'Software Engineering', 'System Design',
  'Cybersecurity', 'Cloud Computing', 'DevOps', 'Git & Version Control', 'Testing & QA',
  'AI', 'Machine Learning', 'Data Science', 'Generative AI', 'Prompt Engineering', 'Blockchain',
]
const fieldClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-indigo-950'

function localDateTime(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function initialForm() {
  const now = new Date()
  const opens = new Date(now.getTime() + 2 * 60 * 1000)
  const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  return {
    companyName: '',
    title: '',
    description: '',
    location: '',
    domainMode: 'specific',
    domains: [],
    registrationOpensAt: localDateTime(opens),
    registrationDeadline: localDateTime(deadline),
    registrationLimit: '40',
    questionCount: '5',
    difficulty: 'medium',
    randomnessPercent: 30,
  }
}

function PlacementForm({ onCreated }) {
  const [form, setForm] = useState(initialForm)
  const [domainSearch, setDomainSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  function update(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function toggleDomain(domain) {
    setForm((current) => ({
      ...current,
      domains: current.domains.includes(domain)
        ? current.domains.filter((item) => item !== domain)
        : [...current.domains, domain],
    }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const placement = await createPlacement({
        ...form,
        domains: form.domainMode === 'random' ? [] : form.domains,
        registrationOpensAt: new Date(form.registrationOpensAt).toISOString(),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        registrationLimit: Number(form.registrationLimit),
        questionCount: Number(form.questionCount),
        randomnessPercent: Number(form.randomnessPercent),
      })
      onCreated(placement)
      setSuccess(`Placement published. Gemini prepared ${placement.questionPoolSize} questions for the ${placement.questionCount}-question adaptive quiz.`)
      setForm(initialForm())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">New opportunity</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create a placement</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Gemini prepares easy, medium, and hard question options before publishing. During the quiz, the backend selects the next question immediately after each answer, without another Gemini request.</p>
      </div>

      <form className="space-y-6" onSubmit={submit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Company name<input className={fieldClass} maxLength={100} name="companyName" onChange={update} placeholder="e.g. Northstar Labs" required value={form.companyName} /></label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Role title<input className={fieldClass} maxLength={120} name="title" onChange={update} placeholder="e.g. Graduate Software Engineer" required value={form.title} /></label>
        </div>

        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Role description<textarea className={`${fieldClass} min-h-28 resize-y`} maxLength={3000} minLength={20} name="description" onChange={update} placeholder="Describe the role, team, and selection process." required value={form.description} /></label>

        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Location<input className={fieldClass} maxLength={120} name="location" onChange={update} placeholder="e.g. Bengaluru · Hybrid" required value={form.location} /></label>

        <fieldset className="min-w-0">
          <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">Question domains <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{form.domainMode === 'random' ? 'Random' : `${form.domains.length} selected`}</span></legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {['specific', 'random'].map((mode) => (
              <button className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${form.domainMode === mode ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300'}`} key={mode} onClick={() => setForm((current) => ({ ...current, domainMode: mode, domains: mode === 'random' ? [] : current.domains }))} type="button">
                {mode === 'specific' ? 'Choose domains' : 'Random CSE domains'}
              </button>
            ))}
          </div>
          {form.domainMode === 'specific' && <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50 sm:p-4">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400" htmlFor="domain-search">Find a domain</label>
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-indigo-950" id="domain-search" onChange={(event) => setDomainSearch(event.target.value)} placeholder="Search 35 CSE domains" value={domainSearch} />
            <div className="domain-picker-scroll mt-3 grid max-h-[min(22rem,45vh)] min-h-40 grid-cols-1 gap-2 overflow-y-auto overscroll-contain pr-2 min-[430px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {domains.filter((domain) => domain.toLowerCase().includes(domainSearch.trim().toLowerCase())).map((domain) => <label className={`flex min-h-12 min-w-0 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${form.domains.includes(domain) ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700'}`} key={domain}><input checked={form.domains.includes(domain)} className="shrink-0 accent-indigo-600" onChange={() => toggleDomain(domain)} type="checkbox" /><span className="min-w-0 break-words">{domain}</span></label>)}
              {domains.every((domain) => !domain.toLowerCase().includes(domainSearch.trim().toLowerCase())) && <p className="col-span-full py-3 text-sm text-slate-500 dark:text-slate-400">No matching CSE domains.</p>}
            </div>
          </div>}
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Random mode chooses from the supported CSE domains during question generation.</p>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Registration opens<input className={fieldClass} name="registrationOpensAt" onChange={update} required type="datetime-local" value={form.registrationOpensAt} /><span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">Candidates can register from this time. New placements default to opening in two minutes.</span></label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Registration deadline<input className={fieldClass} name="registrationDeadline" onChange={update} required type="datetime-local" value={form.registrationDeadline} /></label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Maximum registrations<input className={fieldClass} max="1000" min="1" name="registrationLimit" onChange={update} required type="number" value={form.registrationLimit} /></label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Questions per candidate<input className={fieldClass} max="50" min="1" name="questionCount" onChange={update} required type="number" value={form.questionCount} /><span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">Choose 1 to 50 questions. The limit keeps generation time and API usage bounded.</span></label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Starting difficulty<select className={fieldClass} name="difficulty" onChange={update} value={form.difficulty}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Difficulty randomness <span className="ml-1 text-indigo-600">{form.randomnessPercent}%</span><input className="mt-4 block w-full accent-indigo-600" max="100" min="0" name="randomnessPercent" onChange={update} type="range" value={form.randomnessPercent} /><span className="mt-1 flex justify-between text-xs font-normal text-slate-500 dark:text-slate-400"><span>Predictable</span><span>More varied</span></span><span className="mt-2 block text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">At 0%, answers move one difficulty step. Higher settings can skip an extra step.</span></label>
        </div>

        {error && <p aria-live="polite" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
        {success && <p aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{success}</p>}
        <button className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-wait disabled:opacity-60 sm:w-auto" disabled={saving} type="submit">{saving ? 'Generating questions and publishing...' : 'Generate questions & publish'}</button>
      </form>
    </section>
  )
}

export default PlacementForm
