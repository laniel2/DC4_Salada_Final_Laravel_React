import { useEffect, useState } from 'react'
import api from '../services/api'

export default function PaymentProof({ paymentId }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let objectUrl = ''
    let active = true
    api.get(`/payments/${paymentId}/proof`, { responseType: 'blob' })
      .then(({ data }) => {
        objectUrl = URL.createObjectURL(data)
        if (active) setUrl(objectUrl)
      })
      .catch(() => { if (active) setError(true) })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [paymentId])

  if (error) return <small>Proof unavailable</small>
  if (!url) return <small>Loading proof…</small>
  return <a className="payment-proof-link" href={url} target="_blank" rel="noreferrer">View GCash receipt</a>
}
