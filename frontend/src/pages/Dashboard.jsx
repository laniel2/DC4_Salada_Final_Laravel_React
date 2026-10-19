import { useEffect, useState } from 'react'
import api from '../services/api'
import StatCard from '../components/StatCard'
import Message from '../components/Message'
import ReferenceImage from '../components/ReferenceImage'

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    due_soon: 0,
    completed_orders: 0,
    payments_received: 0,
  })
  const [orders, setOrders] = useState([])
  const [salesReport, setSalesReport] = useState({ payments_received: 0, daily_sales: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const requests = [
      api.get('/dashboard').then(({ data }) => setStats(data)),
      api.get('/orders').then(({ data }) => {
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
        setOrders(list)
      }),
      api.get('/admin/reports/sales').then(({ data }) => setSalesReport(data)),
    ]

    Promise.allSettled(requests)
      .then((results) => {
        if (results.some((result) => result.status === 'rejected')) {
          setError('Some dashboard information could not be loaded. Refresh to try again.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your tailoring shop</p>
        </div>
      </div>

      <Message error>{error}</Message>
      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <>
          <div className="stats">
            <StatCard label="Total orders" value={stats.total_orders} />
            <StatCard label="Pending jobs" value={stats.pending_orders} />
            <StatCard label="Due soon" value={stats.due_soon} />
            <StatCard label="Completed jobs" value={stats.completed_orders} />
            <StatCard
              label="Payments received"
              value={`₱${Number(stats.payments_received || 0).toLocaleString()}`}
            />
          </div>

          <section className="panel data-panel">
            <div className="section-heading">
              <div>
                <h2>Sales report</h2>
                <p>{salesReport.from} to {salesReport.to}</p>
              </div>
              <strong>{`₱${Number(salesReport.payments_received || 0).toLocaleString()}`}</strong>
            </div>
            {salesReport.daily_sales?.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Date</th><th>Payments received</th></tr></thead>
                  <tbody>
                    {salesReport.daily_sales.map((day) => (
                      <tr key={day.payment_date}>
                        <td>{day.payment_date}</td>
                        <td>₱{Number(day.total || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No payments recorded for this period.</p>
            )}
          </section>

          <section className="panel">
            <h2>Recent orders</h2>
            {orders.length === 0 ? (
              <p>No tailoring orders have been submitted yet.</p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Request</th>
                      <th>Due date</th>
                      <th>Payment preference</th>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 8).map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.customer?.name || 'Customer'}</td>
                        <td>{order.items?.map((item) => `${item.service?.name || 'Tailoring'}: ${item.garment}`).join(', ') || 'Tailoring order'}</td>
                        <td>{order.due_date}</td>
                        <td>{order.payment_preference || '—'}</td>
                        <td><ReferenceImage orderId={order.id} hasImage={order.has_reference_image} /></td>
                        <td>
                          <span className="status">{order.status}</span>
                        </td>
                        <td>
                          ₱{Number(order.total_amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}
