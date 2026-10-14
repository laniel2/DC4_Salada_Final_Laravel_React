import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
function Layout() {
  const { user, logout } = useAuth(), location = useLocation()
  return <div className="app-shell"><aside className="sidebar"><div className="logo"><span>TM</span><b>TailorDesk</b></div><p className="nav-label">WORKSPACE</p><Link className={location.pathname==='/'?'active':''} to="/">▦　Dashboard</Link><div className="sidebar-note">Manage customer records, tailoring jobs, deadlines, and payments from one place.</div><div className="profile"><div className="avatar">{user?.name?.[0] || 'U'}</div><div><b>{user?.name}</b><small>{user?.role}</small></div></div></aside>
  <main className="main-area"><header className="topbar"><span>Tailoring Shop / Workspace</span><button className="outline" onClick={logout}>Log out</button></header><div className="content"><Routes><Route path="/" element={<Dashboard/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></div></main></div>
}
export default function App() {
  const { user } = useAuth()
  return <Routes><Route path="/login" element={localStorage.getItem('tailoring_token') && user ? <Navigate to="/" replace/> : <Login/>}/><Route element={<ProtectedRoute/>}><Route path="/*" element={<Layout/>}/></Route></Routes>
}
