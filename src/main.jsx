import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TelAviv2026App from './TelAviv2026App.jsx'
import TraineeApp from './TraineeApp.jsx'

function handleGitHubPagesRedirect() {
  const redirectPath = sessionStorage.getItem('redirect_path')
  if (redirectPath) {
    sessionStorage.removeItem('redirect_path')
    window.history.replaceState(null, '', redirectPath)
  }
}

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/telaviv2026/asaf') {
    return { type: 'trainee', traineeId: 'asaf' }
  }

  if (path === '/telaviv2026') {
    return { type: 'telaviv2026' }
  }

  // Backwards compatibility: redirect /asaf to /telaviv2026/asaf
  if (path === '/asaf') {
    window.history.replaceState(null, '', '/telaviv2026/asaf')
    return { type: 'trainee', traineeId: 'asaf' }
  }

  return { type: 'home' }
}

handleGitHubPagesRedirect()

function Root() {
  const route = getRoute()

  if (route.type === 'trainee') {
    return <TraineeApp traineeId={route.traineeId} />
  }

  if (route.type === 'telaviv2026') {
    return <TelAviv2026App />
  }

  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
