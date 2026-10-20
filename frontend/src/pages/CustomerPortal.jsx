import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Message from '../components/Message'
import { useAuth } from '../context/AuthContext'
import usePersistentDraft from '../hooks/usePersistentDraft'

const money = (amount) => `₱${Number(amount || 0).toLocaleString()}`
const emptyOrderRequest = {
  service_id: '', garment: '', quantity: 1, due_date: '', notes: '', payment_preference: 'Pay in person',
}

export default function CustomerPortal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const draftPrefix = `tailoring-customer-draft-${user?.id || 'account'}`
  const [orderRequest, setOrderRequest, clearOrderDraft, hasOrderDraft] = usePersistentDraft(`${draftPrefix}-order`, emptyOrderRequest)
  const [customerName, setCustomerName] = useState(user?.name || '')
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState({ active_orders: 0, completed_orders: 0, open_balances: 0 })
  const [services, setServices] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(hasOrderDraft)
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
      api.get('/customer/services'),
      api.get('/customer/orders'),
      api.get('/customer/dashboard'),
    ])
      .then(([profileResponse, servicesResponse, ordersResponse, dashboardResponse]) => {
        const customer = profileResponse.data.customer || {}
        setCustomerName(profileResponse.data.name || customer.name || user?.name || '')
        setServices(servicesResponse.data || [])
        setOrders(ordersResponse.data.data || [])
        setSummary(dashboardResponse.data)
      })
      .catch(() => setError('Could not load your account. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

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
      const createdOrder = data.data || data
      clearOrderDraft(emptyOrderRequest)
      setReferenceImage(null)
      try {
      try {
        const [ordersResponse, dashboardResponse] = await Promise.all([
          api.get('/customer/orders'),
          api.get('/customer/dashboard'),
        ])
        setOrders(ordersResponse.data.data || [])
        setSummary(dashboardResponse.data)
      } catch {}
      } catch {}
      if (createdOrder.payment_preference === 'GCash') {
        navigate(`/orders?payFor=${createdOrder.id}`)
      } else {
        setNotice(`Order request #${createdOrder.id} was sent to the shop. Staff will confirm the price and payment details.`)
      }
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors ? Object.values(errors).flat().join(' ') : 'Could not send your order request. Please try again.')
    } finally {
      setSubmittingOrder(false)
    }
  }

  if (loading) return <p>Loading your account...</p>


  return (
    <>
      <div className="page-heading customer-page-heading">
        <div>
          <h1>Welcome, {customerName || 'Customer'}</h1>
          <p>Here’s your tailoring dashboard and a quick look at your orders.</p>
        </div>
        <button type="button" onClick={() => setShowOrderForm((current) => !current)} aria-expanded={showOrderForm} aria-controls="customer-order-form">
          {showOrderForm ? 'Close request form' : '＋ Request an order'}
        </button>
      </div>

      <Message error>{error}</Message>
      {notice && <div className="message">{notice}</div>}

      <section className="customer-dashboard-stats" aria-label="Order summary">
        <article className="stat-card"><span>Active orders</span><strong>{summary.active_orders}</strong><small>In progress or awaiting pickup</small></article>
        <article className="stat-card"><span>Completed</span><strong>{summary.completed_orders}</strong><small>Finished tailoring orders</small></article>
        <article className="stat-card"><span>Open balances</span><strong>{summary.open_balances}</strong><small>Orders with a remaining balance</small></article>
      </section>

      <section className="panel customer-dashboard-preview">
        <div className="section-heading">
          <div><h2>Recent orders</h2><p>Your latest requests and their current status.</p></div>
          <button type="button" className="outline" onClick={() => navigate('/orders')}>View all orders</button>
        </div>
        {orders.length === 0 ? <p>You haven’t placed an order yet. Start with a new order request below.</p> : (
          <div className="customer-dashboard-orders">
            {orders.slice(0, 3).map((order) => <article key={order.id}>
              <strong>Order #{order.id}</strong><span>{order.status}</span><small>Due {order.due_date || 'date to be confirmed'} · Balance {money(order.remaining_balance)}</small>
            </article>)}
          </div>
        )}
      </section>

      {showOrderForm && <section className="panel account-panel customer-request-panel" id="customer-order-form">
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
      </section>}

    </>
  )
}
