import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import api from './services/api'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import StaffDashboard from './pages/StaffDashboard'
import CustomerPortal from './pages/CustomerPortal'
import CustomerOrders from './pages/CustomerOrders'
import CustomerPayments from './pages/CustomerPayments'
import CustomerProfile from './pages/CustomerProfile'
import AdminAccounts from './pages/AdminAccounts'
import AdminOperations from './pages/AdminOperations'
import NotificationsPanel from './components/NotificationsPanel'

function RoleHome({ role }) {
  if (role === 'customer') return <CustomerPortal />
  if (role === 'staff') return <StaffDashboard />

  return <Dashboard />
}

function CustomerAvatar({ user }) {
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    let active = true
    let currentUrl = ''

    async function loadImage() {
      try {
        const { data: profile } = await api.get('/customer/profile')
        if (!profile.has_profile_image) {
          if (currentUrl) URL.revokeObjectURL(currentUrl)
          currentUrl = ''
          if (active) setImageUrl('')
          return
        }
        const { data } = await api.get('/customer/profile/image', { responseType: 'blob' })
        const nextUrl = URL.createObjectURL(data)
        if (!active) {
          URL.revokeObjectURL(nextUrl)
          return
        }
        if (currentUrl) URL.revokeObjectURL(currentUrl)
        currentUrl = nextUrl
        setImageUrl(nextUrl)
      } catch {
        if (active) setImageUrl('')
      }
    }

    const refreshImage = () => loadImage()
    window.addEventListener('customer-profile-image-updated', refreshImage)
    loadImage()

    return () => {
      active = false
      window.removeEventListener('customer-profile-image-updated', refreshImage)
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [user?.id])

  return <div className="avatar">{imageUrl ? <img src={imageUrl} alt="" /> : user?.name?.[0] || 'U'}</div>
}

function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <span>A'S</span>
          <b>A'S TAILORING</b>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <Link className={location.pathname === '/' ? 'active' : ''} to="/">
          ▦　{user?.role === 'customer' ? 'Overview' : user?.role === 'staff' ? 'My jobs' : 'Dashboard'}
        </Link>
        {user?.role === 'customer' && (
          <>
            <Link className={location.pathname === '/orders' ? 'active' : ''} to="/orders">◷　Your orders</Link>
            <Link className={location.pathname === '/payments' ? 'active' : ''} to="/payments">＄　Payment history</Link>
            <Link className={location.pathname === '/profile' ? 'active' : ''} to="/profile">♙　Profile</Link>
          </>
        )}
        {user?.role === 'admin' && (
          <>
            <Link className={location.pathname === '/manage' ? 'active' : ''} to="/manage">
              ◈　Shop records
            </Link>
            <Link className={location.pathname === '/accounts' ? 'active' : ''} to="/accounts">
              ♙　Accounts
            </Link>
          </>
        )}
        <div className="sidebar-note">
          {user?.role === 'customer'
            ? 'Track orders and payments, and manage your contact details in Profile.'
            : user?.role === 'staff'
              ? 'View assigned jobs, update progress, and look up customer measurements.'
              : 'Manage shop accounts, tailoring work, deadlines, and sales.'}
        </div>
        <div className="profile">
          {user?.role === 'customer' ? <CustomerAvatar user={user} /> : <div className="avatar">{user?.name?.[0] || 'U'}</div>}
          <div>
            <b>{user?.name}</b>
            <small>{user?.role}</small>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <span></span>
          <div className="topbar-actions">
            <NotificationsPanel />
            <button className="outline" onClick={logout}>Log out</button>
          </div>
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<RoleHome role={user?.role} />} />
            <Route path="/orders" element={user?.role === 'customer' ? <CustomerOrders /> : <Navigate to="/" replace />} />
            <Route path="/payments" element={user?.role === 'customer' ? <CustomerPayments /> : <Navigate to="/" replace />} />
            <Route path="/profile" element={user?.role === 'customer' ? <CustomerProfile /> : <Navigate to="/" replace />} />
            <Route
              path="/manage"
              element={user?.role === 'admin' ? <AdminOperations /> : <Navigate to="/" replace />}
            />
            <Route
              path="/accounts"
              element={user?.role === 'admin' ? <AdminAccounts /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('tailoring_theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode)
    localStorage.setItem('tailoring_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            localStorage.getItem('tailoring_token') && user ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Register />}
        />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<Layout />} />
        </Route>
      </Routes>
      <button
        type="button"
        className="theme-toggle"
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={darkMode}
        onClick={() => setDarkMode((current) => !current)}
      >
        {darkMode ? '☀ Light mode' : '☾ Dark mode'}
      </button>
    </>
  )
}
