import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function ProtectedRoute({ adminOnly = false }) {
  const { user } = useAuth()
  if (!localStorage.getItem('tailoring_token') || !user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
