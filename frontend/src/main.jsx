import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import TseOpsApp from './TseOpsApp.jsx'
import './index.css'

// /tse_ops is the internal hospital-onboarding UI; everything else is the
// normal MediZen app. Both are served the same index.html by the backend
// (see backend/main.py), so this is the only place that tells them apart.
const isTseOps = window.location.pathname.replace(/\/+$/, '') === '/tse_ops'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isTseOps ? <TseOpsApp /> : <App />}
  </React.StrictMode>,
)
