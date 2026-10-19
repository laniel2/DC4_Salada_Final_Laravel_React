import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Message from '../components/Message'
import ReferenceImage from '../components/ReferenceImage'
import { useAuth } from '../context/AuthContext'
import usePersistentDraft from '../hooks/usePersistentDraft'

const money = (amount) => `₱${Number(amount || 0).toLocaleString()}`
const gcashQrUrl = import.meta.env.VITE_GCASH_QR_URL || ''

export default function CustomerOrders() {
  const { user } = useAuth()
  const [paymentForm, setPaymentForm, clearPaymentDraft] = usePersistentDraft(
    `tailoring-gcash-payment-draft-${user?.id || 'account'}`,
    { order_id: null, amount: '', reference_number: '' },
  )
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [payingOrderId, setPayingOrderId] = useState(null)
  const [proofImage, setProofImage] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  async function loadOrders() {
    const { data } = await api.get('/customer/orders')
    const loadedOrders = data.data || []
    setOrders(loadedOrders)
    return loadedOrders
  }

  useEffect(() => {
    const requestedOrderId = searchParams.get('payFor')
    if (requestedOrderId) setPayingOrderId(Number(requestedOrderId))
    loadOrders()
      .then((loadedOrders) => {
        const requestedOrder = loadedOrders.find((order) => String(order.id) === requestedOrderId)
        if (requestedOrder && paymentForm.order_id !== requestedOrder.id) {
          setPaymentForm({ order_id: requestedOrder.id, amount: String(requestedOrder.remaining_balance || ''), reference_number: '' })
        }
      })
      .catch(() => setError('Could not load your orders. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  function beginPayment(order) {
    setPayingOrderId(order.id)
    if (paymentForm.order_id !== order.id) {
      setPaymentForm({ order_id: order.id, amount: String(order.remaining_balance || ''), reference_number: '' })
    }
    setProofImage(null)
    setSearchParams({ payFor: String(order.id) }, { replace: true })
  }

  async function submitPayment(event, order) {
    event.preventDefault()
    if (!proofImage) {
      setError('Please attach a screenshot of your GCash receipt.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    const formData = new FormData()
    formData.append('amount', paymentForm.amount)
    formData.append('reference_number', paymentForm.reference_number)
    formData.append('proof_image', proofImage)

    try {
      await api.post(`/customer/orders/${order.id}/payments`, formData)
      await loadOrders()
      setNotice(`GCash payment for order #${order.id} was submitted. The shop will verify the receipt.`)
      setPayingOrderId(null)
      clearPaymentDraft({ order_id: null, amount: '', reference_number: '' })
      setProofImage(null)
      setSearchParams({}, { replace: true })
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || 'Could not submit your GCash payment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-heading">
        <h1>Your orders</h1>
        <p>Follow each request from review through completion.</p>
      </div>
      <Message error>{error}</Message>
      {notice && <div className="message">{notice}</div>}
      <section className="panel data-panel customer-orders-panel">
        <div className="customer-list-heading">
          <div>
            <h2>Order progress</h2>
            <p>Due dates, payment balances, and reference images for your requests.</p>
          </div>
          {!loading && <span>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>}
        </div>
        {loading ? <p>Loading your orders...</p> : orders.length === 0 ? (
          <div className="customer-empty-state">
            <strong>No orders yet</strong>
            <p>Your order requests will appear here after you submit them.</p>
          </div>
        ) : (
          <div className="customer-order-list">
            {orders.map((order) => {
              const pendingVerification = order.payments?.some((payment) => payment.status === 'Pending Verification')
              const rejectedPayment = order.payments?.some((payment) => payment.status === 'Rejected')
              const payableByGcash = order.payment_preference === 'GCash' && Number(order.remaining_balance) > 0 && order.status !== 'Cancelled'

              return (
                <article className="customer-order-card" key={order.id}>
                  <div className="customer-order-top">
                    <div>
                      <span className="customer-order-number">Order #{order.id}</span>
                      <h3>{order.items?.map((item) => `${item.service?.name ? `${item.service.name}: ` : ''}${item.garment} × ${item.quantity}`).join(', ') || 'Tailoring order'}</h3>
                    </div>
                    <span className="status">{order.status}</span>
                  </div>
                  <div className="customer-order-details">
                    <div><small>Due date</small><strong>{order.due_date || 'To be confirmed'}</strong></div>
                    <div><small>Order total</small><strong>{money(order.total_amount)}</strong></div>
                    <div><small>Paid</small><strong>{money(order.payments_total)}</strong></div>
                    <div><small>Balance</small><strong>{money(order.remaining_balance)}</strong></div>
                    <div><small>Payment preference</small><strong>{order.payment_preference || '—'}</strong></div>
                  </div>
                  {order.has_reference_image && <div className="customer-order-reference"><ReferenceImage orderId={order.id} hasImage={order.has_reference_image} customer /></div>}

                  {payableByGcash && (pendingVerification ? (
                    <p className="gcash-pending-message">Your GCash receipt is awaiting shop verification. The balance updates after confirmation.</p>
                  ) : (
                    <div className="customer-gcash-payment">
                      {rejectedPayment && <p className="message error">A previous receipt was declined. Review it with the shop, then submit a new payment.</p>}
                      {payingOrderId !== order.id ? (
                        <button type="button" className="outline" onClick={() => beginPayment(order)}>Pay balance with GCash</button>
                      ) : (
                        <form className="gcash-payment-form" onSubmit={(event) => submitPayment(event, order)}>
                          <h3>Pay order #{order.id} with GCash</h3>
                          {gcashQrUrl ? (
                            <div className="gcash-qr-wrap">
                              <img src={gcashQrUrl} alt="Shop GCash payment QR code" />
                              <p>Scan the shop’s QR code, send your payment, then enter the transaction details below.</p>
                            </div>
                          ) : (
                            <p className="gcash-pending-message">The shop has not configured its GCash QR image yet. Contact the shop before sending payment.</p>
                          )}
                          <div className="gcash-payment-fields">
                            <label>
                              Amount to pay (balance: {money(order.remaining_balance)})
                              <input
                                type="number"
                                min="0.01"
                                max={order.remaining_balance}
                                step="0.01"
                                value={paymentForm.amount}
                                onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))}
                                required
                              />
                            </label>
                            <label>
                              GCash reference number
                              <input
                                value={paymentForm.reference_number}
                                onChange={(event) => setPaymentForm((current) => ({ ...current, reference_number: event.target.value }))}
                                maxLength="100"
                                required
                              />
                            </label>
                            <label>
                              Receipt screenshot
                              <input type="file" accept="image/*" onChange={(event) => setProofImage(event.target.files?.[0] || null)} required />
                            </label>
                          </div>
                          <p className="form-hint">Your payment will remain pending until the shop verifies the receipt.</p>
                          <div className="form-actions">
                            <button disabled={busy || !gcashQrUrl}>{busy ? 'Submitting...' : 'Submit payment for verification'}</button>
                            <button type="button" className="outline" onClick={() => { setPayingOrderId(null); setSearchParams({}, { replace: true }) }}>Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
