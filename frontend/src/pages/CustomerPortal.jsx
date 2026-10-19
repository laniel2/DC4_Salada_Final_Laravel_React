import { useEffect, useState } from 'react'
import api from '../services/api'
import Message from '../components/Message'
import ReferenceImage from '../components/ReferenceImage'

const money = (amount) => `₱${Number(amount || 0).toLocaleString()}`

export default function CustomerPortal() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '' })
  const [savedProfile, setSavedProfile] = useState({ name: '', email: '', phone: '', address: '' })
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [services, setServices] = useState([])
  const [orderRequest, setOrderRequest] = useState({
    service_id: '', garment: '', quantity: 1, due_date: '', notes: '', payment_preference: 'Pay in person',
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [referenceImage, setReferenceImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [draggingImage, setDraggingImage] = useState(false)

  useEffect(() => {
    if (!referenceImage) {
      setImagePreview('')
      return undefined
    }
    const objectUrl = URL.createObjectURL(referenceImage)
    setImagePreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [referenceImage])

  useEffect(() => {
    Promise.all([
      api.get('/customer/profile'),
      api.get('/customer/orders'),
      api.get('/customer/payments'),
      api.get('/customer/services'),
    ])
      .then(([profileResponse, ordersResponse, paymentsResponse, servicesResponse]) => {
        const customer = profileResponse.data.customer || {}
        const loadedProfile = {
          name: profileResponse.data.name || customer.name || '',
          email: profileResponse.data.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
        }
        setProfile(loadedProfile)
        setSavedProfile(loadedProfile)
        setOrders(ordersResponse.data.data || [])
        setPayments(paymentsResponse.data.data || [])
        setServices(servicesResponse.data || [])
      })
      .catch(() => setError('Could not load your account. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  function updateField(event) {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updateOrderRequest(event) {
    setOrderRequest((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function acceptReferenceImage(file) {
    if (file) setReferenceImage(file)
  }

  async function submitOrderRequest(event) {
    event.preventDefault()
    setSubmittingOrder(true)
    setError('')
    setNotice('')

    try {
      const formData = new FormData()
      Object.entries(orderRequest).forEach(([key, value]) => formData.append(key, value))
      if (referenceImage) formData.append('reference_image', referenceImage)
      const { data } = await api.post('/customer/orders', formData)
      setOrders((current) => [{
        ...data,
        payments_total: 0,
        remaining_balance: Number(data.total_amount || 0),
      }, ...current])
      setOrderRequest({
        service_id: '', garment: '', quantity: 1, due_date: '', notes: '', payment_preference: 'Pay in person',
      })
      setReferenceImage(null)
      setNotice(`Order request #${data.id} was sent to the shop. Staff will confirm the price and payment details.`)
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors ? Object.values(errors).flat().join(' ') : 'Could not send your order request. Please try again.')
    } finally {
      setSubmittingOrder(false)
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const { data } = await api.patch('/customer/profile', profile)
      const customer = data.customer || {}
      const updatedProfile = {
        name: data.name || customer.name || '',
        email: data.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
      }
      setProfile(updatedProfile)
      setSavedProfile(updatedProfile)
      setNotice('Your contact details have been updated.')
      setEditingProfile(false)
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
          <h1>Welcome, {profile.name || 'Customer'}</h1>
          <p>Track progress, due dates, payments, and your contact details.</p>
        </div>
      </div>

      <Message error>{error}</Message>
      {notice && <div className="message">{notice}</div>}

      <section className="panel account-panel">
        <div className="section-heading">
          <h2>Contact details</h2>
          <button
            type="button"
            className="outline"
            onClick={() => {
              if (editingProfile) setProfile(savedProfile)
              setEditingProfile((current) => !current)
            }}
          >
            {editingProfile ? 'Cancel editing' : 'Edit contact details'}
          </button>
        </div>
        {editingProfile && <form className="profile-form" onSubmit={saveProfile}>
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
        </form>}
      </section>

      <section className="panel account-panel">
        <h2>Request a new order</h2>
        <p>Choose a service and tell the shop what you need. Staff will review your request and confirm the final price and timing.</p>
        {services.length === 0 ? (
          <p>There are no services available right now. Please contact the shop.</p>
        ) : (
          <form className="account-form" onSubmit={submitOrderRequest}>
            <label>
              Service
              <select name="service_id" value={orderRequest.service_id} onChange={updateOrderRequest} required>
                <option value="">Choose a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name} · {money(service.base_price)} per item</option>
                ))}
              </select>
            </label>
            <label>
              Item or alteration details
              <input
                name="garment"
                value={orderRequest.garment}
                onChange={updateOrderRequest}
                placeholder="e.g. school uniform, dress, trouser waist adjustment"
                maxLength={255}
                required
              />
            </label>
            <label>
              Quantity
              <input name="quantity" type="number" min="1" max="100" value={orderRequest.quantity} onChange={updateOrderRequest} required />
            </label>
            <label>
              Preferred due date
              <input name="due_date" type="date" min={new Date().toISOString().slice(0, 10)} value={orderRequest.due_date} onChange={updateOrderRequest} required />
            </label>
            <label>
              Notes for the tailor
              <textarea name="notes" rows="3" maxLength={5000} value={orderRequest.notes} onChange={updateOrderRequest} placeholder="Describe the fit, measurements, fabric, or other instructions." />
            </label>
            <div className="image-upload-field">
              <span>Reference image <small>(optional, up to 5 MB)</small></span>
              <label
                className={`image-drop-zone${draggingImage ? ' is-dragging' : ''}`}
                onDragOver={(event) => { event.preventDefault(); setDraggingImage(true) }}
                onDragLeave={() => setDraggingImage(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDraggingImage(false)
                  acceptReferenceImage(event.dataTransfer.files?.[0])
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => acceptReferenceImage(event.target.files?.[0])}
                />
                {referenceImage ? referenceImage.name : 'Drop an image here or click to choose a file'}
              </label>
              {imagePreview && <img className="reference-preview" src={imagePreview} alt="Selected order reference" />}
            </div>
            <label>
              Payment preference
              <select name="payment_preference" value={orderRequest.payment_preference} onChange={updateOrderRequest} required>
                <option>Pay in person</option>
                <option>GCash</option>
              </select>
            </label>
            <p className="form-hint">This sends a request, not a charge. The shop will confirm the final price and arrange payment with you.</p>
            <button disabled={submittingOrder}>{submittingOrder ? 'Sending request...' : 'Send order request'}</button>
          </form>
        )}
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
                  <th>Payment preference</th>
                  <th>Reference</th>
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
                    <td>{order.payment_preference || '—'}</td>
                    <td><ReferenceImage orderId={order.id} hasImage={order.has_reference_image} customer /></td>
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
