import { useEffect, useState } from 'react'
import api from '../services/api'
import Message from '../components/Message'

const progressStatuses = [
  'In Progress',
  'Ready for Fitting',
  'Ready for Pickup',
  'Completed',
]

export default function StaffDashboard() {
  const [orders, setOrders] = useState([])
  const [services, setServices] = useState([])
  const [customers, setCustomers] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/orders'), api.get('/services')])
      .then(([ordersResponse, servicesResponse]) => {
        setOrders(ordersResponse.data.data || [])
        setServices(servicesResponse.data.data || [])
      })
      .catch(() => setError('Could not load your assigned work.'))
      .finally(() => setLoading(false))
  }, [])

  async function searchCustomers(event) {
    event.preventDefault()
    setError('')
    setSelectedCustomer(null)
    setMeasurements([])

    try {
      const { data } = await api.get('/customers', { params: { search } })
      setCustomers(data.data || [])
    } catch {
      setError('Could not search customers.')
    }
  }

  async function showMeasurements(customer) {
    setSelectedCustomer(customer)
    setError('')

    try {
      const { data } = await api.get('/measurements', {
        params: { customer_id: customer.id },
      })
      setMeasurements(data.data || [])
    } catch {
      setError('Could not load this customer’s measurements.')
    }
  }

  async function updateProgress(orderId, status) {
    setError('')
    setNotice('')

    try {
      await api.patch(`/orders/${orderId}/status`, { status })
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status } : order)),
      )
      setNotice(`Order #${orderId} updated to ${status}.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update order progress.')
    }
  }

  if (loading) return <p>Loading your assigned jobs...</p>

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Tailor workspace</h1>
          <p>Your assigned jobs, deadlines, customer search, and measurements.</p>
        </div>
      </div>

      <Message error>{error}</Message>
      {notice && <div className="message">{notice}</div>}

      <section className="panel data-panel">
        <h2>Assigned jobs</h2>
        {orders.length === 0 ? (
          <p>No jobs are assigned to you right now.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Garments / services</th>
                  <th>Due date</th>
                  <th>Progress</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer?.name || 'Customer'}</td>
                    <td>
                      {order.items?.map((item) => item.garment || item.service?.name).join(', ') ||
                        'Tailoring order'}
                    </td>
                    <td>{order.due_date}</td>
                    <td>
                      <select
                        aria-label={`Progress for order ${order.id}`}
                        value={order.nextStatus || order.status}
                        onChange={(event) =>
                          setOrders((current) =>
                            current.map((currentOrder) =>
                              currentOrder.id === order.id
                                ? { ...currentOrder, nextStatus: event.target.value }
                                : currentOrder,
                            ),
                          )
                        }
                      >
                        {[...new Set([order.status, ...progressStatuses])].map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="small-button"
                        disabled={!order.nextStatus || order.nextStatus === order.status}
                        onClick={() => updateProgress(order.id, order.nextStatus)}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel data-panel">
        <h2>Customer measurements</h2>
        <form className="search-form" onSubmit={searchCustomers}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by customer name or phone"
            aria-label="Search customers"
          />
          <button>Search</button>
        </form>
        {customers.length > 0 && (
          <div className="customer-results">
            {customers.map((customer) => (
              <button
                key={customer.id}
                className="customer-result"
                onClick={() => showMeasurements(customer)}
              >
                {customer.name} {customer.phone && `· ${customer.phone}`}
              </button>
            ))}
          </div>
        )}
        {selectedCustomer && (
          <div className="measurement-results">
            <h3>Measurements for {selectedCustomer.name}</h3>
            {measurements.length === 0 ? (
              <p>No saved measurements.</p>
            ) : (
              measurements.map((measurement) => (
                <article className="measurement-card" key={measurement.id}>
                  <b>{measurement.garment || 'General measurements'}</b>
                  <pre>{JSON.stringify(measurement.details, null, 2)}</pre>
                </article>
              ))
            )}
          </div>
        )}
      </section>

      <section className="panel data-panel">
        <h2>Available services</h2>
        <div className="service-list">
          {services.map((service) => (
            <div key={service.id}>
              <b>{service.name}</b>
              <span>₱{Number(service.base_price).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
