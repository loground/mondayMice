import { useEffect, useMemo, useRef, useState } from 'react'
import { DefaultLoadingManager } from 'three'
import { ModelSlot } from './components/ModelSlot'
import { PageLoader } from './components/PageLoader'
import { SpotlightOverlay } from './components/SpotlightOverlay'
import './App.css'

function App() {
  const [mode] = useState('regular')
  const [selectedModel, setSelectedModel] = useState(null)
  const [selectedMotion, setSelectedMotion] = useState({ x: 0, y: 0 })
  const [panelVisible, setPanelVisible] = useState(false)
  const [assetsReady, setAssetsReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [tvBannersVisible, setTvBannersVisible] = useState(false)
  const [tvCanvasVersion, setTvCanvasVersion] = useState(0)
  const [tvSlotVersion, setTvSlotVersion] = useState(0)
  const [tvModelVersion, setTvModelVersion] = useState(0)
  const [bannerFilter, setBannerFilter] = useState('all')
  const [returnSwipe, setReturnSwipe] = useState('')
  const [spriteTransitionActive, setSpriteTransitionActive] = useState(false)
  const [suppressSelectTransition, setSuppressSelectTransition] = useState(false)
  const [forceBackVideo, setForceBackVideo] = useState(false)

  const closeTimerRef = useRef(0)
  const motionRafRef = useRef(0)
  const tvBannersPanelRef = useRef(null)
  const returnSwipeTimerRef = useRef(0)
  const spriteTransitionTimerRef = useRef(0)
  const unsuppressTimerRef = useRef(0)
  const DESKTOP_SPRITE_MS = 680
  const DESKTOP_NO_FLY_SUPPRESS_MS = 900
  const isFocused = selectedModel !== null
  const focusSide =
    selectedModel === 'tv' ? 'right' : selectedModel === 'basket' ? 'left' : 'right'
  const contentFromSide = focusSide === 'right' ? 'left' : 'right'
  const pageReady = assetsReady && videoReady
  const tvPanelVisible = selectedModel === 'tv' && panelVisible && tvBannersVisible
  const cartPanelVisible = selectedModel === 'cart' && panelVisible
  const tvBanners = useMemo(
    () => [
      {
        id: 'tv-banner-0',
        delay: '90ms',
        image: '/banners/mmice.webp',
        category: 'skate',
      },
      // Add next banners one by one here.
      // {
      //   id: 'tv-banner-1',
      //   delay: '160ms',
      //   image: '/banners/next.webp',
      // },
    ],
    [],
  )
  const bannerFilters = useMemo(
    () => [
      { id: 'all', label: 'ALL' },
      { id: 'skate', label: 'SKATE' },
      { id: 'clothes', label: 'CLOTHES' },
      { id: 'random', label: 'RANDOM' },
    ],
    [],
  )
  const filteredTvBanners = useMemo(() => {
    if (bannerFilter === 'all') return tvBanners
    return tvBanners.filter((banner) => banner.category === bannerFilter)
  }, [bannerFilter, tvBanners])
  const spotlightImages = useMemo(
    () =>
      ['/spotlightImages/test1.png', '/spotlightImages/test2.png', '/spotlightImages/test3.png'].map((src, index) => ({
        src,
        id: `spotlight-image-${index}`,
        top: `${12 + Math.random() * 72}%`,
        left: `${8 + Math.random() * 82}%`,
        rotate: `${-18 + Math.random() * 36}deg`,
        scale: 0.68 + Math.random() * 0.55,
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
    const isMobile = window.matchMedia('(max-width: 900px)').matches

    if (selectedModel === null) {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      if (motionRafRef.current) window.cancelAnimationFrame(motionRafRef.current)
      if (spriteTransitionTimerRef.current) window.clearTimeout(spriteTransitionTimerRef.current)
      if (unsuppressTimerRef.current) window.clearTimeout(unsuppressTimerRef.current)
      const side = modelId === 'basket' ? 'left' : 'right'
      const cornerScale = 0.33
      let targetMotion = computeCornerMotion(element, side, cornerScale)

      if (modelId === 'tv') {
        setSpriteTransitionActive(true)
        spriteTransitionTimerRef.current = window.setTimeout(() => {
          setSuppressSelectTransition(true)
          setSelectedMotion(targetMotion)
          setSelectedModel(modelId)
          setPanelVisible(true)
          setTvBannersVisible(true)
          setForceBackVideo(true)
          setSpriteTransitionActive(false)
          unsuppressTimerRef.current = window.setTimeout(
            () => setSuppressSelectTransition(false),
            DESKTOP_NO_FLY_SUPPRESS_MS,
          )
        }, DESKTOP_SPRITE_MS)
        return
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
      if (modelId === 'tv') {
        if (spriteTransitionTimerRef.current) window.clearTimeout(spriteTransitionTimerRef.current)
        if (unsuppressTimerRef.current) window.clearTimeout(unsuppressTimerRef.current)
        setSpriteTransitionActive(true)
        setTvCanvasVersion((prev) => prev + 1)
        spriteTransitionTimerRef.current = window.setTimeout(() => {
          setSuppressSelectTransition(true)
          setPanelVisible(false)
          setSelectedModel(null)
          setSelectedMotion({ x: 0, y: 0 })
          setTvBannersVisible(false)
          setForceBackVideo(false)
          setTvModelVersion((prev) => prev + 1)
          setTvSlotVersion((prev) => prev + 1)
          setSpriteTransitionActive(false)
          unsuppressTimerRef.current = window.setTimeout(
            () => setSuppressSelectTransition(false),
            DESKTOP_NO_FLY_SUPPRESS_MS,
          )
        }, DESKTOP_SPRITE_MS)
        return
      }

      setPanelVisible(false)
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      if (returnSwipeTimerRef.current) window.clearTimeout(returnSwipeTimerRef.current)
      if (isMobile && modelId === 'tv') {
        setReturnSwipe('right')
        returnSwipeTimerRef.current = window.setTimeout(() => setReturnSwipe(''), 920)
      } else if (isMobile && modelId === 'basket') {
        setReturnSwipe('left')
        returnSwipeTimerRef.current = window.setTimeout(() => setReturnSwipe(''), 920)
      }
      setSelectedModel(null)
      setSelectedMotion({ x: 0, y: 0 })
    }
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      if (motionRafRef.current) window.cancelAnimationFrame(motionRafRef.current)
      if (returnSwipeTimerRef.current) window.clearTimeout(returnSwipeTimerRef.current)
      if (spriteTransitionTimerRef.current) window.clearTimeout(spriteTransitionTimerRef.current)
      if (unsuppressTimerRef.current) window.clearTimeout(unsuppressTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (selectedModel === 'tv' && panelVisible) {
      setTvBannersVisible(true)
      return undefined
    }
    setTvBannersVisible(false)
    return undefined
  }, [selectedModel, panelVisible, spriteTransitionActive])

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
        threshold: 0.01,
        rootMargin: '0px 0px 20% 0px',
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
      {/* Switcher hidden for now by request */}
      {spriteTransitionActive ? (
        <div className="sprite-transition-overlay" aria-hidden="true">
          <audio className="hidden-audio" src="/tvchannels/tvSound.mp3" autoPlay preload="auto" />
        </div>
      ) : null}
      {mode === 'spotlight' ? (
        <div className="spotlight-bg-images" aria-hidden="true">
          {spotlightImages.map((item) => (
            <img
              key={item.id}
              className="spotlight-bg-image"
              src={item.src}
              alt=""
              style={{
                top: item.top,
                left: item.left,
                '--spot-rot': item.rotate,
                '--spot-scale': item.scale,
              }}
            />
          ))}
        </div>
      ) : null}

      <section
        className={`layout ${isFocused ? `layout--focused layout--to-${focusSide}` : ''} ${returnSwipe ? `layout--return-${returnSwipe}` : ''} ${suppressSelectTransition ? 'layout--suppress-select' : ''}`}
        aria-label="Monday Mice homepage"
      >
        <ModelSlot
          key={`tv-slot-${tvSlotVersion}`}
          canvasKey={`tv-canvas-${tvCanvasVersion}`}
          className="tv"
          modelPath="/tv.glb"
          modelType="tv"
          tiltSign={1}
          mode={mode}
          selected={selectedModel === 'tv'}
          modelVersion={tvModelVersion}
          forceBackVideo={forceBackVideo}
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
          canvasKey="cart-canvas"
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
          {filteredTvBanners.map((banner) => (
            <div
              key={banner.id}
              className="tv-banner"
              style={{
                '--banner-delay': banner.delay,
              }}
            >
              <img className="tv-banner__image" src={banner.image} alt="" />
              <div className="tv-banner__overlay" />
              <div className="tv-banner__label">Warm-up before burial.</div>
            </div>
          ))}
          <div className={`tv-filters ${tvPanelVisible ? 'is-visible' : ''}`}>
            {bannerFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`tv-filter-btn ${bannerFilter === filter.id ? 'is-active' : ''}`}
                onClick={() => setBannerFilter((prev) => prev)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="tv-footer-slot" aria-hidden="true">
            <img className="tv-footer-slot__image" src="/images/footer.png" alt="" />
          </div>
        </div>
      </section>
      <div className={`tv-scroll-header ${tvPanelVisible ? 'is-visible' : ''}`} aria-hidden="true" />
      <div className={`tv-scroll-footer-fade ${tvPanelVisible ? 'is-visible' : ''}`} aria-hidden="true" />

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
