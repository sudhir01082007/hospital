'use client'

import { useState } from 'react'
import {
  Cross,
  Mail,
  ArrowRight,
  ShieldCheck,
  Siren,
  BedDouble,
  Sparkles,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface LoginViewProps {
  onLogin: (email: string) => void
  defaultEmail?: string
}

type AuthView = 'login' | 'register' | 'forgot'

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export function LoginView({ onLogin }: LoginViewProps) {
  const [view, setView] = useState<AuthView>('login')

  // ── Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPw, setShowLoginPw] = useState(false)

  // ── Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showRegPw, setShowRegPw] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)

  // ── Forgot password field
  const [forgotEmail, setForgotEmail] = useState('')

  // ── Shared UI state
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const switchView = (v: AuthView) => {
    setView(v)
    setError('')
    setSuccess('')
  }

  // ── Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimEmail = loginEmail.trim()
    if (!trimEmail) return setError('Please enter your email address.')
    if (!validateEmail(trimEmail)) return setError('Please enter a valid email address (e.g. patient@example.com).')
    if (!loginPassword) return setError('Please enter your password.')

    setIsLoading(true)
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: trimEmail,
      password: loginPassword,
    })
    setIsLoading(false)

    if (authError || !data.user) {
      // Log the real error in dev so you can diagnose the actual cause
      if (process.env.NODE_ENV !== 'production') {
        console.error('[SwasthyaConnect Auth] Login error:', authError)
      }

      // Map common Supabase error messages to actionable user guidance
      const msg = authError?.message?.toLowerCase() ?? ''
      if (msg.includes('email not confirmed')) {
        setError('Your email address is not yet confirmed. Please check your inbox for a verification link from Supabase and click it before signing in.')
      } else if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
        setError('Incorrect email or password. Please double-check your credentials.')
      } else if (msg.includes('rate limit') || msg.includes('too many requests') || authError?.status === 429) {
        setError('Too many login attempts. Please wait a few minutes and try again.')
      } else if (msg.includes('fetch failed') || msg.includes('failed to fetch') || authError?.status === 0) {
        setError('Unable to reach the authentication server. Please check your internet connection and try again.')
      } else if (authError?.message) {
        // Surface the real Supabase message for any other error
        setError(`Sign-in failed: ${authError.message}`)
      } else {
        setError('Sign-in failed. Please try again or contact support.')
      }
      return
    }

    onLogin(data.user.email!)
  }

  // ── Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!regName.trim()) return setError('Please enter your full name.')
    if (!validateEmail(regEmail)) return setError('Please enter a valid email address.')
    if (regPassword.length < 6) return setError('Password must be at least 6 characters.')
    if (regPassword !== regConfirm) return setError('Passwords do not match.')

    setIsLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: { data: { full_name: regName.trim() } },
      })

      if (authError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[SwasthyaConnect Auth] Registration error:', authError)
        }

        const msg = authError.message?.toLowerCase() ?? ''
        const status = authError.status ?? 0

        if (status === 429 || msg.includes('rate limit') || msg.includes('email rate limit')) {
          // Supabase free tier: max 3 confirmation emails per hour per project
          setError(
            'Too many signup attempts — Supabase limits confirmation emails to 3 per hour on the free plan. ' +
            'Please wait 60 minutes before trying again, or sign in if you already have an account.'
          )
        } else if (
          authError.name === 'AuthRetryableFetchError' ||
          msg.includes('fetch failed') ||
          msg.includes('failed to fetch') ||
          status === 0
        ) {
          setError(
            'Could not reach the authentication server. Please check your internet connection and try again.'
          )
        } else if (msg.includes('weak password') || authError.name === 'AuthWeakPasswordError') {
          setError('Password is too weak. Please use at least 8 characters with a mix of letters and numbers.')
        } else if (msg.includes('already registered') || msg.includes('user already exists')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(authError.message || 'Registration failed. Please try again.')
        }
        return
      }

      if (data.session) {
        // Email confirmation disabled in Supabase — user is logged in immediately
        onLogin(data.user!.email!)
      } else {
        // Email confirmation is ON: Supabase sends a verification link.
        // The user must click it before they can sign in.
        setSuccess(
          'Account created! A verification email has been sent to ' +
          regEmail.trim() +
          '. Click the link in that email, then come back here to sign in.'
        )
      }
    } catch (unexpectedError: unknown) {
      // Catch AuthRetryableFetchError and any other SDK exceptions that are
      // thrown instead of returned — prevents the Next.js dev error overlay.
      if (process.env.NODE_ENV !== 'production') {
        console.error('[SwasthyaConnect Auth] Unexpected registration exception:', unexpectedError)
      }
      const errMsg = unexpectedError instanceof Error ? unexpectedError.message.toLowerCase() : ''
      if (errMsg.includes('rate limit') || errMsg.includes('email rate limit')) {
        setError(
          'Too many signup attempts — Supabase limits confirmation emails to 3 per hour on the free plan. ' +
          'Please wait 60 minutes before trying again.'
        )
      } else if (
        errMsg.includes('fetch') ||
        errMsg.includes('network') ||
        errMsg.includes('failed to fetch')
      ) {
        setError('Network error — could not reach the authentication server. Please check your connection.')
      } else {
        setError('An unexpected error occurred during registration. Please try again in a moment.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Forgot password handler
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const trimEmail = forgotEmail.trim()
    if (!validateEmail(trimEmail)) return setError('Please enter a valid email address.')

    setIsLoading(true)
    const { error: authError } = await supabase.auth.resetPasswordForEmail(trimEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setIsLoading(false)

    if (authError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[SwasthyaConnect Auth] Password reset error:', authError)
      }
      setError(authError.message || 'Unable to send reset email. Please try again.')
      return
    }

    setSuccess('Password reset link sent! Please check your email inbox.')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header className="border-b border-border/80 bg-card/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Cross className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-foreground text-base sm:text-lg">
                SwasthyaConnect
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                AI Patient Portal
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Integrated Tamil Nadu Healthcare Resource &amp; Emergency Triage Grid
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Healthcare Radar:</span>
          <span className="text-foreground font-bold">Online</span>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-12 items-center">

          {/* Left Column: Portal Features */}
          <div className="hidden lg:flex lg:col-span-6 flex-col gap-6 pr-4">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Unified Patient Access &amp; Tele-Triage
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Personalized healthcare intelligence for every patient.
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in to access your personalized live hospital bed radar, digital OPD queue passes,
              emergency SOS settings, and verified clinical records.
            </p>

            <div className="grid gap-3.5">
              <div className="flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">User-Wise Clinical Profile Isolation</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Appointments, digital passes, and emergency contacts are securely organized by your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <Siren className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">24/7 Fast-Track Emergency 108 Dispatch</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Automated GPS pre-alerts to Chennai trauma centers and designated family emergency contacts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700">
                  <BedDouble className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Real-Time Bed &amp; ICU Availability</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Live telemetry across Apollo, GGH, Fortis, and government super-specialty hospitals.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>ABDM Ayushman Bharat Digital Health Compatible · 256-Bit SSL Encrypted</span>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-primary via-teal-500 to-emerald-500" />

              {/* ── Error / Success banners */}
              {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <p>{success}</p>
                </div>
              )}

              {/* ══════════════════════════════════
                  LOGIN VIEW
              ══════════════════════════════════ */}
              {view === 'login' && (
                <>
                  <div className="mb-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      <Lock className="size-3" /> Secure Patient Login
                    </span>
                    <h2 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      Sign in to Patient Portal
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter your registered email and password to access your medical records.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4" noValidate>
                    {/* Email */}
                    <div>
                      <label htmlFor="login-email" className="block text-xs font-semibold text-foreground mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                        <input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => { setLoginEmail(e.target.value); setError('') }}
                          placeholder="patient@example.com"
                          autoComplete="email"
                          autoFocus
                          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      {loginEmail && !validateEmail(loginEmail) && (
                        <p className="mt-1 text-[11px] text-destructive">Please enter a valid email address</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="login-password" className="block text-xs font-semibold text-foreground">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => switchView('forgot')}
                          className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                        <input
                          id="login-password"
                          type={showLoginPw ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => { setLoginPassword(e.target.value); setError('') }}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-11 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPw((v) => !v)}
                          className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
                          aria-label={showLoginPw ? 'Hide password' : 'Show password'}
                        >
                          {showLoginPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {loginPassword === '' && loginEmail && (
                        <p className="mt-1 text-[11px] text-muted-foreground">Password is required</p>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      id="login-submit-btn"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          Signing in...
                        </span>
                      ) : (
                        <>Login <ArrowRight className="size-4" /></>
                      )}
                    </button>

                    {/* Switch to register */}
                    <p className="text-center text-xs text-muted-foreground pt-1">
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchView('register')}
                        className="font-bold text-primary hover:underline cursor-pointer"
                      >
                        Create Account
                      </button>
                    </p>
                  </form>
                </>
              )}

              {/* ══════════════════════════════════
                  REGISTER VIEW
              ══════════════════════════════════ */}
              {view === 'register' && (
                <>
                  <div className="mb-6">
                    <button
                      onClick={() => switchView('login')}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 cursor-pointer"
                    >
                      <ArrowLeft className="size-3.5" /> Back to Login
                    </button>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      <User className="size-3" /> Create Patient Account
                    </span>
                    <h2 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      Register as a Patient
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create a secure account to access SwasthyaConnect AI healthcare services.
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4" noValidate>
                    {/* Full Name */}
                    <div>
                      <label htmlFor="reg-name" className="block text-xs font-semibold text-foreground mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                        <input
                          id="reg-name"
                          type="text"
                          value={regName}
                          onChange={(e) => { setRegName(e.target.value); setError('') }}
                          placeholder="e.g. Ananya Krishnan"
                          autoComplete="name"
                          autoFocus
                          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="reg-email" className="block text-xs font-semibold text-foreground mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                        <input
                          id="reg-email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => { setRegEmail(e.target.value); setError('') }}
                          placeholder="patient@example.com"
                          autoComplete="email"
                          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      {regEmail && !validateEmail(regEmail) && (
                        <p className="mt-1 text-[11px] text-destructive">Please enter a valid email address</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="reg-password" className="block text-xs font-semibold text-foreground mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                        <input
                          id="reg-password"
                          type={showRegPw ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => { setRegPassword(e.target.value); setError('') }}
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-11 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPw((v) => !v)}
                          className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
                          aria-label={showRegPw ? 'Hide password' : 'Show password'}
                        >
                          {showRegPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {regPassword && regPassword.length < 6 && (
                        <p className="mt-1 text-[11px] text-destructive">Minimum 6 characters required</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="reg-confirm" className="block text-xs font-semibold text-foreground mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                        <input
                          id="reg-confirm"
                          type={showRegConfirm ? 'text' : 'password'}
                          value={regConfirm}
                          onChange={(e) => { setRegConfirm(e.target.value); setError('') }}
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-11 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirm((v) => !v)}
                          className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
                          aria-label={showRegConfirm ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showRegConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {regConfirm && regPassword !== regConfirm && (
                        <p className="mt-1 text-[11px] text-destructive">Passwords do not match</p>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      id="register-submit-btn"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          Creating Account...
                        </span>
                      ) : (
                        <><CheckCircle2 className="size-4" /> Create Account</>
                      )}
                    </button>

                    <p className="text-center text-xs text-muted-foreground pt-1">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchView('login')}
                        className="font-bold text-primary hover:underline cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  </form>
                </>
              )}

              {/* ══════════════════════════════════
                  FORGOT PASSWORD VIEW
              ══════════════════════════════════ */}
              {view === 'forgot' && (
                <>
                  <div className="mb-6">
                    <button
                      onClick={() => switchView('login')}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 cursor-pointer"
                    >
                      <ArrowLeft className="size-3.5" /> Back to Login
                    </button>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      <KeyRound className="size-3" /> Reset Password
                    </span>
                    <h2 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      Forgot your password?
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter your registered email and we&apos;ll send you a secure reset link.
                    </p>
                  </div>

                  <form onSubmit={handleForgot} className="space-y-4" noValidate>
                    <div>
                      <label htmlFor="forgot-email" className="block text-xs font-semibold text-foreground mb-1.5">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                        <input
                          id="forgot-email"
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => { setForgotEmail(e.target.value); setError('') }}
                          placeholder="patient@example.com"
                          autoComplete="email"
                          autoFocus
                          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      {forgotEmail && !validateEmail(forgotEmail) && (
                        <p className="mt-1 text-[11px] text-destructive">Please enter a valid email address</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      id="forgot-submit-btn"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          Sending Reset Link...
                        </span>
                      ) : (
                        <>Send Reset Link <ArrowRight className="size-4" /></>
                      )}
                    </button>

                    <p className="text-center text-xs text-muted-foreground pt-1">
                      Remembered it?{' '}
                      <button
                        type="button"
                        onClick={() => switchView('login')}
                        className="font-bold text-primary hover:underline cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  </form>
                </>
              )}
            </div>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Protected by Supabase Auth · 256-bit SSL · No passwords stored locally
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card/40 px-6 py-4 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <span>SwasthyaConnect AI Healthcare Intelligence System</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Tamil Nadu Trauma Registry</span>
          <span>·</span>
          <span>108 Central Dispatch</span>
          <span>·</span>
          <span>Patient Privacy Policy</span>
        </div>
      </footer>
    </div>
  )
}
