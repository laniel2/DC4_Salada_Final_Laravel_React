import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Message from '../components/Message'
import usePersistentDraft from '../hooks/usePersistentDraft'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginDraft, setLoginDraft] = usePersistentDraft('tailoring-login-draft', { email: 'admin@example.com' })
  const email = loginDraft.email
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Login failed. Check the API and your account.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-wrap login-page">
      <form className="panel login" onSubmit={submit}>
        <div className="brand-mark">TM</div>
        <h1>A'S TAILORING</h1>
        <p>Sign in to manage shop work.</p>
        <Message error>{error}</Message>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setLoginDraft((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        <button disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        <div className="demo-credentials">
          <small>Admin: admin@example.com / password</small>
          <small>Staff: staff@example.com / password</small>
        </div>
        <p className="auth-switch">
          Customer? <Link to="/register">Create a customer account</Link>
        </p>
      </form>
    </main>
  )
}
