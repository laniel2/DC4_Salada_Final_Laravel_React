import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Message from '../components/Message'

const initialDetails = {
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  password_confirmation: '',
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [details, setDetails] = useState(initialDetails)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

  function updateField(event) {
    setDetails((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await register(details)
      navigate('/')
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      setError(
        validationErrors
          ? Object.values(validationErrors).flat().join(' ')
          : err.response?.data?.message || 'Could not create your account.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-wrap">
      <form className="panel login" onSubmit={submit}>
        <div className="brand-mark">TM</div>
        <h1>Create your account</h1>
        <p>Register as a customer to follow your tailoring orders.</p>
        <Message error>{error}</Message>

        <label>
          Full name
          <input name="name" value={details.name} onChange={updateField} required />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={details.email}
            onChange={updateField}
            required
          />
        </label>
        <label>
          Phone
          <input name="phone" value={details.phone} onChange={updateField} />
        </label>
        <label>
          Address
          <input name="address" value={details.address} onChange={updateField} />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              value={details.password}
              onChange={updateField}
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
        <label>
          Confirm password
          <div className="password-field">
            <input
              name="password_confirmation"
              type={showPasswordConfirmation ? 'text' : 'password'}
              minLength={8}
              value={details.password_confirmation}
              onChange={updateField}
              required
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPasswordConfirmation((visible) => !visible)}
              aria-label={showPasswordConfirmation ? 'Hide password' : 'Show password'}
              aria-pressed={showPasswordConfirmation}
            >
              {showPasswordConfirmation ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        <button disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  )
}
