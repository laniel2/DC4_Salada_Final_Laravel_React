import { useEffect, useState } from 'react'
import api from '../services/api'

export default function ReferenceImage({ orderId, hasImage, customer = false }) {
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  async function togglePreview() {
    if (preview) {
      setPreview('')
      return
    }

    setLoading(true)
    setError('')
    try {
      const path = customer
        ? `/customer/orders/${orderId}/reference-image`
        : `/orders/${orderId}/reference-image`
      const { data } = await api.get(path, { responseType: 'blob' })
      setPreview(URL.createObjectURL(data))
    } catch {
      setError('Image unavailable')
    } finally {
      setLoading(false)
    }
  }

  if (!hasImage) return '—'

  return (
    <div className="reference-image-cell">
      <button className="small-button" type="button" onClick={togglePreview} disabled={loading}>
        {loading ? 'Loading...' : preview ? 'Hide image' : 'View image'}
      </button>
      {error && <small>{error}</small>}
      {preview && <img className="reference-order-image" src={preview} alt={`Reference for order ${orderId}`} />}
    </div>
  )
}
