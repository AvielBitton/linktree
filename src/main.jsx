import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TraineeApp from './TraineeApp.jsx'

// Handle GitHub Pages SPA redirect
function handleGitHubPagesRedirect() {
  const redirectPath = sessionStorage.getItem('redirect_path')
  if (redirectPath) {
    sessionStorage.removeItem('redirect_path')
    window.history.replaceState(null, '', redirectPath)
  }
}

// Simple path-based routing
// Supports: /asaf, /trainee/asaf, etc.
function getTraineeFromPath() {
  const path = window.location.pathname
  
  // Check for direct trainee path like /asaf
  const traineeIds = ['asaf']
  for (const id of traineeIds) {
    if (path === `/${id}` || path === `/${id}/`) {
      return id
    }
  }
  
  return null
}

// Handle redirect before rendering
handleGitHubPagesRedirect()

function Root() {
  const traineeId = getTraineeFromPath()
  
  if (traineeId) {
    return <TraineeApp traineeId={traineeId} />
  }
  
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

