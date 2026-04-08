import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [tvBannersVisible, setTvBannersVisible] = useState(false)
  const [tvCanvasVersion, setTvCanvasVersion] = useState(0)
  const [returnSwipe, setReturnSwipe] = useState('')

  const closeTimerRef = useRef(0)
  const motionRafRef = useRef(0)
  const tvBannersPanelRef = useRef(null)
  const tvBannersTimerRef = useRef(0)
  const returnSwipeTimerRef = useRef(0)
  const TV_BANNERS_OPEN_DELAY_MS = 520
  const isFocused = selectedModel !== null
  const focusSide =
    selectedModel === 'tv' ? 'right' : selectedModel === 'basket' ? 'left' : 'right'
  const contentFromSide = focusSide === 'right' ? 'left' : 'right'
  const pageReady = assetsReady && videoReady
  const tvPanelVisible = selectedModel === 'tv' && panelVisible && tvBannersVisible
  const cartPanelVisible = selectedModel === 'cart' && panelVisible
  const tvBanners = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => ({
        id: `tv-banner-${index}`,
        delay: `${120 + (index % 5) * 70}ms`,
      })),
    [],
  )

  const computeCornerMotion = (element, side, cornerScale = 0.33, lockY = false) => {
    if (!element) return { x: 0, y: 0 }

    const rect = element.getBoundingClientRect()
    const margin = 14

    const currentCenterX = rect.left + rect.width / 2
    const currentCenterY = rect.top + rect.height / 2

    const targetCenterX =
      side === 'left'
        ? margin + (rect.width * cornerScale) / 2
        : window.innerWidth - margin - (rect.width * cornerScale) / 2
    const targetCenterY = lockY ? currentCenterY : margin + (rect.height * cornerScale) / 2

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
      const isMobile = window.matchMedia('(max-width: 900px)').matches
      const cornerScale = isMobile ? 1 : 0.33
      let targetMotion = computeCornerMotion(element, side, cornerScale)

      if (isMobile && modelId === 'tv') {
        const basketElement = document.querySelector('.model-slot.basket')
        if (basketElement) {
          const fromRect = element.getBoundingClientRect()
          const toRect = basketElement.getBoundingClientRect()
          targetMotion = {
            x: toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2),
            y: 0,
          }
        } else {
          targetMotion = computeCornerMotion(element, side, cornerScale, true)
        }
      }
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
      if (returnSwipeTimerRef.current) window.clearTimeout(returnSwipeTimerRef.current)
      if (window.matchMedia('(max-width: 900px)').matches && modelId === 'tv') {
        setReturnSwipe('right')
        returnSwipeTimerRef.current = window.setTimeout(() => setReturnSwipe(''), 920)
      } else if (window.matchMedia('(max-width: 900px)').matches && modelId === 'basket') {
        setReturnSwipe('left')
        returnSwipeTimerRef.current = window.setTimeout(() => setReturnSwipe(''), 920)
      }
      setSelectedModel(null)
      setSelectedMotion({ x: 0, y: 0 })
      if (modelId === 'tv') setTvCanvasVersion((prev) => prev + 1)
    }
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      if (motionRafRef.current) window.cancelAnimationFrame(motionRafRef.current)
      if (tvBannersTimerRef.current) window.clearTimeout(tvBannersTimerRef.current)
      if (returnSwipeTimerRef.current) window.clearTimeout(returnSwipeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (tvBannersTimerRef.current) window.clearTimeout(tvBannersTimerRef.current)
    if (selectedModel === 'tv' && panelVisible) {
      const isMobile = window.matchMedia('(max-width: 900px)').matches
      setTvBannersVisible(false)
      if (isMobile) {
        setTvBannersVisible(true)
        return undefined
      }
      tvBannersTimerRef.current = window.setTimeout(() => {
        setTvBannersVisible(true)
      }, TV_BANNERS_OPEN_DELAY_MS)
      return undefined
    }
    setTvBannersVisible(false)
    return undefined
  }, [selectedModel, panelVisible])

  useEffect(() => {
    const panel = tvBannersPanelRef.current
    if (!panel) return undefined

    const banners = Array.from(panel.querySelectorAll('.tv-banner'))
    banners.forEach((banner) => banner.classList.remove('is-revealed'))

    if (!tvPanelVisible) return undefined

    const observer = new IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-revealed')
          activeObserver.unobserve(entry.target)
        })
      },
      {
        root: panel,
        threshold: 0.3,
        rootMargin: '0px 0px -8% 0px',
      },
    )

    banners.forEach((banner) => observer.observe(banner))
    return () => observer.disconnect()
  }, [tvPanelVisible])

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

  return (
    <main className={`page ${mode === 'spotlight' ? 'page--spotlight' : 'page--regular'}`}>
      {!pageReady ? <PageLoader /> : null}
      <ModeSwitcher mode={mode} onChange={setMode} />

      <section
        className={`layout ${isFocused ? `layout--focused layout--to-${focusSide}` : ''} ${returnSwipe ? `layout--return-${returnSwipe}` : ''}`}
        aria-label="Monday Mice homepage"
      >
        <ModelSlot
          canvasKey={`tv-${tvCanvasVersion}`}
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

      <section
        ref={tvBannersPanelRef}
        className={`tv-banners-panel tv-banners-panel--tv ${tvPanelVisible ? 'is-visible' : ''}`}
        aria-hidden={!tvPanelVisible}
      >
        <div className="tv-banners">
          {tvBanners.map((banner) => (
            <div
              key={banner.id}
              className="tv-banner"
              style={{
                '--banner-delay': banner.delay,
              }}
            >
              <div className="tv-banner__image" style={{ backgroundImage: "url('/banners/banner1.png')" }} />
              <div className="tv-banner__overlay" />
            </div>
          ))}
          <div className="tv-footer-slot" aria-hidden="true">
            <img className="tv-footer-slot__image" src="/images/footer.png" alt="" />
          </div>
        </div>
      </section>
      <div className={`tv-scroll-header ${tvPanelVisible ? 'is-visible' : ''}`} aria-hidden="true" />

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
