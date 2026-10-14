import { useEffect, useState } from 'react'
import api from '../services/api'
import Message from '../components/Message'

const money = (amount) => `₱${Number(amount || 0).toLocaleString()}`

export default function CustomerPortal() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '' })
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/customer/profile'),
      api.get('/customer/orders'),
      api.get('/customer/payments'),
    ])
      .then(([profileResponse, ordersResponse, paymentsResponse]) => {
        const customer = profileResponse.data.customer || {}
        setProfile({
          name: profileResponse.data.name || customer.name || '',
          email: profileResponse.data.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
        })
        setOrders(ordersResponse.data.data || [])
        setPayments(paymentsResponse.data.data || [])
      })
      .catch(() => setError('Could not load your account. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  function updateField(event) {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      await api.patch('/customer/profile', profile)
      setNotice('Your contact details have been updated.')
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors ? Object.values(errors).flat().join(' ') : 'Could not update your details.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading your account...</p>

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your tailoring orders</h1>
          <p>Track progress, due dates, payments, and your contact details.</p>
        </div>
      </div>

      <Message error>{error}</Message>
      {notice && <div className="message">{notice}</div>}

      <section className="panel account-panel">
        <h2>Contact details</h2>
        <form className="profile-form" onSubmit={saveProfile}>
          <label>
            Name
            <input name="name" value={profile.name} onChange={updateField} required />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={profile.email}
              onChange={updateField}
              required
            />
          </label>
          <label>
            Phone
            <input name="phone" value={profile.phone} onChange={updateField} />
          </label>
          <label>
            Address
            <input name="address" value={profile.address} onChange={updateField} />
          </label>
          <button disabled={saving}>{saving ? 'Saving...' : 'Save contact details'}</button>
        </form>
      </section>

      <section className="panel data-panel">
        <h2>Your orders</h2>
        {orders.length === 0 ? (
          <p>No tailoring orders are linked to your account yet.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>
                      {order.items?.map((item) => item.garment).join(', ') || 'Tailoring order'}
                    </td>
                    <td>{order.due_date}</td>
                    <td><span className="status">{order.status}</span></td>
                    <td>{money(order.total_amount)}</td>
                    <td>{money(order.payments_total)}</td>
                    <td>{money(order.remaining_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel data-panel">
        <h2>Payment history</h2>
        {payments.length === 0 ? (
          <p>No payments have been recorded for your orders yet.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Payment</th>
                  <th>Remaining balance</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>#{payment.order_id}</td>
                    <td>{payment.payment_date}</td>
                    <td>{payment.method}</td>
                    <td>{money(payment.amount)}</td>
                    <td>{money(payment.order_remaining_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
