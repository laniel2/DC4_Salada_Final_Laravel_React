import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tailoring_user') || 'null')
    } catch {
      return null
    }
  })

  async function login(email, password) {
    const { data } = await api.post('/login', { email, password })
    localStorage.setItem('tailoring_token', data.token)
    localStorage.setItem('tailoring_user', JSON.stringify(data.user))
    setUser(data.user)
  }

  async function register(details) {
    const { data } = await api.post('/register', details)
    localStorage.setItem('tailoring_token', data.token)
    localStorage.setItem('tailoring_user', JSON.stringify(data.user))
    setUser(data.user)
  }

  async function logout() {
    try {
      await api.post('/logout')
    } catch {}

    localStorage.removeItem('tailoring_token')
    localStorage.removeItem('tailoring_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
