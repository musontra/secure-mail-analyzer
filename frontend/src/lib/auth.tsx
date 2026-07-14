import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AuthUser } from '../types'

// Oturum sessionStorage'da tutulur: sayfa yenilemede kaybolmaz,
// sekme kapanınca silinir (localStorage'a göre daha kısa ömürlü/güvenli tercih)
const STORAGE_KEY = 'auth'

interface AuthContextValue {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    try {
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  })

  const login = (next: AuthUser) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setUser(next)
  }

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.')
  return context
}
