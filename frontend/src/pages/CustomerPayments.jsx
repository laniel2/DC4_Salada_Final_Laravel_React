import { useEffect, useState } from 'react'
import api from '../services/api'
import Message from '../components/Message'

const money = (amount) => `₱${Number(amount || 0).toLocaleString()}`

export default function CustomerPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/customer/payments')
      .then(({ data }) => setPayments(data.data || []))
      .catch(() => setError('Could not load your payment history. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-heading">
        <h1>Payment history</h1>
        <p>Review payments recorded for your tailoring orders.</p>
      </div>
      <Message error>{error}</Message>
      <section className="panel data-panel">
        <h2>Recorded payments</h2>
        {loading ? <p>Loading payment history...</p> : payments.length === 0 ? (
          <div className="customer-empty-state">
            <strong>No payments recorded</strong>
            <p>Payments made toward your orders will appear here.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Remaining balance</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>#{payment.order_id}</td>
                    <td>{payment.payment_date}</td>
                    <td>{payment.method}</td>
                    <td>{payment.reference_number || '—'}</td>
                    <td>{money(payment.amount)}</td>
                    <td><span className="status">{payment.status || 'Confirmed'}</span></td>
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
