// 🎨 DUEÑO: Integrante A — entrada de la página de prueba (demo-animaciones.html)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../../styles/theme.css'
import Demo from './Demo.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
