// ⚙️ BASE DEL PROYECTO — sesión del usuario disponible en toda la app.
// Uso en cualquier componente:
//   const { user, isAuthenticated, hasRole, login, register, logout } = useAuth()
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi, tokenStorage } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Solo hay que esperar si hay un token guardado para validar.
  const [loading, setLoading] = useState(() => !!tokenStorage.get())

  // Al cargar la página, si hay token guardado, recupera el usuario.
  useEffect(() => {
    if (!tokenStorage.get()) return
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false))
  }, [])

  const saveSession = ({ token, user }) => {
    tokenStorage.set(token)
    setUser(user)
    return user
  }

  const login = useCallback(async (email, password) => saveSession(await authApi.login({ email, password })), [])
  const register = useCallback(async (data) => saveSession(await authApi.register(data)), [])
  const loginWithGoogle = useCallback(async (credential) => saveSession(await authApi.google(credential)), [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    hasRole: (...roles) => !!user && roles.includes(user.role),
    login,
    register,
    loginWithGoogle,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
