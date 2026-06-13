import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DashboardApp from './DashboardApp.jsx'

const isDashboard = window.location.pathname.startsWith('/dashboard')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDashboard ? <DashboardApp /> : <App />}
  </StrictMode>,
)
