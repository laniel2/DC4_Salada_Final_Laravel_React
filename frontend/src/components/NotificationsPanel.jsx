import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function NotificationsPanel() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState('')

  async function loadNotifications() {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
      setError('')
    } catch {
      setError('Could not load notifications.')
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = window.setInterval(loadNotifications, 60000)
    return () => window.clearInterval(interval)
  }, [])

  async function openNotification(notification) {
    if (!notification.read_at) {
      setNotifications((current) => current.map((item) => item.id === notification.id
        ? { ...item, read_at: new Date().toISOString() }
        : item))
      setUnreadCount((current) => Math.max(0, current - 1))
      try {
        await api.patch(`/notifications/${notification.id}/read`)
      } catch {
        loadNotifications()
      }
    }
    setOpen(false)
    navigate(notification.action_url?.startsWith('/') ? notification.action_url : '/')
  }

  async function markAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })))
    setUnreadCount(0)
    try {
      await api.patch('/notifications/read-all')
    } catch {
      loadNotifications()
    }
  }

  return (
    <div className="notifications-menu">
      <button
        type="button"
        className="outline notifications-toggle"
        aria-expanded={open}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        onClick={() => setOpen((value) => !value)}
      >
        Notifications{unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && <section className="notifications-popover" aria-label="Notifications">
        <div className="notifications-heading">
          <div><h2>Notifications</h2><small>{unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}</small></div>
          {unreadCount > 0 && <button type="button" className="notifications-mark-all" onClick={markAllRead}>Mark all read</button>}
        </div>
        {error && <p className="notifications-error">{error}</p>}
        {notifications.length === 0 && !error ? <p className="notifications-empty">No notifications yet.</p> : (
          <div className="notifications-list">
            {notifications.map((notification) => <article className={`notification-item${notification.read_at ? '' : ' is-unread'}`} key={notification.id}>
              <button type="button" className="notification-open" onClick={() => openNotification(notification)}>
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
                <em>{notification.action_label}</em>
              </button>
            </article>)}
          </div>
        )}
      </section>}
    </div>
  )
}
