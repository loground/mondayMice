import { useSpotlightEffect } from '../hooks/useSpotlightEffect'

export function SpotlightOverlay() {
  const canvasRef = useSpotlightEffect({
    spotlightSize: 300,
    spotlightIntensity: 1,
    fadeSpeed: 0.055,
    glowColor: '255, 255, 255',
    pulseSpeed: 3200,
  })

  return <canvas className="spotlight-overlay" ref={canvasRef} aria-hidden="true" />
}
