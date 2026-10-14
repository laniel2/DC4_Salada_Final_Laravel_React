import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import StaffDashboard from './pages/StaffDashboard'
import CustomerPortal from './pages/CustomerPortal'
import AdminAccounts from './pages/AdminAccounts'
import AdminOperations from './pages/AdminOperations'

function RoleHome({ role }) {
  if (role === 'customer') return <CustomerPortal />
  if (role === 'staff') return <StaffDashboard />

  return <Dashboard />
}

function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <span>TM</span>
          <b>TailorDesk</b>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <Link className={location.pathname === '/' ? 'active' : ''} to="/">
          ▦　{user?.role === 'customer' ? 'My orders' : user?.role === 'staff' ? 'My jobs' : 'Dashboard'}
        </Link>
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
            ? 'Track your tailoring orders, due dates, payments, and contact details.'
            : user?.role === 'staff'
              ? 'View assigned jobs, update progress, and look up customer measurements.'
              : 'Manage shop accounts, tailoring work, deadlines, and sales.'}
        </div>
        <div className="profile">
          <div className="avatar">{user?.name?.[0] || 'U'}</div>
          <div>
            <b>{user?.name}</b>
            <small>{user?.role}</small>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <span>Tailoring Shop / Workspace</span>
          <button className="outline" onClick={logout}>
            Log out
          </button>
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<RoleHome role={user?.role} />} />
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

  return (
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
  )
}
