import { useEffect, useState } from 'react'
import { useSpotlightEffect } from '../hooks/useSpotlightEffect'

export function SpotlightOverlay() {
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)
  const canvasRef = useSpotlightEffect({
    spotlightSize: 300,
    spotlightIntensity: 1,
    fadeSpeed: 0.055,
    glowColor: '255, 255, 255',
    pulseSpeed: 3200,
  })

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)')
    const syncPointer = () => setIsCoarsePointer(media.matches)
    syncPointer()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', syncPointer)
      return () => media.removeEventListener('change', syncPointer)
    }

    media.addListener(syncPointer)
    return () => media.removeListener(syncPointer)
  }, [])

  if (isCoarsePointer) return null

  return <canvas className="spotlight-overlay" ref={canvasRef} aria-hidden="true" />
}
