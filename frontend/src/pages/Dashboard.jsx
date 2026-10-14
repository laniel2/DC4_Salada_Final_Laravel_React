import { useEffect, useState } from 'react'
import api from '../services/api'
import StatCard from '../components/StatCard'
import Message from '../components/Message'

export default function Dashboard() {
  const [stats, setStats] = useState({})
  const [orders, setOrders] = useState([])
  const [salesReport, setSalesReport] = useState({ daily_sales: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/orders'),
      api.get('/admin/reports/sales'),
    ])
      .then(([statsResponse, ordersResponse, salesResponse]) => {
        setStats(statsResponse.data)
        setOrders(ordersResponse.data.data || ordersResponse.data)
        setSalesReport(salesResponse.data)
      })
      .catch(() =>
        setError(
          'Could not load dashboard. Check that Laravel is running and migrations are complete.',
        ),
      )
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
              <p>
                No orders yet. Add orders using the API or extend this starter
                with the order form.
              </p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Due date</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 8).map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.customer?.name || 'Customer'}</td>
                        <td>{order.due_date}</td>
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
