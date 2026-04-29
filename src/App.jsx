import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { MmicePage } from './pages/MmicePage'
import { ShopPage } from './pages/ShopPage'
import './App.css'

const ROUTE_TRANSITION_MS = 680

function App() {
  const navigate = useNavigate()
  const [routeTransitionActive, setRouteTransitionActive] = useState(false)
  const navigateTimerRef = useRef(0)
  const finishTimerRef = useRef(0)

  const startRouteTransition = (targetPath) => {
    if (!targetPath || routeTransitionActive) return

    window.clearTimeout(navigateTimerRef.current)
    window.clearTimeout(finishTimerRef.current)

    setRouteTransitionActive(true)

    navigateTimerRef.current = window.setTimeout(() => {
      navigate(targetPath)
    }, ROUTE_TRANSITION_MS)

    finishTimerRef.current = window.setTimeout(() => {
      setRouteTransitionActive(false)
    }, ROUTE_TRANSITION_MS)
  }

  useEffect(() => {
    return () => {
      window.clearTimeout(navigateTimerRef.current)
      window.clearTimeout(finishTimerRef.current)
    }
  }, [])

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<HomePage onOpenMmice={startRouteTransition} onOpenShop={() => startRouteTransition('/shop')} />}
        />
        <Route path="/warmupbeforeburial" element={<MmicePage onBack={() => navigate('/')} />} />
        <Route path="/shop" element={<ShopPage onBack={() => startRouteTransition('/')} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {routeTransitionActive ? (
        <div className="sprite-transition-overlay" aria-hidden="true" />
      ) : null}
    </>
  )
}

export default App
