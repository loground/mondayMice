import { useEffect, useRef, useState } from 'react'
import { DefaultLoadingManager } from 'three'
import { ModeSwitcher } from './components/ModeSwitcher'
import { ModelSlot } from './components/ModelSlot'
import { PageLoader } from './components/PageLoader'
import { SpotlightOverlay } from './components/SpotlightOverlay'
import './App.css'

function App() {
  const [mode, setMode] = useState('regular')
  const [selectedModel, setSelectedModel] = useState(null)
  const [selectedMotion, setSelectedMotion] = useState({ x: 0, y: 0 })
  const [panelVisible, setPanelVisible] = useState(false)
  const [assetsReady, setAssetsReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  const closeTimerRef = useRef(0)
  const motionRafRef = useRef(0)

  const computeCornerMotion = (element, side) => {
    if (!element) return { x: 0, y: 0 }

    const rect = element.getBoundingClientRect()
    const scale = 0.3
    const margin = 14

    const currentCenterX = rect.left + rect.width / 2
    const currentCenterY = rect.top + rect.height / 2

    const targetCenterX =
      side === 'left'
        ? margin + (rect.width * scale) / 2
        : window.innerWidth - margin - (rect.width * scale) / 2
    const targetCenterY = margin + (rect.height * scale) / 2

    return {
      x: targetCenterX - currentCenterX,
      y: targetCenterY - currentCenterY,
    }
  }

  const toggleModel = (modelId, element) => {
    if (selectedModel === null) {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      if (motionRafRef.current) window.cancelAnimationFrame(motionRafRef.current)
      const side = modelId === 'basket' ? 'left' : 'right'
      const targetMotion = computeCornerMotion(element, side)
      setSelectedMotion({ x: 0, y: 0 })
      setSelectedModel(modelId)
      setPanelVisible(true)

      // Trigger movement on the next frame so browser animates in-place -> corner.
      motionRafRef.current = window.requestAnimationFrame(() => {
        motionRafRef.current = window.requestAnimationFrame(() => {
          setSelectedMotion(targetMotion)
        })
      })
      return
    }

    if (selectedModel === modelId) {
      setPanelVisible(false)
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      setSelectedModel(null)
      setSelectedMotion({ x: 0, y: 0 })
    }
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      if (motionRafRef.current) window.cancelAnimationFrame(motionRafRef.current)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const prevOnStart = DefaultLoadingManager.onStart
    const prevOnLoad = DefaultLoadingManager.onLoad

    DefaultLoadingManager.onStart = (...args) => {
      if (mounted) setAssetsReady(false)
      if (typeof prevOnStart === 'function') prevOnStart(...args)
    }

    DefaultLoadingManager.onLoad = (...args) => {
      if (mounted) setAssetsReady(true)
      if (typeof prevOnLoad === 'function') prevOnLoad(...args)
    }

    // In case everything is already cached by the time this effect runs.
    const warmCacheTimer = window.setTimeout(() => {
      if (mounted) setAssetsReady(true)
    }, 250)

    const onTvVideoReady = () => {
      if (mounted) setVideoReady(true)
    }
    window.addEventListener('tv-video-ready', onTvVideoReady)

    return () => {
      mounted = false
      window.clearTimeout(warmCacheTimer)
      window.removeEventListener('tv-video-ready', onTvVideoReady)
      DefaultLoadingManager.onStart = prevOnStart
      DefaultLoadingManager.onLoad = prevOnLoad
    }
  }, [])

  const isFocused = selectedModel !== null
  const focusSide =
    selectedModel === 'tv' ? 'right' : selectedModel === 'basket' ? 'left' : 'right'
  const contentFromSide = focusSide === 'right' ? 'left' : 'right'
  const pageReady = assetsReady && videoReady
  const tvPanelVisible = selectedModel === 'tv' && panelVisible
  const cartPanelVisible = selectedModel === 'cart' && panelVisible

  return (
    <main className={`page ${mode === 'spotlight' ? 'page--spotlight' : 'page--regular'}`}>
      {!pageReady ? <PageLoader /> : null}
      <ModeSwitcher mode={mode} onChange={setMode} />

      <section
        className={`layout ${isFocused ? `layout--focused layout--to-${focusSide}` : ''}`}
        aria-label="Monday Mice homepage"
      >
        <ModelSlot
          className="tv"
          modelPath="/tv.glb"
          modelType="tv"
          tiltSign={1}
          mode={mode}
          selected={selectedModel === 'tv'}
          away={selectedModel === 'cart'}
          selectedMotion={selectedModel === 'tv' ? selectedMotion : undefined}
          onToggle={(element) => toggleModel('tv', element)}
        />

        <img
          className={`title ${isFocused ? 'is-away' : ''}`}
          src="/images/monday-mice.png"
          alt="Monday Mice"
        />

        <ModelSlot
          className="basket"
          modelPath="/cart.glb"
          modelType="cart"
          tiltSign={-1}
          mode={mode}
          selected={selectedModel === 'cart'}
          away={selectedModel === 'tv'}
          selectedMotion={selectedModel === 'cart' ? selectedMotion : undefined}
          onToggle={(element) => toggleModel('cart', element)}
        />
      </section>

      <section className={`tv-banners-panel ${tvPanelVisible ? 'is-visible' : ''}`} aria-hidden={!tvPanelVisible}>
        <div className="tv-banners">
          <div className="tv-banner">
            <div className="tv-banner__image" style={{ backgroundImage: "url('/banners/banner1.png')" }} />
            <div className="tv-banner__overlay" />
          </div>
          <div className="tv-banner">
            <div className="tv-banner__image" style={{ backgroundImage: "url('/banners/banner1.png')" }} />
            <div className="tv-banner__overlay" />
          </div>
          <div className="tv-banner">
            <div className="tv-banner__image" style={{ backgroundImage: "url('/banners/banner1.png')" }} />
            <div className="tv-banner__overlay" />
          </div>
        </div>
      </section>

      <article
        className={`content-panel content-panel--from-${contentFromSide} ${cartPanelVisible ? 'is-visible' : ''}`}
      >
        <h2>Cart Content</h2>
        <p>This is the centered content area for the Cart model. Replace with your actual section.</p>
      </article>

      {mode === 'spotlight' ? <SpotlightOverlay /> : null}
    </main>
  )
}

export default App
