// ⚙️ BASE DEL PROYECTO — no modificar sin avisar al grupo.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './styles/theme.css'

import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { aplicarModoGuardado } from './animations/modoNoche.js'

aplicarModoGuardado() // modo claro/noche recordado

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
