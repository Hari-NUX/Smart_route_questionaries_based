import { useState } from 'react'
import { login, signup } from '../services/authApi.js'

const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-indigo-950'

function AuthPanel({ onAuthenticated, onThemeToggle, theme }) {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('candidate')
  const [form, setForm] = useState({ fullName: '', email: '', password: '', inviteCode: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isSignup = mode === 'signup'

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const user = isSignup
        ? await signup({ ...form, role })
        : await login({ email: form.email, password: form.password })
      onAuthenticated(user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setError('')
  }

  return (
    <main className="grid min-h-screen bg-slate-50 transition-colors dark:bg-slate-950 lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-indigo-700 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full border border-white/10" />
        <a className="relative text-2xl font-black tracking-tight" href="/">SmartRoute<span className="text-indigo-200">.</span></a>
        <div className="relative max-w-xl pb-8">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">A smarter start to your career</p>
          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight">Find your next opportunity.</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-indigo-100">Explore placements, register in a few steps, and show what you know with an adaptive skills assessment.</p>
        </div>
        <p className="relative text-sm text-indigo-200">Placement discovery, made simpler.</p>
      </aside>

      <section className="flex items-center justify-center px-5 py-10 transition-colors sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between">
            <a className="inline-block text-xl font-black tracking-tight text-indigo-700 lg:hidden" href="/">SmartRoute<span className="text-indigo-400">.</span></a>
            <button aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="ml-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" onClick={onThemeToggle} type="button">{theme === 'dark' ? '☀ Light mode' : '☾ Dark mode'}</button>
          </div>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">{isSignup ? 'Create your account' : 'Welcome back'}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{isSignup ? 'Get started with SmartRoute' : 'Sign in to SmartRoute'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{isSignup ? 'Choose your account type to continue.' : 'Use the email and password linked to your account.'}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
            <button className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`} onClick={() => changeMode('login')} type="button">Sign in</button>
            <button className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`} onClick={() => changeMode('signup')} type="button">Create account</button>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            {isSignup && <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Full name<input className={inputClass} autoComplete="name" maxLength={100} name="fullName" onChange={updateField} required value={form.fullName} /></label>}
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Email address<input className={inputClass} autoComplete="email" name="email" onChange={updateField} required type="email" value={form.email} /></label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Password<input className={inputClass} autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={isSignup ? 8 : 1} name="password" onChange={updateField} required type="password" value={form.password} /></label>
            {isSignup && <>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">I am a
                <select className={inputClass} onChange={(event) => setRole(event.target.value)} value={role}>
                  <option value="candidate">Candidate</option>
                  <option value="admin">Host / Admin</option>
                </select>
              </label>
              {role === 'admin' && <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Host invite code<input className={inputClass} autoComplete="off" name="inviteCode" onChange={updateField} placeholder="Enter the code provided by your project team" required type="password" value={form.inviteCode} /></label><p className="text-xs leading-5 text-slate-500 dark:text-slate-400">This code is only checked when creating a host account. You will sign in later with your email and password.</p></div>}
            </>}
            {error && <p aria-live="polite" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            <button className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-wait disabled:opacity-60" disabled={busy} type="submit">{busy ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}</button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">Your account role controls which placement tools you can access.</p>
        </div>
      </section>
    </main>
  )
}

export default AuthPanel
