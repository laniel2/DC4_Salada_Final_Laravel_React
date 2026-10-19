import { useEffect, useState } from 'react'
import api from '../services/api'
import Message from '../components/Message'

const emptyForm = {
  name: '',
  email: '',
  role: 'staff',
  phone: '',
  address: '',
  password: '',
  password_confirmation: '',
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  async function loadAccounts(nextPage = 1, append = false) {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const { data } = await api.get('/admin/accounts', { params: { page: nextPage } })
      setAccounts((current) => append ? [...current, ...(data.data || [])] : data.data || [])
      setPage(data.current_page || nextPage)
      setHasMore(Boolean(data.next_page_url))
      setError('')
    } catch {
      setError('Could not load staff and customer accounts.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function startEdit(account) {
    setEditingId(account.id)
    setForm({
      ...emptyForm,
      name: account.name,
      email: account.email,
      role: account.role,
      phone: account.customer?.phone || '',
      address: account.customer?.address || '',
    })
    setError('')
    setNotice('')
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function saveAccount(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    const payload = { ...form }
    if (editingId && !payload.password) {
      delete payload.password
      delete payload.password_confirmation
    }

    try {
      if (editingId) {
        await api.patch(`/admin/accounts/${editingId}`, payload)
        setNotice('Account updated.')
      } else {
        await api.post('/admin/accounts', payload)
        setNotice('Account created.')
      }
      resetForm()
      await loadAccounts()
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors ? Object.values(errors).flat().join(' ') : 'Could not save this account.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteAccount(account) {
    if (!window.confirm(`Delete the ${account.role} account for ${account.name}?`)) return

    setError('')
    setNotice('')
    try {
      await api.delete(`/admin/accounts/${account.id}`)
      setAccounts((current) => current.filter((item) => item.id !== account.id))
      if (editingId === account.id) resetForm()
      setNotice('Account deleted.')
    } catch {
      setError('Could not delete this account.')
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Staff and customer accounts</h1>
          <p>Create accounts, update contact details, and remove access.</p>
        </div>
      </div>

      <Message error>{error}</Message>
      {notice && <div className="message">{notice}</div>}

      <section className="panel account-panel">
        <h2>{editingId ? 'Edit account' : 'Create account'}</h2>
        <form className="account-form" onSubmit={saveAccount}>
          <label>
            Name
            <input name="name" value={form.name} onChange={updateField} required />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>
          <label>
            Role
            <select name="role" value={form.role} onChange={updateField} disabled={Boolean(editingId)}>
              <option value="staff">Tailor / Staff</option>
              <option value="customer">Customer</option>
            </select>
          </label>
          {form.role === 'customer' && (
            <>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={updateField} />
              </label>
              <label>
                Address
                <input name="address" value={form.address} onChange={updateField} />
              </label>
            </>
          )}
          {!editingId && (
            <>
              <label>
                Temporary password
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={updateField}
                  required
                />
              </label>
              <label>
                Confirm password
                <input
                  name="password_confirmation"
                  type="password"
                  minLength={8}
                  value={form.password_confirmation}
                  onChange={updateField}
                  required
                />
              </label>
            </>
          )}
          {editingId && (
            <>
              <label>
                New password (optional)
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={updateField}
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirm new password
                <input
                  name="password_confirmation"
                  type="password"
                  minLength={8}
                  value={form.password_confirmation}
                  onChange={updateField}
                  autoComplete="new-password"
                />
              </label>
            </>
          )}
          <div className="form-actions">
            <button disabled={busy}>{busy ? 'Saving...' : editingId ? 'Save changes' : 'Create account'}</button>
            {editingId && <button type="button" className="outline" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="panel data-panel">
        <h2>Accounts</h2>
        {loading ? (
          <p>Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <p>No staff or customer accounts yet.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.name}</td>
                    <td>{account.email}</td>
                    <td>{account.role === 'staff' ? 'Tailor / Staff' : 'Customer'}</td>
                    <td>{account.customer?.phone || '—'}</td>
                    <td className="row-actions">
                      <button className="small-button" onClick={() => startEdit(account)}>Edit</button>
                      <button className="small-button danger-button" onClick={() => deleteAccount(account)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {hasMore && (
          <button className="outline load-more" disabled={loadingMore} onClick={() => loadAccounts(page + 1, true)}>
            {loadingMore ? 'Loading...' : 'Load more accounts'}
          </button>
        )}
      </section>
    </>
  )
}
