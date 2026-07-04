import { StrictMode } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { UserContextProvider } from './context/userContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserContextProvider>
        <App />
      </UserContextProvider>
      <Analytics/>
    </BrowserRouter>
  </StrictMode>,
)
