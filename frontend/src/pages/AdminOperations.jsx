import { useEffect, useState } from 'react'
import api from '../services/api'
import Message from '../components/Message'
import PaymentProof from '../components/PaymentProof'
import { useAuth } from '../context/AuthContext'
import usePersistentDraft from '../hooks/usePersistentDraft'

const today = new Date().toISOString().slice(0, 10)

const resources = {
  customers: {
    label: 'Customers',
    fields: [
      { name: 'name', label: 'Customer name', required: true },
      { name: 'phone', label: 'Phone' },
      { name: 'address', label: 'Address', type: 'textarea' },
    ],
    defaults: { name: '', phone: '', address: '' },
  },
  services: {
    label: 'Services',
    fields: [
      { name: 'name', label: 'Service name', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'base_price', label: 'Base price', type: 'number', required: true },
    ],
    defaults: { name: '', description: '', base_price: 0 },
  },
  orders: {
    label: 'Orders',
    fields: [
      { name: 'customer_id', label: 'Customer ID', type: 'number', required: true },
      { name: 'user_id', label: 'Assigned staff ID (optional)', type: 'number' },
      { name: 'order_date', label: 'Order date', type: 'date', required: true },
      { name: 'due_date', label: 'Due date', type: 'date', required: true },
      {
        name: 'status', label: 'Status', type: 'select', options: [
          'Pending', 'In Progress', 'Ready for Fitting', 'Ready for Pickup', 'Completed', 'Cancelled',
        ],
      },
      { name: 'total_amount', label: 'Total amount', type: 'number', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: {
      customer_id: '', user_id: '', order_date: today, due_date: today,
      status: 'Pending', total_amount: 0, notes: '',
    },
  },
  'order-items': {
    label: 'Order items',
    fields: [
      { name: 'order_id', label: 'Order ID', type: 'number', required: true },
      { name: 'service_id', label: 'Service ID', type: 'number', required: true },
      { name: 'garment', label: 'Garment', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'price', label: 'Price', type: 'number', required: true },
    ],
    defaults: { order_id: '', service_id: '', garment: '', quantity: 1, price: 0 },
  },
  measurements: {
    label: 'Measurements',
    fields: [
      { name: 'customer_id', label: 'Customer ID', type: 'number', required: true },
      { name: 'garment', label: 'Garment' },
      { name: 'details', label: 'Measurements (JSON)', type: 'json', required: true },
    ],
    defaults: { customer_id: '', garment: '', details: '{\n  \n}' },
  },
  payments: {
    label: 'Payments',
    fields: [
      { name: 'order_id', label: 'Order ID', type: 'number', required: true },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'payment_date', label: 'Payment date', type: 'date', required: true },
      { name: 'method', label: 'Method', required: true },
      { name: 'reference_number', label: 'Reference number' },
      { name: 'status', label: 'Verification status', type: 'select', options: ['Pending Verification', 'Confirmed', 'Rejected'] },
    ],
    defaults: { order_id: '', amount: '', payment_date: today, method: 'Cash', reference_number: '', status: 'Confirmed' },
  },
}

function recordTitle(record) {
  if (record.order_id) return `Order #${record.order_id} · ₱${Number(record.amount || 0).toLocaleString()}`
  return record.name || record.customer?.name || record.garment || `Record #${record.id}`
}
const initialOperationsDraft = {
  resourceKey: 'customers',
  form: resources.customers.defaults,
  editingId: null,
}

export default function AdminOperations() {
  const { user } = useAuth()
  const [draft, setDraft, clearDraft] = usePersistentDraft(`tailoring-admin-operations-draft-${user?.id || 'account'}`, initialOperationsDraft)
  const { resourceKey, form, editingId } = draft
  const [records, setRecords] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [viewingCustomer, setViewingCustomer] = useState(null)
  const [loadingCustomer, setLoadingCustomer] = useState(false)

  const resource = resources[resourceKey]

  async function loadRecords(nextPage = 1, append = false) {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const { data } = await api.get(`/${resourceKey}`, { params: { page: nextPage } })
      setRecords((current) => append ? [...current, ...data.data] : data.data || [])
      setPage(data.current_page || nextPage)
      setHasMore(Boolean(data.next_page_url))
      setError('')
    } catch {
      setError(`Could not load ${resource.label.toLowerCase()}.`)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setNotice('')
    setError('')
    setRecords([])
    setPage(1)
    setHasMore(false)
    setViewingCustomer(null)
    loadRecords()
  }, [resourceKey])

  function resetForm() {
    clearDraft({ resourceKey, form: resource.defaults, editingId: null })
  }

  function updateField(event) {
    setDraft((current) => ({ ...current, form: { ...current.form, [event.target.name]: event.target.value } }))
  }

  function editRecord(record) {
    const nextForm = { ...resource.defaults }
    for (const field of resource.fields) {
      const value = record[field.name]
      if (value !== undefined && value !== null) {
        nextForm[field.name] = field.type === 'json' ? JSON.stringify(value, null, 2) : value
      }
    }
    setDraft((current) => ({ ...current, form: nextForm, editingId: record.id }))
    setError('')
    setNotice('')
  }

  function makePayload() {
    return Object.fromEntries(resource.fields.map((field) => {
      const value = form[field.name]
      if (field.type === 'json') return [field.name, JSON.parse(value)]
      if (field.type === 'number') return [field.name, value === '' ? null : Number(value)]
      return [field.name, value === '' ? null : value]
    }))
  }

  async function saveRecord(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    try {
      const payload = makePayload()
      if (editingId) {
        await api.patch(`/${resourceKey}/${editingId}`, payload)
        setNotice(`${resource.label.slice(0, -1)} updated.`)
      } else {
        await api.post(`/${resourceKey}`, payload)
        setNotice(`${resource.label.slice(0, -1)} created.`)
      }
      resetForm()
      await loadRecords()
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Measurements must be valid JSON, for example {"chest": 40}.')
      } else {
        const errors = err.response?.data?.errors
        setError(errors ? Object.values(errors).flat().join(' ') : 'Could not save this record.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function deleteRecord(record) {
    if (!window.confirm(`Delete ${resource.label.toLowerCase()} record #${record.id}?`)) return

    setError('')
    setNotice('')
    try {
      await api.delete(`/${resourceKey}/${record.id}`)
      setRecords((current) => current.filter((item) => item.id !== record.id))
      if (editingId === record.id) resetForm()
      setNotice(`${resource.label.slice(0, -1)} deleted.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this record. Check related orders or payments first.')
    }
  }

  async function viewCustomer(customer) {
    setViewingCustomer(null)
    setLoadingCustomer(true)
    setError('')
    try {
      const { data } = await api.get(`/customers/${customer.id}`)
      setViewingCustomer(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load customer details.')
    } finally {
      setLoadingCustomer(false)
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Shop records</h1>
          <p>Manage customer records, services, orders, measurements, and payments.</p>
        </div>
      </div>

      <label className="resource-picker">
        Manage
        <select value={resourceKey} onChange={(event) => {
          const nextResourceKey = event.target.value
          setDraft({ resourceKey: nextResourceKey, form: resources[nextResourceKey].defaults, editingId: null })
        }}>
          {Object.entries(resources).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
      </label>

      <Message error>{error}</Message>
      {notice && <div className="message">{notice}</div>}

      <section className="panel account-panel">
        <h2>{editingId ? `Edit ${resource.label.toLowerCase()}` : `Add ${resource.label.toLowerCase()}`}</h2>
        <form className="account-form" onSubmit={saveRecord}>
          {resource.fields.map((field) => (
            <label key={field.name}>
              {field.label}
              {field.type === 'textarea' || field.type === 'json' ? (
                <textarea
                  name={field.name}
                  value={form[field.name] ?? ''}
                  onChange={updateField}
                  required={field.required}
                  rows={field.type === 'json' ? 5 : 3}
                />
              ) : field.type === 'select' ? (
                <select name={field.name} value={form[field.name] ?? ''} onChange={updateField}>
                  {field.options.map((option) => <option key={option}>{option}</option>)}
                </select>
              ) : (
                <input
                  name={field.name}
                  type={field.type || 'text'}
                  min={field.type === 'number' ? 0 : undefined}
                  value={form[field.name] ?? ''}
                  onChange={updateField}
                  required={field.required}
                />
              )}
            </label>
          ))}
          <div className="form-actions">
            <button disabled={busy}>{busy ? 'Saving...' : editingId ? 'Save changes' : 'Create record'}</button>
            {editingId && <button type="button" className="outline" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
        <p className="form-hint">
          Related records use their numeric IDs. Find customer, order, service, and staff IDs in the lists or account manager.
        </p>
      </section>

      <section className="panel data-panel">
        <h2>{resource.label}</h2>
        {loading ? (
          <p>Loading {resource.label.toLowerCase()}...</p>
        ) : records.length === 0 ? (
          <p>No {resource.label.toLowerCase()} found.</p>
        ) : (
          <div className="record-list">
            {records.map((record) => (
              <article className="record-row" key={record.id}>
                <div className="record-summary">
                  <b>{recordTitle(record)}</b>
                  <small>#{record.id}{record.status ? ` · ${record.status}` : ''}{record.reference_number ? ` · Ref ${record.reference_number}` : ''}{record.due_date ? ` · Due ${record.due_date}` : ''}</small>
                </div>
                {resourceKey === 'payments' && record.has_proof_image && <PaymentProof paymentId={record.id} />}
                <div className="row-actions">
                  {resourceKey === 'customers' && <button className="small-button outline" onClick={() => viewCustomer(record)}>View</button>}
                  <button className="small-button" onClick={() => editRecord(record)}>Edit</button>
                  <button className="small-button danger-button" onClick={() => deleteRecord(record)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
        {hasMore && (
          <button className="outline load-more" disabled={loadingMore} onClick={() => loadRecords(page + 1, true)}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        )}
      </section>
      {resourceKey === 'customers' && loadingCustomer && <p>Loading customer details...</p>}
      {resourceKey === 'customers' && viewingCustomer && <section className="panel admin-customer-details">
        <div className="section-heading">
          <div><h2>Customer details</h2><p>Customer #{viewingCustomer.id}</p></div>
          <button type="button" className="outline" onClick={() => setViewingCustomer(null)}>Close</button>
        </div>
        <dl className="admin-customer-fields">
          <div><dt>Name</dt><dd>{viewingCustomer.name}</dd></div>
          <div><dt>Phone</dt><dd>{viewingCustomer.phone || 'Not provided'}</dd></div>
          <div><dt>Address</dt><dd>{viewingCustomer.address || 'Not provided'}</dd></div>
          <div><dt>Orders</dt><dd>{viewingCustomer.orders_count ?? viewingCustomer.orders?.length ?? 0}</dd></div>
          <div><dt>Measurements</dt><dd>{viewingCustomer.measurements_count ?? 0}</dd></div>
        </dl>
        <h3>Recent orders</h3>
        {!viewingCustomer.orders?.length ? <p>No orders for this customer.</p> : <div className="customer-dashboard-orders">
          {viewingCustomer.orders.map((order) => <article key={order.id}>
            <strong>Order #{order.id}</strong><span>{order.status}</span>
            <small>Due {order.due_date || 'date not set'} · ₱{Number(order.total_amount || 0).toLocaleString()}</small>
          </article>)}
        </div>}
      </section>}
    </>
  )
}
