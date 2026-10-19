import { useEffect, useState } from 'react'
import api from '../services/api'
import Message from '../components/Message'
import ReferenceImage from '../components/ReferenceImage'

const money = (amount) => `₱${Number(amount || 0).toLocaleString()}`

export default function CustomerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/customer/orders')
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => setError('Could not load your orders. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-heading">
        <h1>Your orders</h1>
        <p>Follow each request from review through completion.</p>
      </div>
      <Message error>{error}</Message>
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
            {orders.map((order) => (
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
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
