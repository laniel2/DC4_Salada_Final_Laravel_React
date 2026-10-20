import { useEffect, useState } from 'react'
import api from '../services/api'
import StatCard from '../components/StatCard'
import Message from '../components/Message'
import ReferenceImage from '../components/ReferenceImage'

const money = (value) => `₱${Number(value || 0).toLocaleString()}`

function SalesChart({ days }) {
  const width = 560
  const height = 220
  const padding = { top: 16, right: 16, bottom: 38, left: 54 }
  const values = days.map((day) => Number(day.total || 0))
  const max = Math.max(...values, 1)
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const points = days.map((day, index) => ({
    x: padding.left + (days.length === 1 ? chartWidth / 2 : index * chartWidth / (days.length - 1)),
    y: padding.top + chartHeight - Number(day.total || 0) / max * chartHeight,
    day,
  }))
  const labels = [0, 0.5, 1].map((ratio) => ({ ratio, value: max * ratio }))
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <div className="dashboard-chart" role="img" aria-label={`Daily confirmed sales chart for ${days.length} dates`}>
      <svg viewBox={`0 0 ${width} ${height}`}>
        {labels.map(({ ratio, value }) => {
          const y = padding.top + chartHeight * (1 - ratio)
          return <g key={ratio}><line className="chart-gridline" x1={padding.left} x2={width - padding.right} y1={y} y2={y} /><text className="chart-axis-label" x={padding.left - 8} y={y + 4} textAnchor="end">{money(value)}</text></g>
        })}
        <polyline className="sales-chart-line" points={line} />
        {points.map(({ x, y, day }, index) => <g key={day.payment_date}>
          <circle className="sales-chart-point" cx={x} cy={y} r="4"><title>{day.payment_date}: {money(day.total)}</title></circle>
          {(index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 6) === 0) && <text className="chart-date-label" x={x} y={height - 12} textAnchor="middle">{day.payment_date.slice(5)}</text>}
        </g>)}
      </svg>
    </div>
  )
}

function OrderStatusChart({ counts }) {
  const statuses = ['Pending', 'In Progress', 'Ready for Fitting', 'Ready for Pickup', 'Completed', 'Cancelled']
  const total = Object.values(counts || {}).reduce((sum, count) => sum + Number(count), 0)
  const max = Math.max(...statuses.map((status) => Number(counts?.[status] || 0)), 1)

  return (
    <div className="order-status-chart" aria-label="Orders by status">
      {statuses.map((status) => {
        const count = Number(counts?.[status] || 0)
        return <div className="status-chart-row" key={status}>
          <span>{status}</span>
          <div className="status-chart-track" role="img" aria-label={`${status}: ${count} orders`}><span style={{ width: `${count / max * 100}%` }} /></div>
          <strong>{count}</strong>
        </div>
      })}
      <small>{total} total orders</small>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    due_soon: 0,
    completed_orders: 0,
    payments_received: 0,
    order_status_counts: {},
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

          <div className="dashboard-charts">
          <section className="panel dashboard-chart-panel">
            <div className="section-heading">
              <div>
                <h2>Sales trend</h2>
                <p>Confirmed payments · {salesReport.from} to {salesReport.to}</p>
              </div>
              <strong>{money(salesReport.payments_received)}</strong>
            </div>
            {salesReport.daily_sales?.length > 0 ? (
              <SalesChart days={salesReport.daily_sales} />
            ) : (
              <p>No payments recorded for this period.</p>
            )}
          </section>

          <section className="panel dashboard-chart-panel">
            <div className="section-heading"><div><h2>Orders by status</h2><p>Current workload across the shop</p></div></div>
            <OrderStatusChart counts={stats.order_status_counts} />
          </section>
          </div>

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
